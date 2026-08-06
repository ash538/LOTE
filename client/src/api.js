// API switch: the real server API by default, or the in-browser
// localStorage implementation when built with REACT_APP_DEMO=1.
import * as remote from './api-remote';
import * as local from './api-local';

const impl = process.env.REACT_APP_DEMO === '1' ? local : remote;

export const {
  // Rates
  getRates, getCategories, createRate, updateRate, deleteRate,
  // Quotes
  getQuotes, getQuote, createQuote, updateQuote, deleteQuote, duplicateQuote,
  addQuoteItem, updateQuoteItem, removeQuoteItem,
  // Companies
  getCompanies, getCompany, createCompany, updateCompany, deleteCompany,
  // Contacts
  getContacts, getContact, createContact, updateContact, deleteContact,
  // Deals
  getDeals, getDeal, createDeal, updateDeal, deleteDeal,
  // Activities
  getActivities, createActivity, updateActivity, deleteActivity,
  // Dashboard
  getDashboard,
} = impl;
