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
