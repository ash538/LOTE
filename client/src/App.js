import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import RatesPage from './pages/RatesPage';
import QuotesPage from './pages/QuotesPage';
import QuoteBuilderPage from './pages/QuoteBuilderPage';

function App() {
  return (
    <BrowserRouter>
      <div className="header">
        <div className="container">
          <h1>LOTE Quote Builder</h1>
          <nav>
            <NavLink to="/" end>Quotes</NavLink>
            <NavLink to="/rates">Rates</NavLink>
          </nav>
        </div>
      </div>
      <div className="container">
        <Routes>
          <Route path="/" element={<QuotesPage />} />
          <Route path="/rates" element={<RatesPage />} />
          <Route path="/quotes/new" element={<QuoteBuilderPage />} />
          <Route path="/quotes/:id" element={<QuoteBuilderPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
