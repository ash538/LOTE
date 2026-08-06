import React, { useState } from 'react';
import { DEAL_STAGES } from '../lib';

export default function DealModal({ deal, contacts, companies, defaults = {}, onSave, onClose }) {
  const [form, setForm] = useState(deal || {
    name: '', stage: 'lead', amount: '', contact_id: '', company_id: '',
    expected_close_date: '', notes: '', ...defaults
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      amount: parseFloat(form.amount) || 0,
      contact_id: form.contact_id || null,
      company_id: form.company_id || null,
    });
  };

  const handleContactChange = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    // Auto-fill company from the selected contact if not already set
    setForm({
      ...form,
      contact_id: contactId,
      company_id: form.company_id || (contact && contact.company_id) || '',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{deal ? 'Edit Deal' : 'New Deal'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Deal Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Annual translation contract" />
          </div>
          <div className="row">
            <div className="form-group">
              <label>Amount ($)</label>
              <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Stage</label>
              <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
                {DEAL_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="row">
            <div className="form-group">
              <label>Contact</label>
              <select value={form.contact_id || ''} onChange={e => handleContactChange(e.target.value)}>
                <option value="">— No contact —</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Company</label>
              <select value={form.company_id || ''} onChange={e => setForm({ ...form, company_id: e.target.value })}>
                <option value="">— No company —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Expected Close Date</label>
            <input type="date" value={form.expected_close_date} onChange={e => setForm({ ...form, expected_close_date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{deal ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
