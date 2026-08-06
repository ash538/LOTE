import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeals, createDeal, updateDeal, getContacts, getCompanies } from '../api';
import DealModal from '../components/DealModal';
import { fmtMoney, fmtDate, DEAL_STAGES } from '../lib';

export default function DealsPage() {
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [modal, setModal] = useState(null); // null | 'new'
  const [dragging, setDragging] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    const [d, ct, co] = await Promise.all([getDeals(), getContacts(), getCompanies()]);
    setDeals(d);
    setContacts(ct);
    setCompanies(co);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    await createDeal(data);
    setModal(null);
    load();
  };

  const moveDeal = async (dealId, stage) => {
    await updateDeal(dealId, { stage });
    load();
  };

  const handleDrop = (e, stage) => {
    e.preventDefault();
    if (dragging) {
      moveDeal(dragging, stage);
      setDragging(null);
    }
  };

  const totalOpen = deals
    .filter(d => d.stage !== 'won' && d.stage !== 'lost')
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div>
      <div className="page-header">
        <h2>Deals <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>· {fmtMoney(totalOpen)} open</span></h2>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ New Deal</button>
      </div>

      <div className="kanban">
        {DEAL_STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.key);
          const stageValue = stageDeals.reduce((sum, d) => sum + d.amount, 0);
          return (
            <div
              key={stage.key}
              className={`kanban-column stage-${stage.key}`}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, stage.key)}
            >
              <div className="kanban-header">
                <span>{stage.label}</span>
                <span className="kanban-count">{stageDeals.length}</span>
              </div>
              <div className="kanban-total">{fmtMoney(stageValue)}</div>
              <div className="kanban-cards">
                {stageDeals.map(deal => (
                  <div
                    key={deal.id}
                    className="deal-card"
                    draggable
                    onDragStart={() => setDragging(deal.id)}
                    onClick={() => navigate(`/deals/${deal.id}`)}
                  >
                    <strong>{deal.name}</strong>
                    <div className="deal-amount">{fmtMoney(deal.amount)}</div>
                    {(deal.contact_name?.trim() || deal.company_name) && (
                      <div className="deal-meta">
                        {deal.contact_name?.trim() || ''}
                        {deal.contact_name?.trim() && deal.company_name ? ' · ' : ''}
                        {deal.company_name || ''}
                      </div>
                    )}
                    {deal.expected_close_date && (
                      <div className="deal-meta">Close: {fmtDate(deal.expected_close_date)}</div>
                    )}
                  </div>
                ))}
                {stageDeals.length === 0 && <div className="kanban-empty">Drop deals here</div>}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <DealModal
          contacts={contacts}
          companies={companies}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
