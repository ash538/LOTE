import React, { useState, useEffect, useCallback } from 'react';
import { getActivities, createActivity, updateActivity, deleteActivity } from '../api';
import { ACTIVITY_TYPES, activityIcon, fmtDate } from '../lib';

// Activity feed + logger, scoped to a contact, company, or deal via the filter prop
// e.g. <ActivityTimeline filter={{ contact_id: id }} />
export default function ActivityTimeline({ filter }) {
  const [activities, setActivities] = useState([]);
  const [type, setType] = useState('note');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const filterKey = JSON.stringify(filter);
  const load = useCallback(async () => {
    setActivities(await getActivities(JSON.parse(filterKey)));
  }, [filterKey]);

  useEffect(() => { load(); }, [load]);

  const handleLog = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return;
    setSaving(true);
    await createActivity({ type, subject, body, due_date: type === 'task' ? dueDate : '', ...filter });
    setSubject('');
    setBody('');
    setDueDate('');
    setSaving(false);
    load();
  };

  const toggleTask = async (activity) => {
    await updateActivity(activity.id, { completed: !activity.completed });
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this activity?')) {
      await deleteActivity(id);
      load();
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: 16 }}>Activity</h3>

      <form onSubmit={handleLog} className="activity-form">
        <div className="filter-bar" style={{ marginBottom: 12 }}>
          {ACTIVITY_TYPES.map(t => (
            <button
              key={t.key}
              type="button"
              className={`filter-chip ${type === t.key ? 'active' : ''}`}
              onClick={() => setType(t.key)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div className="row">
          <div className="form-group" style={{ flex: 2 }}>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder={type === 'task' ? 'Task to do...' : `Log a ${type}...`}
            />
          </div>
          {type === 'task' && (
            <div className="form-group" style={{ flex: 1 }}>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          )}
          <div className="form-group" style={{ flex: 'none', minWidth: 'auto' }}>
            <button type="submit" className="btn btn-primary" disabled={!subject.trim() || saving}>
              {type === 'task' ? 'Add Task' : 'Log'}
            </button>
          </div>
        </div>
        <div className="form-group">
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={2} placeholder="Details (optional)..." />
        </div>
      </form>

      {activities.length === 0 ? (
        <div className="empty-state" style={{ padding: '30px 20px' }}>
          <p>No activity yet. Log a note, call, or task above.</p>
        </div>
      ) : (
        <div className="timeline">
          {activities.map(a => (
            <div key={a.id} className={`timeline-item ${a.type === 'task' && a.completed ? 'completed' : ''}`}>
              <span className="timeline-icon">{activityIcon(a.type)}</span>
              <div className="timeline-content">
                <div className="timeline-header">
                  {a.type === 'task' && (
                    <input
                      type="checkbox"
                      checked={!!a.completed}
                      onChange={() => toggleTask(a)}
                      title="Mark complete"
                    />
                  )}
                  <strong>{a.subject}</strong>
                  <span className="timeline-meta">
                    {a.type === 'task' && a.due_date ? `Due ${fmtDate(a.due_date)} · ` : ''}
                    {new Date(a.created_at + 'Z').toLocaleString()}
                  </span>
                  <button className="btn-link danger" onClick={() => handleDelete(a.id)}>×</button>
                </div>
                {a.body && <p className="timeline-body">{a.body}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
