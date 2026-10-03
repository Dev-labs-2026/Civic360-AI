import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import Complaint from '../models/Complaint.js';
import { register } from '../controllers/authController.js';
import { createComplaint, getComplaintById, getComplaints, updateComplaint } from '../controllers/complaintController.js';
import { authorize } from '../middleware/auth.js';

const originals = new Map();
const mock = (object, key, implementation) => {
  if (!originals.has(`${object.modelName}.${key}`)) originals.set(`${object.modelName}.${key}`, [object, key, object[key]]);
  object[key] = implementation;
};
afterEach(() => {
  for (const [object, key, implementation] of originals.values()) object[key] = implementation;
  originals.clear();
});

const response = () => ({ statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const thenableQuery = (value) => ({
  populate() { return this; }, sort() { return this; }, skip() { return this; }, limit() { return this; },
  then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
});

test('A: public registration rejects admin role escalation', async () => {
  const res = response();
  await register({ body: { name: 'Test', email: 'test@example.org', password: 'password123', role: 'admin' } }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.success, false);
});

test('B: citizen cannot update another citizen complaint', async () => {
  mock(Complaint, 'findById', async () => ({ _id: 'c'.repeat(24), citizen: 'b'.repeat(24), status: 'Pending' }));
  const res = response();
  await updateComplaint({ params: { id: 'c'.repeat(24) }, user: { _id: 'a'.repeat(24), role: 'citizen' }, body: { title: 'Changed' } }, res);
  assert.equal(res.statusCode, 403);
});

test('C: citizen cannot mark own complaint resolved', async () => {
  mock(Complaint, 'findById', async () => ({ _id: 'c'.repeat(24), citizen: 'a'.repeat(24), status: 'Pending' }));
  const res = response();
  await updateComplaint({ params: { id: 'c'.repeat(24) }, user: { _id: 'a'.repeat(24), role: 'citizen' }, body: { status: 'Resolved' } }, res);
  assert.equal(res.statusCode, 403);
});

test('Citizen cannot set SLA fields directly', async () => {
  mock(Complaint, 'findById', async () => ({ _id: 'c'.repeat(24), citizen: 'a'.repeat(24), status: 'Pending' }));
  const res = response();
  await updateComplaint({ params: { id: 'c'.repeat(24) }, user: { _id: 'a'.repeat(24), role: 'citizen' }, body: { slaDeadline: '2030-01-01', escalationLevel: 0 } }, res);
  assert.equal(res.statusCode, 403);
});

test('D: officer cannot modify an unrelated department complaint', async () => {
  mock(Complaint, 'findById', async () => ({ _id: 'c'.repeat(24), citizen: 'b'.repeat(24), assignedOfficer: 'd'.repeat(24), department: 'Sanitation', status: 'Assigned' }));
  const res = response();
  await updateComplaint({ params: { id: 'c'.repeat(24) }, user: { _id: 'a'.repeat(24), role: 'officer', department: 'PWD / Roads' }, body: { status: 'In Progress' } }, res);
  assert.equal(res.statusCode, 403);
});

test('J: officer cannot read an unrelated department complaint', async () => {
  const item = { _id: 'c'.repeat(24), citizen: { _id: 'b'.repeat(24) }, assignedOfficer: null, department: 'Sanitation' };
  mock(Complaint, 'findById', () => thenableQuery(item));
  const res = response();
  await getComplaintById({ params: { id: 'c'.repeat(24) }, user: { _id: 'a'.repeat(24), role: 'officer', department: 'PWD / Roads' } }, res);
  assert.equal(res.statusCode, 403);
});

test('E: a citizen is denied admin-only API authorization', () => {
  const res = response();
  let continued = false;
  authorize('admin')({ user: { role: 'citizen' } }, res, () => { continued = true; });
  assert.equal(res.statusCode, 403);
  assert.equal(continued, false);
});

test('F: public tracking response omits complaint description and contact details', async () => {
  const item = {
    _id: 'c'.repeat(24), title: 'Pothole', description: 'Private reporter description', category: 'Pothole', status: 'Pending',
    latitude: 22, longitude: 88, citizen: { name: 'Citizen', email: 'private@example.org', phone: '123' },
    assignedOfficer: { name: 'Officer', email: 'officer@example.org', phone: '456', department: 'PWD / Roads' },
  };
  mock(Complaint, 'findById', () => thenableQuery(item));
  const res = response();
  await getComplaintById({ params: { id: 'c'.repeat(24) } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.complaint.description, undefined);
  assert.equal(JSON.stringify(res.body).includes('@'), false);
  assert.equal(res.body.complaint.assignedOfficer.name, 'Officer');
});

test('G: latitude outside the valid range is rejected', async () => {
  const res = response();
  await createComplaint({ user: { _id: 'a'.repeat(24), role: 'citizen' }, body: { title: 'Issue', description: 'Details', latitude: 91, longitude: 88 } }, res);
  assert.equal(res.statusCode, 400);
});

test('H: regex metacharacters in public search are escaped', async () => {
  let captured;
  mock(Complaint, 'countDocuments', async (query) => { captured = query; return 0; });
  mock(Complaint, 'find', (query) => { captured = query; return thenableQuery([]); });
  const res = response();
  await getComplaints({ query: { search: '.*' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(captured.$and[0].$or[0].title.source, '\\.\\*');
});
