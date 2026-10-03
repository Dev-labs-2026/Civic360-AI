import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import aiService from '../services/aiService.js';
import { createComplaint } from '../controllers/complaintController.js';

const originals = [];
const replace = (object, key, value) => {
  originals.push([object, key, object[key]]);
  object[key] = value;
};
afterEach(() => { for (const [object, key, value] of originals.splice(0).reverse()) object[key] = value; });
const response = () => ({ statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const id = 'c'.repeat(24);
const candidate = (options = {}) => ({
  _id: id, title: 'Blocked street drain', category: 'Drainage', status: 'In Progress', createdAt: new Date(), latitude: 0, longitude: 0,
  citizen: 'private citizen', email: 'private@example.org', phone: '555-0100', ...options,
});

test('A: same category, nearby and recent yields explainable duplicate match details', async () => {
  const nearby = candidate({ latitude: 0.0007 });
  const ComplaintModel = { find(query) { assert.equal(query.category, 'Drainage'); return { select() { return this; }, lean: async () => [nearby] }; } };
  const result = await aiService.analyzeComplaint({ category: 'Drainage', latitude: 0, longitude: 0, ComplaintModel });
  assert.equal(result.duplicateDetected, true);
  assert.equal(result.distanceMeters, 78);
  assert.equal(result.duplicateComplaint.category, 'Drainage');
  assert.equal(result.duplicateComplaint.status, 'In Progress');
  assert.equal(result.duplicateComplaint.email, undefined);
  assert.match(result.similarityReason, /Same category/);
  assert.ok(['High Match', 'Medium Match', 'Possible Match'].includes(result.matchLevel));
});

test('B: same category farther than 150m is not a duplicate', async () => {
  const ComplaintModel = { find() { return { select() { return this; }, lean: async () => [candidate({ latitude: 0.002 })] }; } };
  const result = await aiService.analyzeComplaint({ category: 'Drainage', latitude: 0, longitude: 0, ComplaintModel });
  assert.equal(result.duplicateDetected, false);
});

test('C: nearby complaint from a different category is excluded by the category rule', async () => {
  let query;
  const ComplaintModel = { find(value) { query = value; return { select() { return this; }, lean: async () => [] }; } };
  const result = await aiService.analyzeComplaint({ category: 'Drainage', latitude: 0, longitude: 0, ComplaintModel });
  assert.equal(query.category, 'Drainage');
  assert.equal(result.duplicateDetected, false);
});

test('D: duplicate lookup uses the configured 30-day recent window', async () => {
  let query;
  const ComplaintModel = { find(value) { query = value; return { select() { return this; }, lean: async () => [] }; } };
  await aiService.analyzeComplaint({ category: 'Drainage', latitude: 0, longitude: 0, ComplaintModel });
  assert.ok(query.createdAt.$gte instanceof Date);
  assert.ok(Date.now() - query.createdAt.$gte.getTime() >= 29 * 24 * 60 * 60 * 1000);
  assert.ok(Date.now() - query.createdAt.$gte.getTime() <= 30 * 24 * 60 * 60 * 1000 + 1000);
});

const mockCreationDependencies = (analysis) => {
  let createdData = null;
  replace(aiService, 'analyzeComplaint', async () => analysis);
  replace(User, 'find', () => ({ select() { return this; }, lean: async () => [] }));
  replace(Complaint, 'aggregate', async () => []);
  replace(Complaint, 'create', async (data) => { createdData = data; return { _id: id, ...data }; });
  replace(Notification, 'create', async () => ({}));
  replace(Complaint, 'findById', () => {
    const query = { populate() { return this; }, then(resolve, reject) { return Promise.resolve({ _id: id, ...createdData, toObject() { return { _id: id, ...createdData }; } }).then(resolve, reject); } };
    return query;
  });
  return { get createdData() { return createdData; } };
};
const createRequest = (confirmDifferentIssue = false) => ({
  user: { _id: 'u'.repeat(24), role: 'citizen' },
  body: { title: 'Drainage blockage', description: 'Separate broken drain nearby', category: 'Drainage', priority: 'Medium', latitude: 0, longitude: 0, ward: 'Kolkata • Ward 12', confirmDifferentIssue },
});
const analysis = {
  suggestedCategory: 'Drainage', confidenceScore: 0.9, detectedKeywords: [], suggestedPriority: 'Medium',
  recommendedDepartment: 'Drainage Department', duplicateDetected: true,
  duplicateComplaint: { _id: id, reference: 'CIV-CCCCCC', category: 'Drainage', status: 'In Progress', title: 'Blocked drain', createdAt: new Date() },
  distanceMeters: 78, matchLevel: 'Medium Match', similarityReason: 'Same category (Drainage), 78m away, reported 1 day(s) ago.',
};

test('E: server blocks duplicate submission until citizen explicitly continues', async () => {
  const mocks = mockCreationDependencies(analysis);
  const res = response();
  await createComplaint(createRequest(), res);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.code, 'POSSIBLE_DUPLICATE');
  assert.equal(mocks.createdData, null);
});

test('F-G: explicit different-issue confirmation creates complaint and stores the relationship', async () => {
  const mocks = mockCreationDependencies(analysis);
  const res = response();
  await createComplaint(createRequest(true), res);
  assert.equal(res.statusCode, 201);
  assert.equal(mocks.createdData.aiMetadata.duplicateDetected, true);
  assert.equal(String(mocks.createdData.aiMetadata.duplicateOf), id);
});

test('H: duplicate warning contains no private citizen contact information', async () => {
  mockCreationDependencies(analysis);
  const res = response();
  await createComplaint(createRequest(), res);
  assert.equal(JSON.stringify(res.body).includes('private@example.org'), false);
  assert.equal(JSON.stringify(res.body).includes('555-0100'), false);
});
