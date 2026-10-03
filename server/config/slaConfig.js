// Configurable application/demo values. These are not official government SLAs.
export const SLA_DURATION_HOURS_BY_PRIORITY = Object.freeze({
  Critical: 4,
  High: 12,
  Medium: 24,
  Low: 72,
});

export const SLA_DUE_SOON_WINDOW_HOURS = 2;
export const SLA_ESCALATION_POLL_INTERVAL_MS = 60_000;
export const SLA_PROCESSING_BATCH_SIZE = 100;
export const ACTIVE_SLA_STATUSES = Object.freeze(['Pending', 'Assigned', 'In Progress']);
export const SLA_STATUSES = Object.freeze(['On Track', 'Due Soon', 'Overdue', 'Escalated', 'Resolved']);
