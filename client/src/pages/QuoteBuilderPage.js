import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRates, getCategories, getQuote, createQuote, updateQuote, addQuoteItem, updateQuoteItem, removeQuoteItem, getContacts, getDeals } from '../api';

function AddItemModal({ rates, categories, onAdd, onClose }) {
  const [filter, setFilter] = useState('');
  const [quantities, setQuantities] = useState({});

  const filtered = filter ? rates.filter(r => r.category === filter) : rates;

  const handleAdd = (rate) => {
    onAdd(rate.id, parseFloat(quantities[rate.id]) || 1);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <h3>Add Service to Quote</h3>
        <div className="filter-bar" style={{ marginBottom: 16 }}>
          <button className={`filter-chip ${!filter ? 'active' : ''}`} onClick={() => setFilter('')}>All</button>
          {categories.map(c => (
            <button key={c} className={`filter-chip ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c}</button>
          ))}
        </div>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Unit</th>
              <th>Rate</th>
              <th>Qty</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.filter(r => r.is_active).map(rate => (
              <tr key={rate.id}>
                <td>
                  <strong>{rate.name}</strong>
                  <br /><span style={{ fontSize: '0.8rem', color: '#64748b' }}>{rate.category}</span>
                </td>
                <td>{rate.unit}</td>
                <td>${rate.unit_price.toFixed(2)}</td>
                <td style={{ width: 80 }}>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantities[rate.id] || ''}
                    onChange={e => setQuantities({ ...quantities, [rate.id]: e.target.value })}
                    placeholder="1"
                    style={{ width: 70, padding: '4px 8px', border: '1.5px solid #e2e8f0', borderRadius: 4 }}
                  />
                </td>
                <td>
                  <button className="btn btn-sm btn-primary" onClick={() => handleAdd(rate)}>Add</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

export default function QuoteBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [quote, setQuote] = useState(null);
  const [form, setForm] = useState({ client_name: '', client_email: '', client_company: '', notes: '', discount_percent: 0, tax_percent: 0, contact_id: '', deal_id: '' });
  const [rates, setRates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getRates(), getCategories(), getContacts(), getDeals()]).then(([r, c, ct, d]) => {
      setRates(r);
      setCategories(c);
      setContacts(ct);
      setDeals(d);
    });
    if (!isNew) {
      getQuote(id).then(q => {
        setQuote(q);
        setForm({ client_name: q.client_name, client_email: q.client_email, client_company: q.client_company, notes: q.notes, discount_percent: q.discount_percent, tax_percent: q.tax_percent, contact_id: q.contact_id || '', deal_id: q.deal_id || '' });
      });
    }
  }, [id]);

  // Selecting a CRM contact auto-fills the client fields
  const handleContactSelect = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) {
      setForm({ ...form, contact_id: '' });
      return;
    }
    setForm({
      ...form,
      contact_id: contactId,
      client_name: `${contact.first_name} ${contact.last_name}`.trim(),
      client_email: contact.email || form.client_email,
      client_company: contact.company_name || form.client_company,
    });
  };

  const saveQuoteDetails = async () => {
    setSaving(true);
    const payload = { ...form, contact_id: form.contact_id || null, deal_id: form.deal_id || null };
    if (isNew) {
      const created = await createQuote(payload);
      navigate(`/quotes/${created.id}`, { replace: true });
      setQuote(created);
    } else {
      const updated = await updateQuote(id, payload);
      setQuote(updated);
    }
    setSaving(false);
  };

  const handleStatusChange = async (status) => {
    const updated = await updateQuote(quote.id, { status });
    setQuote(updated);
  };

  const handleAddItem = async (rate_id, quantity) => {
    const updated = await addQuoteItem(quote.id, { rate_id, quantity });
    setQuote(updated);
  };

  const handleQtyChange = async (itemId, quantity) => {
    if (quantity <= 0) return;
    const updated = await updateQuoteItem(quote.id, itemId, { quantity: parseFloat(quantity) });
    setQuote(updated);
  };

  const handlePriceOverride = async (itemId, price) => {
    const updated = await updateQuoteItem(quote.id, itemId, { unit_price_override: price === '' ? null : parseFloat(price) });
    setQuote(updated);
  };

  const handleRemoveItem = async (itemId) => {
    const updated = await removeQuoteItem(quote.id, itemId);
    setQuote(updated);
  };

  const fmt = (n) => `$${(n || 0).toFixed(2)}`;

  return (
    <div>
      <div className="page-header">
        <h2>{isNew ? 'New Quote' : `Quote ${quote?.quote_number || ''}`}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {quote && (
            <>
              <select value={quote.status} onChange={e => handleStatusChange(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1.5px solid #e2e8f0' }}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </select>
              <button className="btn btn-secondary" onClick={() => window.print()}>Print</button>
            </>
          )}
          <button className="btn btn-secondary" onClick={() => navigate('/quotes')}>Back</button>
        </div>
      </div>

      {/* Client Details */}
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Client Details</h3>
        <div className="row no-print">
          <div className="form-group">
            <label>CRM Contact</label>
            <select value={form.contact_id} onChange={e => handleContactSelect(e.target.value)}>
              <option value="">— Not linked —</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}{c.company_name ? ` (${c.company_name})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Linked Deal</label>
            <select value={form.deal_id} onChange={e => setForm({ ...form, deal_id: e.target.value })}>
              <option value="">— Not linked —</option>
              {deals.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="row">
          <div className="form-group">
            <label>Client Name *</label>
            <input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} required placeholder="Client full name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })} placeholder="client@example.com" />
          </div>
          <div className="form-group">
            <label>Company</label>
            <input value={form.client_company} onChange={e => setForm({ ...form, client_company: e.target.value })} placeholder="Company name" />
          </div>
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Additional notes for this quote..." />
        </div>
        <div className="row">
          <div className="form-group">
            <label>Discount (%)</label>
            <input type="number" min="0" max="100" step="0.5" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="form-group">
            <label>Tax (%)</label>
            <input type="number" min="0" max="100" step="0.5" value={form.tax_percent} onChange={e => setForm({ ...form, tax_percent: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={saveQuoteDetails} disabled={!form.client_name || saving}>
              {saving ? 'Saving...' : isNew ? 'Create Quote' : 'Save Details'}
            </button>
          </div>
        </div>
      </div>

      {/* Line Items */}
      {quote && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Line Items</h3>
            <button className="btn btn-primary no-print" onClick={() => setShowAddItem(true)}>+ Add Service</button>
          </div>

          {quote.items.length === 0 ? (
            <div className="empty-state">
              <h3>No items yet</h3>
              <p>Add services from your rate card to build this quote.</p>
            </div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Rate</th>
                    <th>Qty</th>
                    <th>Line Total</th>
                    <th className="no-print"></th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map(item => (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong></td>
                      <td>{item.category}</td>
                      <td>{item.unit}</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price_override !== null ? item.unit_price_override : item.rate_unit_price}
                          onChange={e => handlePriceOverride(item.id, e.target.value)}
                          style={{ width: 90, padding: '4px 8px', border: '1.5px solid #e2e8f0', borderRadius: 4 }}
                          className="no-print"
                        />
                        <span className="print-only" style={{ display: 'none' }}>{fmt(item.effective_unit_price)}</span>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={e => handleQtyChange(item.id, e.target.value)}
                          style={{ width: 70, padding: '4px 8px', border: '1.5px solid #e2e8f0', borderRadius: 4 }}
                          className="no-print"
                        />
                        <span className="print-only" style={{ display: 'none' }}>{item.quantity}</span>
                      </td>
                      <td><strong>{fmt(item.line_total)}</strong></td>
                      <td className="no-print">
                        <button className="btn btn-sm btn-danger" onClick={() => handleRemoveItem(item.id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="totals-section">
                <div className="totals-row">
                  <span className="totals-label">Subtotal</span>
                  <span>{fmt(quote.subtotal)}</span>
                </div>
                {quote.discount_percent > 0 && (
                  <div className="totals-row">
                    <span className="totals-label">Discount ({quote.discount_percent}%)</span>
                    <span>-{fmt(quote.discount_amount)}</span>
                  </div>
                )}
                {quote.tax_percent > 0 && (
                  <div className="totals-row">
                    <span className="totals-label">Tax ({quote.tax_percent}%)</span>
                    <span>{fmt(quote.tax_amount)}</span>
                  </div>
                )}
                <div className="totals-row total">
                  <span className="totals-label">Total</span>
                  <span>{fmt(quote.total)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {showAddItem && <AddItemModal rates={rates} categories={categories} onAdd={handleAddItem} onClose={() => setShowAddItem(false)} />}
    </div>
  );
}
