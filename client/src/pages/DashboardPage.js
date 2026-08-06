import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboard, updateActivity } from '../api';
import { fmtMoney, fmtDate, stageLabel, activityIcon, DEAL_STAGES } from '../lib';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  const load = () => getDashboard().then(setData);
  useEffect(() => { load(); }, []);

  if (!data) return <p>Loading...</p>;

  const pipelineByStage = Object.fromEntries(data.pipeline.map(p => [p.stage, p]));
  const openStages = DEAL_STAGES.filter(s => s.key !== 'won' && s.key !== 'lost');
  const maxStageValue = Math.max(1, ...openStages.map(s => pipelineByStage[s.key]?.value || 0));

  const quoteStatus = Object.fromEntries(data.quotesByStatus.map(q => [q.status, q.count]));

  const completeTask = async (id) => {
    await updateActivity(id, { completed: true });
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => navigate('/deals')}>View Pipeline</button>
          <button className="btn btn-primary" onClick={() => navigate('/quotes/new')}>+ New Quote</button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-value">{fmtMoney(data.openDeals.value)}</div>
          <div className="stat-label">Open pipeline · {data.openDeals.count} deal{data.openDeals.count === 1 ? '' : 's'}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{fmtMoney(data.wonThisMonth.value)}</div>
          <div className="stat-label">Won this month · {data.wonThisMonth.count} deal{data.wonThisMonth.count === 1 ? '' : 's'}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{data.counts.contacts}</div>
          <div className="stat-label"><Link to="/contacts">Contacts</Link> · {data.counts.companies} <Link to="/companies">companies</Link></div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{data.counts.quotes}</div>
          <div className="stat-label">
            <Link to="/quotes">Quotes</Link> · {quoteStatus.sent || 0} sent, {quoteStatus.accepted || 0} accepted
          </div>
        </div>
      </div>

      <div className="dash-columns">
        {/* Pipeline breakdown */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Pipeline by Stage</h3>
          {openStages.map(s => {
            const p = pipelineByStage[s.key];
            return (
              <div key={s.key} className="pipeline-row" onClick={() => navigate('/deals')}>
                <span className="pipeline-stage">{s.label}</span>
                <div className="pipeline-bar-track">
                  <div className="pipeline-bar" style={{ width: `${((p?.value || 0) / maxStageValue) * 100}%` }} />
                </div>
                <span className="pipeline-value">{p ? `${fmtMoney(p.value)} (${p.count})` : '-'}</span>
              </div>
            );
          })}
        </div>

        {/* Upcoming tasks */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Upcoming Tasks</h3>
          {data.upcomingTasks.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No open tasks. Nice work!</p>
          ) : (
            data.upcomingTasks.map(t => (
              <div key={t.id} className="task-row">
                <input type="checkbox" onChange={() => completeTask(t.id)} title="Mark complete" />
                <div>
                  <strong>{t.subject}</strong>
                  <div className="task-meta">
                    {t.due_date ? `Due ${fmtDate(t.due_date)}` : 'No due date'}
                    {t.contact_name && t.contact_id ? <> · <Link to={`/contacts/${t.contact_id}`}>{t.contact_name}</Link></> : null}
                    {t.deal_name && t.deal_id ? <> · <Link to={`/deals/${t.deal_id}`}>{t.deal_name}</Link></> : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="dash-columns">
        {/* Recent activity */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Recent Activity</h3>
          {data.recentActivities.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No activity logged yet.</p>
          ) : (
            data.recentActivities.map(a => (
              <div key={a.id} className="task-row">
                <span>{activityIcon(a.type)}</span>
                <div>
                  <strong>{a.subject}</strong>
                  <div className="task-meta">
                    {new Date(a.created_at + 'Z').toLocaleString()}
                    {a.contact_name && a.contact_id ? <> · <Link to={`/contacts/${a.contact_id}`}>{a.contact_name}</Link></> : null}
                    {a.company_name && a.company_id ? <> · <Link to={`/companies/${a.company_id}`}>{a.company_name}</Link></> : null}
                    {a.deal_name && a.deal_id ? <> · <Link to={`/deals/${a.deal_id}`}>{a.deal_name}</Link></> : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent quotes */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Recent Quotes</h3>
          {data.recentQuotes.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No quotes yet.</p>
          ) : (
            <table>
              <tbody>
                {data.recentQuotes.map(q => (
                  <tr key={q.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/quotes/${q.id}`)}>
                    <td><strong>{q.quote_number}</strong></td>
                    <td>{q.client_name}</td>
                    <td><span className={`badge badge-${q.status}`}>{q.status}</span></td>
                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{fmtDate(q.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
