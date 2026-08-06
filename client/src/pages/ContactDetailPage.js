import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getContact, updateContact, deleteContact, getCompanies, getContacts, createDeal, createQuote } from '../api';
import { ContactModal } from './ContactsPage';
import DealModal from '../components/DealModal';
import ActivityTimeline from '../components/ActivityTimeline';
import { fmtMoney, fmtDate, stageLabel, lifecycleLabel } from '../lib';

export default function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [editing, setEditing] = useState(false);
  const [dealModal, setDealModal] = useState(false);
  const [creatingQuote, setCreatingQuote] = useState(false);

  const load = async () => {
    const [ct, co] = await Promise.all([getContact(id), getCompanies()]);
    setContact(ct);
    setCompanies(co);
  };

  useEffect(() => { load(); }, [id]);

  if (!contact) return <p>Loading...</p>;

  const fullName = `${contact.first_name} ${contact.last_name}`.trim();

  const handleSave = async (data) => {
    await updateContact(id, data);
    setEditing(false);
    load();
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this contact? Their activity history will also be removed.')) {
      await deleteContact(id);
      navigate('/contacts');
    }
  };

  const handleCreateDeal = async (data) => {
    await createDeal(data);
    setDealModal(false);
    load();
  };

  const handleCreateQuote = async () => {
    setCreatingQuote(true);
    const quote = await createQuote({ contact_id: id });
    navigate(`/quotes/${quote.id}`);
  };

  return (
    <div>
      <div className="page-header">
        <h2>{fullName}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={handleCreateQuote} disabled={creatingQuote}>
            {creatingQuote ? 'Creating...' : '+ Create Quote'}
          </button>
          <button className="btn btn-outline" onClick={() => setDealModal(true)}>+ New Deal</button>
          <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          <button className="btn btn-secondary" onClick={() => navigate('/contacts')}>Back</button>
        </div>
      </div>

      <div className="detail-columns">
        <div>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Contact Details</h3>
            <div className="detail-row"><span className="detail-label">Stage</span><span className={`badge badge-stage-${contact.lifecycle_stage}`}>{lifecycleLabel(contact.lifecycle_stage)}</span></div>
            {contact.job_title && <div className="detail-row"><span className="detail-label">Title</span>{contact.job_title}</div>}
            <div className="detail-row">
              <span className="detail-label">Company</span>
              {contact.company_id ? <Link to={`/companies/${contact.company_id}`}>{contact.company_name}</Link> : '-'}
            </div>
            <div className="detail-row">
              <span className="detail-label">Email</span>
              {contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : '-'}
            </div>
            <div className="detail-row"><span className="detail-label">Phone</span>{contact.phone || '-'}</div>
            <div className="detail-row"><span className="detail-label">Added</span>{fmtDate(contact.created_at)}</div>
            {contact.notes && <div className="detail-row"><span className="detail-label">Notes</span><span style={{ whiteSpace: 'pre-wrap' }}>{contact.notes}</span></div>}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Deals</h3>
            {contact.deals.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No deals for this contact yet.</p>
            ) : (
              <table>
                <tbody>
                  {contact.deals.map(d => (
                    <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/deals/${d.id}`)}>
                      <td><strong>{d.name}</strong></td>
                      <td>{fmtMoney(d.amount)}</td>
                      <td><span className={`badge badge-deal-${d.stage}`}>{stageLabel(d.stage)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Quotes</h3>
            {contact.quotes.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No quotes for this contact yet.</p>
            ) : (
              <table>
                <tbody>
                  {contact.quotes.map(q => (
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

        <ActivityTimeline filter={{ contact_id: id }} />
      </div>

      {editing && (
        <ContactModal
          contact={contact}
          companies={companies}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
      {dealModal && (
        <DealModal
          contacts={[contact]}
          companies={companies}
          defaults={{ contact_id: contact.id, company_id: contact.company_id || '' }}
          onSave={handleCreateDeal}
          onClose={() => setDealModal(false)}
        />
      )}
    </div>
  );
}
