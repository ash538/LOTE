import React, { useState, useEffect } from 'react';
import { getRates, getCategories, createRate, updateRate, deleteRate } from '../api';

function RateModal({ rate, onSave, onClose }) {
  const [form, setForm] = useState(rate || { category: '', name: '', description: '', unit: 'per word', unit_price: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, unit_price: parseFloat(form.unit_price) });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{rate ? 'Edit Rate' : 'Add New Rate'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category</label>
            <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required placeholder="e.g. Translation, Editing" />
          </div>
          <div className="form-group">
            <label>Service Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Standard Translation" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Brief description of the service" />
          </div>
          <div className="row">
            <div className="form-group">
              <label>Unit</label>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                <option>per word</option>
                <option>per page</option>
                <option>per hour</option>
                <option>per minute</option>
                <option>per document</option>
                <option>flat rate</option>
                <option>percent</option>
                <option>each</option>
              </select>
            </div>
            <div className="form-group">
              <label>Unit Price ($)</label>
              <input type="number" step="0.01" min="0" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} required />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{rate ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RatesPage() {
  const [rates, setRates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | rate object
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [r, c] = await Promise.all([getRates(filter ? { category: filter } : {}), getCategories()]);
    setRates(r);
    setCategories(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handleSave = async (data) => {
    if (modal && modal.id) {
      await updateRate(modal.id, data);
    } else {
      await createRate(data);
    }
    setModal(null);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this rate? It may affect existing quotes.')) {
      await deleteRate(id);
      load();
    }
  };

  const fmt = (n) => typeof n === 'number' ? n.toFixed(2) : n;

  return (
    <div>
      <div className="page-header">
        <h2>Rate Card</h2>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ Add Rate</button>
      </div>

      <div className="filter-bar">
        <button className={`filter-chip ${!filter ? 'active' : ''}`} onClick={() => setFilter('')}>All</button>
        {categories.map(c => (
          <button key={c} className={`filter-chip ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c}</button>
        ))}
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : rates.length === 0 ? (
          <div className="empty-state">
            <h3>No rates found</h3>
            <p>Add your first rate to get started.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Service</th>
                <th>Description</th>
                <th>Unit</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.map(rate => (
                <tr key={rate.id}>
                  <td><strong>{rate.category}</strong></td>
                  <td>{rate.name}</td>
                  <td style={{ color: '#64748b', fontSize: '0.88rem' }}>{rate.description}</td>
                  <td>{rate.unit}</td>
                  <td><strong>${fmt(rate.unit_price)}</strong></td>
                  <td><span className={`badge ${rate.is_active ? 'badge-accepted' : 'badge-declined'}`}>{rate.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => setModal(rate)} style={{ marginRight: 6 }}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(rate.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <RateModal rate={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
    </div>
  );
}
