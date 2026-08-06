import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '../api';

export function CompanyModal({ company, onSave, onClose }) {
  const [form, setForm] = useState(company || {
    name: '', domain: '', industry: '', phone: '', address: '', notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{company ? 'Edit Company' : 'New Company'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Company Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="row">
            <div className="form-group">
              <label>Website / Domain</label>
              <input value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} placeholder="example.com" />
            </div>
            <div className="form-group">
              <label>Industry</label>
              <input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} />
            </div>
          </div>
          <div className="row">
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{company ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setCompanies(await getCompanies(search ? { search } : {}));
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [search]);

  const handleSave = async (data) => {
    if (modal && modal.id) {
      await updateCompany(modal.id, data);
    } else {
      await createCompany(data);
    }
    setModal(null);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this company? Contacts will be kept but unlinked.')) {
      await deleteCompany(id);
      load();
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Companies</h2>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ New Company</button>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search companies..."
        />
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : companies.length === 0 ? (
          <div className="empty-state">
            <h3>No companies found</h3>
            <p>Add your first company to organize your contacts.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Industry</th>
                <th>Website</th>
                <th>Phone</th>
                <th>Contacts</th>
                <th>Open Deals</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(c => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/companies/${c.id}`)}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.industry || '-'}</td>
                  <td>{c.domain || '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td>{c.contact_count}</td>
                  <td>{c.open_deal_count}</td>
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
        <CompanyModal
          company={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
