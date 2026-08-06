import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompany, updateCompany, deleteCompany, createContact, createDeal } from '../api';
import { CompanyModal } from './CompaniesPage';
import { ContactModal } from './ContactsPage';
import DealModal from '../components/DealModal';
import ActivityTimeline from '../components/ActivityTimeline';
import { fmtMoney, fmtDate, stageLabel, lifecycleLabel } from '../lib';

export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [editing, setEditing] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [dealModal, setDealModal] = useState(false);

  const load = async () => setCompany(await getCompany(id));
  useEffect(() => { load(); }, [id]);

  if (!company) return <p>Loading...</p>;

  const handleSave = async (data) => {
    await updateCompany(id, data);
    setEditing(false);
    load();
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this company? Contacts will be kept but unlinked.')) {
      await deleteCompany(id);
      navigate('/companies');
    }
  };

  const handleCreateContact = async (data) => {
    await createContact(data);
    setContactModal(false);
    load();
  };

  const handleCreateDeal = async (data) => {
    await createDeal(data);
    setDealModal(false);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h2>{company.name}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => setContactModal(true)}>+ Add Contact</button>
          <button className="btn btn-outline" onClick={() => setDealModal(true)}>+ New Deal</button>
          <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          <button className="btn btn-secondary" onClick={() => navigate('/companies')}>Back</button>
        </div>
      </div>

      <div className="detail-columns">
        <div>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Company Details</h3>
            {company.industry && <div className="detail-row"><span className="detail-label">Industry</span>{company.industry}</div>}
            <div className="detail-row">
              <span className="detail-label">Website</span>
              {company.domain ? <a href={`https://${company.domain.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer">{company.domain}</a> : '-'}
            </div>
            <div className="detail-row"><span className="detail-label">Phone</span>{company.phone || '-'}</div>
            <div className="detail-row"><span className="detail-label">Address</span>{company.address || '-'}</div>
            <div className="detail-row"><span className="detail-label">Added</span>{fmtDate(company.created_at)}</div>
            {company.notes && <div className="detail-row"><span className="detail-label">Notes</span><span style={{ whiteSpace: 'pre-wrap' }}>{company.notes}</span></div>}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Contacts</h3>
            {company.contacts.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No contacts at this company yet.</p>
            ) : (
              <table>
                <tbody>
                  {company.contacts.map(c => (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/contacts/${c.id}`)}>
                      <td><strong>{c.first_name} {c.last_name}</strong></td>
                      <td>{c.job_title || '-'}</td>
                      <td>{c.email || '-'}</td>
                      <td><span className={`badge badge-stage-${c.lifecycle_stage}`}>{lifecycleLabel(c.lifecycle_stage)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Deals</h3>
            {company.deals.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No deals for this company yet.</p>
            ) : (
              <table>
                <tbody>
                  {company.deals.map(d => (
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
            {company.quotes.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No quotes for this company yet.</p>
            ) : (
              <table>
                <tbody>
                  {company.quotes.map(q => (
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

        <ActivityTimeline filter={{ company_id: id }} />
      </div>

      {editing && (
        <CompanyModal company={company} onSave={handleSave} onClose={() => setEditing(false)} />
      )}
      {contactModal && (
        <ContactModal
          companies={[company]}
          defaultCompanyId={company.id}
          onSave={handleCreateContact}
          onClose={() => setContactModal(false)}
        />
      )}
      {dealModal && (
        <DealModal
          contacts={company.contacts}
          companies={[company]}
          defaults={{ company_id: company.id }}
          onSave={handleCreateDeal}
          onClose={() => setDealModal(false)}
        />
      )}
    </div>
  );
}
