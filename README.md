# LOTE CRM

A custom CRM with an integrated quote builder. Manage contacts, companies, and a deal pipeline — then build professional quotes from your managed rate card, linked straight to your CRM records.

## Features

### CRM
- **Dashboard** - Open pipeline value, deals won this month, upcoming tasks, and recent activity at a glance
- **Contacts** - People with lifecycle stages (Lead → Prospect → Customer), linked to companies, deals, and quotes
- **Companies** - Organizations with rolled-up contacts, deals, and quotes
- **Deal Pipeline** - Drag-and-drop kanban board (Lead → Qualified → Proposal → Negotiation → Won/Lost) with per-stage totals
- **Activity Timeline** - Log notes, calls, emails, and meetings against any contact, company, or deal
- **Tasks** - To-dos with due dates, surfaced on the dashboard until completed

### Quoting
- **Rate Card Management** - Add, edit, and organize service rates by category
- **Interactive Quote Builder** - Build quotes with line items from your rate card
- **CRM Integration** - Link quotes to contacts and deals; picking a contact auto-fills client details; accepting a quote logs it on the linked deal's timeline
- **Auto-calculations** - Subtotals, discounts, tax, and totals computed from backend rates
- **Quote Status Tracking** - Track quotes through Draft, Sent, Accepted, Declined
- **Print-ready** - Clean print layout for client-facing quotes
- **Duplicate Quotes** - Clone existing quotes (CRM links included) for faster creation
- **Price Overrides** - Override rate card prices on a per-quote basis

## Tech Stack

- **Backend**: Node.js, Express, SQLite (better-sqlite3)
- **Frontend**: React, React Router
- **Database**: SQLite (zero-config, file-based; schema migrates automatically on startup)

## Quick Start

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Seed sample rates + sample CRM data
npm run seed

# Run in development (API + React)
npm run dev
```

The API runs on `http://localhost:4000` and the React app on `http://localhost:3000`.

## API Endpoints

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard | Pipeline stats, counts, tasks, recent activity |

### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/contacts | List contacts (filter: `?search=X&company_id=X&lifecycle_stage=X`) |
| GET | /api/contacts/:id | Contact with linked deals and quotes |
| POST | /api/contacts | Create a contact |
| PUT | /api/contacts/:id | Update a contact |
| DELETE | /api/contacts/:id | Delete a contact |

### Companies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/companies | List companies (filter: `?search=X`) |
| GET | /api/companies/:id | Company with contacts, deals, quotes |
| POST | /api/companies | Create a company |
| PUT | /api/companies/:id | Update a company |
| DELETE | /api/companies/:id | Delete a company |

### Deals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/deals | List deals (filter: `?stage=X&contact_id=X&company_id=X`) |
| GET | /api/deals/stages | Pipeline stage list |
| GET | /api/deals/:id | Deal with linked quotes |
| POST | /api/deals | Create a deal |
| PUT | /api/deals/:id | Update a deal / move stage (sets `closed_at` on won/lost) |
| DELETE | /api/deals/:id | Delete a deal |

### Activities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/activities | Timeline (filter: `?contact_id=X&company_id=X&deal_id=X&type=X&open_tasks=true`) |
| POST | /api/activities | Log a note/call/email/meeting or create a task |
| PUT | /api/activities/:id | Update an activity / complete a task |
| DELETE | /api/activities/:id | Delete an activity |

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
| GET | /api/quotes | List quotes (filter: `?status=X&contact_id=X&company_id=X&deal_id=X`) |
| GET | /api/quotes/:id | Get quote with items and totals |
| POST | /api/quotes | Create a quote (pass `contact_id` to auto-fill client details; optional `deal_id`) |
| PUT | /api/quotes/:id | Update quote details / status / CRM links |
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

Existing quote databases upgrade automatically — the CRM tables and quote-link columns are added on first startup without touching your data.
