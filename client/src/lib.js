// Shared formatting helpers and CRM constants

export const fmtMoney = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');

export const DEAL_STAGES = [
  { key: 'lead', label: 'Lead' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'proposal', label: 'Proposal Sent' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
];

export const stageLabel = (key) => DEAL_STAGES.find(s => s.key === key)?.label || key;

export const LIFECYCLE_STAGES = [
  { key: 'lead', label: 'Lead' },
  { key: 'prospect', label: 'Prospect' },
  { key: 'customer', label: 'Customer' },
  { key: 'past_customer', label: 'Past Customer' },
];

export const lifecycleLabel = (key) => LIFECYCLE_STAGES.find(s => s.key === key)?.label || key;

export const ACTIVITY_TYPES = [
  { key: 'note', label: 'Note', icon: '📝' },
  { key: 'call', label: 'Call', icon: '📞' },
  { key: 'email', label: 'Email', icon: '✉️' },
  { key: 'meeting', label: 'Meeting', icon: '🤝' },
  { key: 'task', label: 'Task', icon: '✅' },
];

export const activityIcon = (type) => ACTIVITY_TYPES.find(t => t.key === type)?.icon || '📝';
