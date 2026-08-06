import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDeal, updateDeal, deleteDeal, getContacts, getCompanies, createQuote } from '../api';
import DealModal from '../components/DealModal';
import ActivityTimeline from '../components/ActivityTimeline';
import { fmtMoney, fmtDate, stageLabel, DEAL_STAGES } from '../lib';

export default function DealDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [editing, setEditing] = useState(false);
  const [creatingQuote, setCreatingQuote] = useState(false);

  const load = async () => {
    const [d, ct, co] = await Promise.all([getDeal(id), getContacts(), getCompanies()]);
    setDeal(d);
    setContacts(ct);
    setCompanies(co);
  };

  useEffect(() => { load(); }, [id]);

  if (!deal) return <p>Loading...</p>;

  const handleStageChange = async (stage) => {
    const updated = await updateDeal(id, { stage });
    setDeal({ ...deal, ...updated });
  };

  const handleSave = async (data) => {
    await updateDeal(id, data);
    setEditing(false);
    load();
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this deal? Linked quotes will be kept.')) {
      await deleteDeal(id);
      navigate('/deals');
    }
  };

  const handleCreateQuote = async () => {
    setCreatingQuote(true);
    const quote = await createQuote({
      contact_id: deal.contact_id || undefined,
      company_id: deal.company_id || undefined,
      deal_id: deal.id,
      client_name: deal.contact_name?.trim() || deal.company_name || deal.name,
      notes: `Quote for deal: ${deal.name}`,
    });
    navigate(`/quotes/${quote.id}`);
  };

  return (
    <div>
      <div className="page-header">
        <h2>{deal.name}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={deal.stage} onChange={e => handleStageChange(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1.5px solid #e2e8f0' }}>
            {DEAL_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button className="btn btn-primary" onClick={handleCreateQuote} disabled={creatingQuote}>
            {creatingQuote ? 'Creating...' : '+ Create Quote'}
          </button>
          <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          <button className="btn btn-secondary" onClick={() => navigate('/deals')}>Back</button>
        </div>
      </div>

      <div className="detail-columns">
        <div>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Deal Details</h3>
            <div className="detail-row"><span className="detail-label">Amount</span><strong>{fmtMoney(deal.amount)}</strong></div>
            <div className="detail-row"><span className="detail-label">Stage</span><span className={`badge badge-deal-${deal.stage}`}>{stageLabel(deal.stage)}</span></div>
            <div className="detail-row">
              <span className="detail-label">Contact</span>
              {deal.contact_id ? <Link to={`/contacts/${deal.contact_id}`}>{deal.contact_name}</Link> : '-'}
            </div>
            <div className="detail-row">
              <span className="detail-label">Company</span>
              {deal.company_id ? <Link to={`/companies/${deal.company_id}`}>{deal.company_name}</Link> : '-'}
            </div>
            <div className="detail-row"><span className="detail-label">Expected Close</span>{deal.expected_close_date ? fmtDate(deal.expected_close_date) : '-'}</div>
            {deal.closed_at && <div className="detail-row"><span className="detail-label">Closed</span>{fmtDate(deal.closed_at)}</div>}
            {deal.notes && <div className="detail-row"><span className="detail-label">Notes</span><span style={{ whiteSpace: 'pre-wrap' }}>{deal.notes}</span></div>}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Quotes</h3>
            {deal.quotes.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No quotes linked to this deal yet.</p>
            ) : (
              <table>
                <tbody>
                  {deal.quotes.map(q => (
                    <tr key={q.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/quotes/${q.id}`)}>
                      <td><strong>{q.quote_number}</strong></td>
                      <td><span className={`badge badge-${q.status}`}>{q.status}</span></td>
                      <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{fmtDate(q.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <ActivityTimeline filter={{ deal_id: id }} />
      </div>

      {editing && (
        <DealModal
          deal={deal}
          contacts={contacts}
          companies={companies}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
