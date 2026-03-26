# LOTE Quote Builder

Online quote builder with backend rates for team use. Build professional quotes by selecting services from a managed rate card.

## Features

- **Rate Card Management** - Add, edit, and organize service rates by category
- **Interactive Quote Builder** - Build quotes with line items from your rate card
- **Auto-calculations** - Subtotals, discounts, tax, and totals computed from backend rates
- **Quote Status Tracking** - Track quotes through Draft, Sent, Accepted, Declined
- **Print-ready** - Clean print layout for client-facing quotes
- **Duplicate Quotes** - Clone existing quotes for faster creation
- **Price Overrides** - Override rate card prices on a per-quote basis

## Tech Stack

- **Backend**: Node.js, Express, SQLite (better-sqlite3)
- **Frontend**: React, React Router
- **Database**: SQLite (zero-config, file-based)

## Quick Start

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Seed sample rates
npm run seed

# Run in development (API + React)
npm run dev
```

The API runs on `http://localhost:4000` and the React app on `http://localhost:3000`.

## API Endpoints

### Rates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/rates | List rates (filter: `?category=X&active=true`) |
| GET | /api/rates/categories | List distinct categories |
| POST | /api/rates | Create a rate |
| PUT | /api/rates/:id | Update a rate |
| DELETE | /api/rates/:id | Delete a rate |

### Quotes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/quotes | List quotes (filter: `?status=draft`) |
| GET | /api/quotes/:id | Get quote with items and totals |
| POST | /api/quotes | Create a quote |
| PUT | /api/quotes/:id | Update quote details |
| DELETE | /api/quotes/:id | Delete a quote |
| POST | /api/quotes/:id/items | Add a line item |
| PUT | /api/quotes/:id/items/:itemId | Update a line item |
| DELETE | /api/quotes/:id/items/:itemId | Remove a line item |
| POST | /api/quotes/:id/duplicate | Duplicate a quote |

## Production

```bash
npm run build   # Build React frontend
npm start       # Serve API + static frontend
```
