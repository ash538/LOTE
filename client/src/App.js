import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';
import ContactDetailPage from './pages/ContactDetailPage';
import CompaniesPage from './pages/CompaniesPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import DealsPage from './pages/DealsPage';
import DealDetailPage from './pages/DealDetailPage';
import RatesPage from './pages/RatesPage';
import QuotesPage from './pages/QuotesPage';
import QuoteBuilderPage from './pages/QuoteBuilderPage';

function App() {
  return (
    <BrowserRouter>
      <div className="header">
        <div className="container">
          <h1>LOTE CRM</h1>
          <nav>
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/contacts">Contacts</NavLink>
            <NavLink to="/companies">Companies</NavLink>
            <NavLink to="/deals">Deals</NavLink>
            <NavLink to="/quotes">Quotes</NavLink>
            <NavLink to="/rates">Rates</NavLink>
          </nav>
        </div>
      </div>
      <div className="container">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/:id" element={<ContactDetailPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:id" element={<CompanyDetailPage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/deals/:id" element={<DealDetailPage />} />
          <Route path="/quotes" element={<QuotesPage />} />
          <Route path="/rates" element={<RatesPage />} />
          <Route path="/quotes/new" element={<QuoteBuilderPage />} />
          <Route path="/quotes/:id" element={<QuoteBuilderPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
