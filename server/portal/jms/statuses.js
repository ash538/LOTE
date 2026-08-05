// Portal-side lifecycle of a translation request.
// draft -> submitted -> quoted -> in_production -> in_review -> delivered -> closed
// cancelled can be reached from any non-terminal state.
const REQUEST_STATUSES = [
  'draft',
  'submitted',
  'quoted',
  'in_production',
  'in_review',
  'delivered',
  'closed',
  'cancelled',
];

// JMS webhook event type -> portal request status
const JMS_EVENT_TO_STATUS = {
  'job.received': 'submitted',
  'job.quoted': 'quoted',
  'job.in_production': 'in_production',
  'job.in_review': 'in_review',
  'job.delivered': 'delivered',
  'job.cancelled': 'cancelled',
};

const TERMINAL_STATUSES = ['closed', 'cancelled'];

// Guard against out-of-order webhook delivery: never move a request
// backwards in the lifecycle (except into cancelled).
const STATUS_ORDER = REQUEST_STATUSES.reduce((acc, s, i) => ((acc[s] = i), acc), {});
function isForwardMove(from, to) {
  if (to === 'cancelled') return !TERMINAL_STATUSES.includes(from);
  return STATUS_ORDER[to] > STATUS_ORDER[from];
}

module.exports = { REQUEST_STATUSES, JMS_EVENT_TO_STATUS, TERMINAL_STATUSES, isForwardMove };
