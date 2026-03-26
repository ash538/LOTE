import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuotes, deleteQuote, duplicateQuote } from '../api';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const data = await getQuotes(statusFilter ? { status: statusFilter } : {});
    setQuotes(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this quote permanently?')) {
      await deleteQuote(id);
      load();
    }
  };

  const handleDuplicate = async (id) => {
    const newQuote = await duplicateQuote(id);
    navigate(`/quotes/${newQuote.id}`);
  };

  const fmt = (n) => `$${(n || 0).toFixed(2)}`;

  const statuses = ['draft', 'sent', 'accepted', 'declined'];

  return (
    <div>
      <div className="page-header">
        <h2>Quotes</h2>
        <button className="btn btn-primary" onClick={() => navigate('/quotes/new')}>+ New Quote</button>
      </div>

      <div className="filter-bar">
        <button className={`filter-chip ${!statusFilter ? 'active' : ''}`} onClick={() => setStatusFilter('')}>All</button>
        {statuses.map(s => (
          <button key={s} className={`filter-chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)} style={{ textTransform: 'capitalize' }}>{s}</button>
        ))}
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : quotes.length === 0 ? (
          <div className="empty-state">
            <h3>No quotes yet</h3>
            <p>Create your first quote to get started.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Quote #</th>
                <th>Client</th>
                <th>Company</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(q => (
                <tr key={q.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/quotes/${q.id}`)}>
                  <td><strong>{q.quote_number}</strong></td>
                  <td>{q.client_name}</td>
                  <td>{q.client_company || '-'}</td>
                  <td>{q.item_count}</td>
                  <td><strong>{fmt(q.total)}</strong></td>
                  <td><span className={`badge badge-${q.status}`}>{q.status}</span></td>
                  <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(q.created_at).toLocaleDateString()}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleDuplicate(q.id)} style={{ marginRight: 6 }}>Duplicate</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(q.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
