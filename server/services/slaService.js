import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { SLA_DURATION_HOURS_BY_PRIORITY, SLA_DUE_SOON_WINDOW_HOURS, SLA_ESCALATION_POLL_INTERVAL_MS, SLA_PROCESSING_BATCH_SIZE, ACTIVE_SLA_STATUSES } from '../config/slaConfig.js';
import { departmentQueryValues } from '../utils/departments.js';

const HOUR_MS = 60 * 60 * 1000;
const unresolvedFilter = { status: { $in: ACTIVE_SLA_STATUSES } };
const notEscalatedFilter = { $or: [{ escalationLevel: { $lt: 1 } }, { escalationLevel: { $exists: false } }] };

export const createSla = (priority, createdAt = new Date()) => {
  const slaDuration = SLA_DURATION_HOURS_BY_PRIORITY[priority] || SLA_DURATION_HOURS_BY_PRIORITY.Medium;
  return { slaDuration, slaDeadline: new Date(createdAt.getTime() + slaDuration * HOUR_MS) };
};

export const calculateSlaStatus = (complaint, now = new Date()) => {
  if (complaint.status === 'Resolved') return 'Resolved';
  if (complaint.status === 'Rejected') return null;
  if (!complaint.slaDeadline) return null;
  if (Number(complaint.escalationLevel || 0) > 0) return 'Escalated';
  const remainingMs = new Date(complaint.slaDeadline).getTime() - now.getTime();
  if (remainingMs <= 0) return 'Overdue';
  if (remainingMs <= SLA_DUE_SOON_WINDOW_HOURS * HOUR_MS) return 'Due Soon';
  return 'On Track';
};

const countNotificationsForDueSoon = async (complaint, { ComplaintModel, UserModel, NotificationModel, now }) => {
  let recipients = [];
  if (complaint.assignedOfficer) {
    const assigned = await UserModel.findOne({ _id: complaint.assignedOfficer, role: 'officer', isActive: { $ne: false } }).select('_id').lean();
    if (assigned) recipients = [assigned];
  } else {
    recipients = await UserModel.find({
      role: 'officer', isActive: { $ne: false },
      department: { $in: departmentQueryValues(complaint.department) },
    }).select('_id').limit(30).lean();
  }
  if (!recipients.length) return false;

  const claimed = await ComplaintModel.findOneAndUpdate({
    _id: complaint._id,
    status: { $in: ACTIVE_SLA_STATUSES },
    slaDeadline: { $gt: now, $lte: new Date(now.getTime() + SLA_DUE_SOON_WINDOW_HOURS * HOUR_MS) },
    ...notEscalatedFilter,
    $and: [{ $or: [{ slaDueSoonNotifiedAt: null }, { slaDueSoonNotifiedAt: { $exists: false } }] }],
  }, { $set: { slaDueSoonNotifiedAt: now } }, { new: true }).select('_id');
  if (!claimed) return false;

  const reference = `#${String(complaint._id).slice(-6).toUpperCase()}`;
  try {
    await NotificationModel.insertMany(recipients.map((recipient) => ({
      user: recipient._id,
      title: 'Complaint SLA Due Soon',
      message: `Complaint ${reference} is approaching its configured application SLA deadline.`,
      complaintId: complaint._id,
      type: 'system',
    })));
  } catch (error) {
    await ComplaintModel.updateOne({ _id: complaint._id, slaDueSoonNotifiedAt: now }, { $set: { slaDueSoonNotifiedAt: null } });
    throw error;
  }
  return true;
};

export const processDueSoonNotifications = async ({ now = new Date(), ComplaintModel = Complaint, UserModel = User, NotificationModel = Notification } = {}) => {
  const soon = new Date(now.getTime() + SLA_DUE_SOON_WINDOW_HOURS * HOUR_MS);
  const candidates = await ComplaintModel.find({
    ...unresolvedFilter,
    slaDeadline: { $gt: now, $lte: soon },
    $and: [
      { $or: notEscalatedFilter.$or },
      { $or: [{ slaDueSoonNotifiedAt: null }, { slaDueSoonNotifiedAt: { $exists: false } }] },
    ],
  }).select('_id assignedOfficer department slaDeadline').sort({ slaDeadline: 1 }).limit(SLA_PROCESSING_BATCH_SIZE).lean();
  let notified = 0;
  for (const complaint of candidates) {
    if (await countNotificationsForDueSoon(complaint, { ComplaintModel, UserModel, NotificationModel, now })) notified += 1;
  }
  return notified;
};

export const processOverdueEscalations = async ({ now = new Date(), ComplaintModel = Complaint, UserModel = User, NotificationModel = Notification } = {}) => {
  const candidates = await ComplaintModel.find({
    ...unresolvedFilter,
    slaDeadline: { $lte: now },
    ...notEscalatedFilter,
  }).select('_id status assignedOfficer citizen department slaDeadline').sort({ slaDeadline: 1 }).limit(SLA_PROCESSING_BATCH_SIZE).lean();
  const authority = await UserModel.findOne({ role: 'admin', isActive: { $ne: false } }).select('_id').sort({ _id: 1 }).lean();
  let escalated = 0;

  for (const complaint of candidates) {
    const reason = 'Escalated because the configured application SLA deadline passed without resolution.';
    const claim = await ComplaintModel.findOneAndUpdate({
      _id: complaint._id,
      status: complaint.status,
      slaDeadline: { $lte: now },
      ...notEscalatedFilter,
    }, {
      $inc: { escalationLevel: 1 },
      $set: { escalatedTo: authority?._id || null },
      $push: {
        escalationHistory: {
          timestamp: now,
          previousStatus: complaint.status,
          newStatus: 'Escalated',
          previousAssignee: complaint.assignedOfficer || null,
          newAssignee: authority?._id || null,
          escalationLevel: 1,
          reason,
        },
        timeline: { status: complaint.status, note: reason, ...(authority?._id ? { updatedBy: authority._id } : {}), timestamp: now },
      },
    }, { new: true, runValidators: true });
    if (!claim) continue;

    escalated += 1;
    const reference = `#${String(complaint._id).slice(-6).toUpperCase()}`;
    const notifications = [];
    if (authority?._id) notifications.push({
      user: authority._id,
      title: 'Complaint SLA Escalated',
      message: `Complaint ${reference} has been escalated because its configured SLA deadline passed.`,
      complaintId: complaint._id,
      type: 'system',
    });
    if (complaint.citizen) notifications.push({
      user: complaint.citizen,
      title: 'Complaint Deadline Exceeded',
      message: `Your complaint ${reference} has exceeded its expected response deadline and has been escalated for review.`,
      complaintId: complaint._id,
      type: 'status_update',
    });
    if (notifications.length) await NotificationModel.insertMany(notifications);
  }
  return escalated;
};

export const runSlaCycle = async (dependencies = {}) => {
  const now = dependencies.now || new Date();
  const escalated = await processOverdueEscalations({ ...dependencies, now });
  const dueSoonNotified = await processDueSoonNotifications({ ...dependencies, now });
  return { escalated, dueSoonNotified };
};

let schedulerHandle = null;
export const startSlaEscalationScheduler = () => {
  if (schedulerHandle) return schedulerHandle;
  const run = () => runSlaCycle().then(({ escalated, dueSoonNotified }) => {
    if (escalated || dueSoonNotified) console.info(`SLA cycle complete: ${escalated} escalated, ${dueSoonNotified} due-soon notifications.`);
  }).catch((error) => console.error('SLA processing cycle failed:', error.message));
  void run();
  schedulerHandle = setInterval(run, SLA_ESCALATION_POLL_INTERVAL_MS);
  schedulerHandle.unref?.();
  return schedulerHandle;
};

export const stopSlaEscalationScheduler = () => {
  if (schedulerHandle) clearInterval(schedulerHandle);
  schedulerHandle = null;
};
