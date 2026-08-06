import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getContacts, createContact, updateContact, deleteContact, getCompanies } from '../api';
import { LIFECYCLE_STAGES, lifecycleLabel } from '../lib';

export function ContactModal({ contact, companies, defaultCompanyId, onSave, onClose }) {
  const [form, setForm] = useState(contact || {
    first_name: '', last_name: '', email: '', phone: '', job_title: '',
    company_id: defaultCompanyId || '', lifecycle_stage: 'lead', notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, company_id: form.company_id || null });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{contact ? 'Edit Contact' : 'New Contact'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="form-group">
              <label>First Name *</label>
              <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>
          <div className="row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="row">
            <div className="form-group">
              <label>Job Title</label>
              <input value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Lifecycle Stage</label>
              <select value={form.lifecycle_stage} onChange={e => setForm({ ...form, lifecycle_stage: e.target.value })}>
                {LIFECYCLE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Company</label>
            <select value={form.company_id || ''} onChange={e => setForm({ ...form, company_id: e.target.value })}>
              <option value="">— No company —</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{contact ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | contact object
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (stageFilter) params.lifecycle_stage = stageFilter;
    const [ct, co] = await Promise.all([getContacts(params), getCompanies()]);
    setContacts(ct);
    setCompanies(co);
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [search, stageFilter]);

  const handleSave = async (data) => {
    if (modal && modal.id) {
      await updateContact(modal.id, data);
    } else {
      await createContact(data);
    }
    setModal(null);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this contact? Their activity history will also be removed.')) {
      await deleteContact(id);
      load();
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Contacts</h2>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ New Contact</button>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search contacts..."
        />
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <button className={`filter-chip ${!stageFilter ? 'active' : ''}`} onClick={() => setStageFilter('')}>All</button>
          {LIFECYCLE_STAGES.map(s => (
            <button key={s.key} className={`filter-chip ${stageFilter === s.key ? 'active' : ''}`} onClick={() => setStageFilter(s.key)}>{s.label}</button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : contacts.length === 0 ? (
          <div className="empty-state">
            <h3>No contacts found</h3>
            <p>Add your first contact to start building your CRM.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Stage</th>
                <th>Open Deals</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/contacts/${c.id}`)}>
                  <td>
                    <strong>{c.first_name} {c.last_name}</strong>
                    {c.job_title && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.job_title}</div>}
                  </td>
                  <td>{c.company_name || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td><span className={`badge badge-stage-${c.lifecycle_stage}`}>{lifecycleLabel(c.lifecycle_stage)}</span></td>
                  <td>{c.open_deal_count || 0}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-sm btn-secondary" onClick={() => setModal(c)} style={{ marginRight: 6 }}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <ContactModal
          contact={modal === 'new' ? null : modal}
          companies={companies}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
