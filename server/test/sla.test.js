import test from 'node:test';
import assert from 'node:assert/strict';
import { createSla, calculateSlaStatus, processOverdueEscalations, processDueSoonNotifications } from '../services/slaService.js';

const hour = 60 * 60 * 1000;
const now = new Date('2026-01-01T00:00:00.000Z');

test('A-B: demo priority SLA durations produce matching deadlines', () => {
  for (const [priority, duration] of [['Critical', 4], ['High', 12], ['Medium', 24], ['Low', 72]]) {
    const result = createSla(priority, now);
    assert.equal(result.slaDuration, duration);
    assert.equal(result.slaDeadline.getTime(), now.getTime() + duration * hour);
  }
});

test('C-F: SLA status is calculated dynamically and resolution wins after deadline', () => {
  assert.equal(calculateSlaStatus({ status: 'Assigned', slaDeadline: new Date(now.getTime() + 3 * hour) }, now), 'On Track');
  assert.equal(calculateSlaStatus({ status: 'Assigned', slaDeadline: new Date(now.getTime() + hour) }, now), 'Due Soon');
  assert.equal(calculateSlaStatus({ status: 'In Progress', slaDeadline: new Date(now.getTime() - 1) }, now), 'Overdue');
  assert.equal(calculateSlaStatus({ status: 'Resolved', slaDeadline: new Date(now.getTime() - 1) }, now), 'Resolved');
  assert.equal(calculateSlaStatus({ status: 'Pending', slaDeadline: now, escalationLevel: 1 }, now), 'Escalated');
});

test('G-I: overdue unresolved complaint escalates once and records history/notifications', async () => {
  const complaint = {
    _id: 'c'.repeat(24), status: 'Assigned', citizen: 'u'.repeat(24), assignedOfficer: 'o'.repeat(24),
    slaDeadline: new Date(now.getTime() - 1), escalationLevel: 0,
  };
  let level = 0;
  const events = [];
  const ComplaintModel = {
    find() { return { select() { return this; }, sort() { return this; }, limit() { return this; }, lean: async () => [complaint] }; },
    async findOneAndUpdate(filter, update) {
      if (level || filter.status !== complaint.status || filter.slaDeadline.$lte > now) return null;
      level += update.$inc.escalationLevel;
      events.push(update.$push.escalationHistory);
      return complaint;
    },
  };
  const inserted = [];
  const UserModel = { findOne() { return { select() { return this; }, sort() { return this; }, lean: async () => ({ _id: 'a'.repeat(24) }) }; } };
  const NotificationModel = { insertMany: async (items) => inserted.push(...items) };
  const dependencies = { now, ComplaintModel, UserModel, NotificationModel };
  assert.equal(await processOverdueEscalations(dependencies), 1);
  assert.equal(await processOverdueEscalations(dependencies), 0);
  assert.equal(level, 1);
  assert.equal(events[0].escalationLevel, 1);
  assert.equal(events[0].newStatus, 'Escalated');
  assert.equal(inserted.length, 2);
});

test('J: due-soon notifications are sent once to the assigned officer', async () => {
  const complaint = { _id: 'd'.repeat(24), status: 'Assigned', assignedOfficer: 'o'.repeat(24), slaDeadline: new Date(now.getTime() + hour) };
  let notifiedAt = null;
  const ComplaintModel = {
    find() { return { select() { return this; }, sort() { return this; }, limit() { return this; }, lean: async () => notifiedAt ? [] : [complaint] }; },
    findOneAndUpdate(_filter, update) { notifiedAt = update.$set.slaDueSoonNotifiedAt; return { select: async () => ({ _id: complaint._id }) }; },
  };
  const inserted = [];
  const UserModel = { findOne() { return { select() { return this; }, lean: async () => ({ _id: 'o'.repeat(24) }) }; } };
  const NotificationModel = { insertMany: async (items) => inserted.push(...items) };
  const dependencies = { now, ComplaintModel, UserModel, NotificationModel };
  assert.equal(await processDueSoonNotifications(dependencies), 1);
  assert.equal(await processDueSoonNotifications(dependencies), 0);
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].title, 'Complaint SLA Due Soon');
});
