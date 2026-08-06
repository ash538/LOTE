const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// Rates
export const getRates = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/rates${qs ? `?${qs}` : ''}`);
};
export const getCategories = () => request('/rates/categories');
export const createRate = (data) => request('/rates', { method: 'POST', body: JSON.stringify(data) });
export const updateRate = (id, data) => request(`/rates/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRate = (id) => request(`/rates/${id}`, { method: 'DELETE' });

// Quotes
export const getQuotes = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/quotes${qs ? `?${qs}` : ''}`);
};
export const getQuote = (id) => request(`/quotes/${id}`);
export const createQuote = (data) => request('/quotes', { method: 'POST', body: JSON.stringify(data) });
export const updateQuote = (id, data) => request(`/quotes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteQuote = (id) => request(`/quotes/${id}`, { method: 'DELETE' });
export const duplicateQuote = (id) => request(`/quotes/${id}/duplicate`, { method: 'POST' });

// Quote Items
export const addQuoteItem = (quoteId, data) => request(`/quotes/${quoteId}/items`, { method: 'POST', body: JSON.stringify(data) });
export const updateQuoteItem = (quoteId, itemId, data) => request(`/quotes/${quoteId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) });
export const removeQuoteItem = (quoteId, itemId) => request(`/quotes/${quoteId}/items/${itemId}`, { method: 'DELETE' });

// Companies
export const getCompanies = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/companies${qs ? `?${qs}` : ''}`);
};
export const getCompany = (id) => request(`/companies/${id}`);
export const createCompany = (data) => request('/companies', { method: 'POST', body: JSON.stringify(data) });
export const updateCompany = (id, data) => request(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCompany = (id) => request(`/companies/${id}`, { method: 'DELETE' });

// Contacts
export const getContacts = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/contacts${qs ? `?${qs}` : ''}`);
};
export const getContact = (id) => request(`/contacts/${id}`);
export const createContact = (data) => request('/contacts', { method: 'POST', body: JSON.stringify(data) });
export const updateContact = (id, data) => request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteContact = (id) => request(`/contacts/${id}`, { method: 'DELETE' });

// Deals
export const getDeals = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/deals${qs ? `?${qs}` : ''}`);
};
export const getDeal = (id) => request(`/deals/${id}`);
export const createDeal = (data) => request('/deals', { method: 'POST', body: JSON.stringify(data) });
export const updateDeal = (id, data) => request(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteDeal = (id) => request(`/deals/${id}`, { method: 'DELETE' });

// Activities
export const getActivities = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/activities${qs ? `?${qs}` : ''}`);
};
export const createActivity = (data) => request('/activities', { method: 'POST', body: JSON.stringify(data) });
export const updateActivity = (id, data) => request(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteActivity = (id) => request(`/activities/${id}`, { method: 'DELETE' });

// Dashboard
export const getDashboard = () => request('/dashboard');
