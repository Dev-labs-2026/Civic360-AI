import test from 'node:test';
import assert from 'node:assert/strict';
import aiService from '../services/aiService.js';
import { selectOfficerForComplaint } from '../services/officerAssignmentService.js';

const id = (digit) => digit.repeat(24);
const assignmentModels = ({ officers, workloads = [] }) => {
  let officerQuery;
  return {
    get officerQuery() { return officerQuery; },
    UserModel: {
      find(query) {
        officerQuery = query;
        return { select() { return this; }, lean: async () => officers };
      },
    },
    ComplaintModel: {
      aggregate: async (pipeline) => {
        assert.deepEqual(pipeline[0].$match.status.$in, ['Pending', 'Assigned', 'In Progress']);
        return workloads;
      },
    },
  };
};

test('A: open manhole text classifies to drainage and existing rules flag school as critical', () => {
  const analysis = aiService.analyzeComplaint({ title: 'Open manhole near school', description: '' });
  return analysis.then((result) => {
    assert.equal(result.suggestedCategory, 'Drainage');
    assert.equal(result.recommendedDepartment, 'Drainage Department');
    assert.equal(result.suggestedPriority, 'Critical');
  });
});

test('B-E: category routing uses only configured departments', () => {
  assert.equal(aiService.classifyComplaint('Deep pothole').category, 'Pothole');
  assert.equal(aiService.recommendDepartment('Pothole'), 'PWD / Roads');
  assert.equal(aiService.recommendDepartment('Road Damage'), 'PWD / Roads');
  assert.equal(aiService.recommendDepartment('Garbage'), 'Sanitation');
  assert.equal(aiService.recommendDepartment('Broken Streetlight'), 'Electrical');
  assert.equal(aiService.recommendDepartment('Water Leakage'), 'Water Department');
});

test('F: matching-ward officers take precedence, then lowest active workload wins', async () => {
  const models = assignmentModels({
    officers: [
      { _id: id('1'), name: 'Low workload, other ward', ward: 'Howrah • Ward 18' },
      { _id: id('2'), name: 'Higher workload, target ward', ward: 'Kolkata • Ward 12' },
      { _id: id('3'), name: 'Lowest workload, target ward', ward: 'Kolkata • Ward 12' },
    ],
    workloads: [{ _id: id('1'), workload: 0 }, { _id: id('2'), workload: 4 }, { _id: id('3'), workload: 2 }],
  });
  const result = await selectOfficerForComplaint({ department: 'PWD / Roads', ward: 'Kolkata • Ward 12', ...models });
  assert.equal(result.officer._id, id('3'));
  assert.match(result.explanation, /Matched department and ward/);
});

test('G: with no ward match, department fallback selects lowest workload', async () => {
  const models = assignmentModels({
    officers: [{ _id: id('1'), ward: 'Howrah • Ward 18' }, { _id: id('2'), ward: 'Durgapur • Zone A' }],
    workloads: [{ _id: id('1'), workload: 3 }, { _id: id('2'), workload: 1 }],
  });
  const result = await selectOfficerForComplaint({ department: 'Sanitation', ward: 'Kolkata • Ward 12', ...models });
  assert.equal(result.officer._id, id('2'));
  assert.match(result.explanation, /no ward-specific officer/);
});

test('H: no eligible officer leaves the complaint unassigned', async () => {
  const models = assignmentModels({ officers: [] });
  const result = await selectOfficerForComplaint({ department: 'Electrical', ward: 'Kolkata • Ward 12', ...models });
  assert.equal(result.officer, null);
  assert.match(result.explanation, /remains in the department pool/);
});

test('I: inactive officers are excluded by the eligibility query', async () => {
  const models = assignmentModels({ officers: [{ _id: id('1'), isActive: true, ward: 'Kolkata • Ward 12' }] });
  await selectOfficerForComplaint({ department: 'Electrical', ward: 'Kolkata • Ward 12', ...models });
  assert.deepEqual(models.officerQuery.isActive, { $ne: false });
});

test('Coordinates at zero remain valid for draft duplicate analysis', async () => {
  let candidateQuery;
  const ComplaintModel = {
    find(query) {
      candidateQuery = query;
      return { select() { return this; }, lean: async () => [] };
    },
  };
  const result = await aiService.analyzeComplaint({ title: 'Drainage', category: 'Drainage', latitude: 0, longitude: 0, ComplaintModel });
  assert.equal(result.duplicateDetected, false);
  assert.ok(candidateQuery);
});
