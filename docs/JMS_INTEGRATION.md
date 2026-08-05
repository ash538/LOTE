# Portal ⇄ JMS Integration

The engagement portal backend hands translation work to JMS (the job
management system) and receives status updates back. This document is the
integration contract.

## Architecture

```
Portal frontend ──> Portal API (/api/portal) ──> SQLite (portal.db)
                          │                            ▲
                          │ submit / approve / cancel  │ status sync
                          ▼                            │
                    JMS adapter (server/portal/jms/client.js)
                          │                            │
                          ▼                            │
                        JMS  ────── webhooks ──────────┘
```

Everything JMS-specific lives in `server/portal/jms/`:

| File | Purpose |
|---|---|
| `client.js` | Outbound calls + payload mapping + webhook signature check |
| `statuses.js` | Request lifecycle and JMS-event → status mapping |
| `sync.js` | Applies inbound JMS events to the portal DB (idempotent) |

If JMS's real API differs from the shape below, change `toJmsJob()` and the
endpoint paths in `client.js` — nothing else needs to know.

## Configuration (environment variables)

| Variable | Default | Purpose |
|---|---|---|
| `JMS_MODE` | `mock` | `mock` = no network calls, fake job ids; `live` = real HTTP |
| `JMS_BASE_URL` | — | JMS API origin, e.g. `https://jms.lotemarketing.com.au` |
| `JMS_API_KEY` | — | Bearer token for outbound calls |
| `JMS_WEBHOOK_SECRET` | — | HMAC secret for inbound webhooks (required in live) |
| `JMS_CLIENT_CODE` | `TU-CALD-PORTAL` | Identifies this portal as the client inside JMS |
| `JMS_TIMEOUT_MS` | `15000` | Outbound request timeout |
| `PORTAL_DB_PATH` | `./portal.db` | SQLite location |

## Request lifecycle

```
draft ──submit──> submitted ──job.quoted──> quoted ──approve-quote──> in_production
   in_production ──job.in_review──> in_review ──job.delivered──> delivered ──close──> closed
   (cancelled reachable from any non-terminal state)
```

State moves only forward — out-of-order webhook deliveries never regress a
request. Every transition is recorded in `request_events` (audit trail).

## Outbound: portal → JMS

`POST {JMS_BASE_URL}/api/v2/jobs` with `Authorization: Bearer {JMS_API_KEY}`:

```json
{
  "external_ref": "REQ-2026-0001",
  "client_code": "TU-CALD-PORTAL",
  "service": "translation",
  "title": "Hardship & payment support — Khmer + Vietnamese",
  "source_language": "en-AU",
  "target_languages": ["Khmer", "Vietnamese"],
  "deliverable_formats": ["Flyer + audio"],
  "domain": "Hardship & debt support",
  "region": "VIC",
  "brief": "Frames support without stigma. Audio-first for Khmer.",
  "due_date": "2026-09-15",
  "requested_by": "Field team",
  "callback": { "events": ["job.received", "job.quoted", "..."] }
}
```

Expected response: `{ "job_id": "JMS-...", "status": "received" }`.

Also used: `POST /api/v2/jobs/{id}/approve`, `POST /api/v2/jobs/{id}/cancel`,
`GET /api/v2/jobs/{id}` (on-demand refresh when webhooks are unavailable).

## Inbound: JMS → portal webhook

Register in JMS: `POST {portal}/api/portal/jms/webhook`

Each delivery must carry `X-JMS-Signature: sha256=<hex>` where `<hex>` is
HMAC-SHA256 of the **raw request body** using `JMS_WEBHOOK_SECRET`.
Unsigned or badly-signed deliveries get `401`.

```json
{
  "event_id": "evt_01H...",
  "event_type": "job.quoted",
  "job_id": "JMS-8842",
  "occurred_at": "2026-08-05T02:00:00Z",
  "data": {
    "quote": { "amount": 960, "currency": "AUD" },
    "deliverables": [{ "language": "Khmer", "format": "PDF", "url": "https://..." }],
    "note": "free text shown in the request timeline"
  }
}
```

Supported `event_type` values: `job.received`, `job.quoted`,
`job.in_production`, `job.in_review`, `job.delivered`, `job.cancelled`.

Semantics:

- **Idempotent** on `event_id` — redeliveries return `duplicate: true` and are
  not reapplied.
- Events for unknown jobs or unknown types are stored in `jms_events` with an
  error note and acknowledged with `200` (so JMS doesn't retry forever), but
  flagged `applied: false`.
- `data.quote` populates the quote amount/currency; `data.deliverables`
  populates the deliverables list on the request.

## Portal API surface

### Requests (Request Centre)

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/portal/requests` | Filters: `?status=`, `?corridor=`, `?kind=` |
| GET | `/api/portal/requests/:id` | Includes full event timeline |
| POST | `/api/portal/requests` | Creates a `draft` |
| PUT | `/api/portal/requests/:id` | Drafts only |
| POST | `/api/portal/requests/:id/submit` | Creates the JMS job |
| POST | `/api/portal/requests/:id/approve-quote` | `quoted` → `in_production` |
| POST | `/api/portal/requests/:id/cancel` | Cancels locally + in JMS |
| POST | `/api/portal/requests/:id/close` | `delivered` → `closed` |
| POST | `/api/portal/requests/:id/refresh` | Pull JMS state on demand |
| DELETE | `/api/portal/requests/:id` | Draft/cancelled only |

### JMS integration

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/portal/jms/health` | Mode + config presence (no secrets) |
| POST | `/api/portal/jms/webhook` | Signed status events from JMS |
| GET | `/api/portal/jms/events` | Recent deliveries, for debugging |
| POST | `/api/portal/jms/mock/advance/:requestId` | Mock mode only: simulate next lifecycle event |

### Reference & planning

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/portal/reference` | All static portal content in one payload |
| GET | `/api/portal/reference/languages[/:name]` | Profiles + guidance + channels |
| GET | `/api/portal/reference/prioritise?corridor=&scenario=` | Translation Decision Tool ranking |
| GET | `/api/portal/reference/areas[/:token]` | Postcode (`2166`) or LGA (`lga:Fairfield`) lookup |
| GET/POST/PUT/DELETE | `/api/portal/plans` | Engagement Planner persistence |
| GET/POST/DELETE | `/api/portal/insights` | Live insights feed |
| GET/PATCH | `/api/portal/orgs` | Directory + engagement status tracking |

## Trying it locally (mock mode)

```bash
npm run seed:portal
npm run server

# create and submit a request
curl -s -X POST localhost:4000/api/portal/requests -H 'Content-Type: application/json' \
  -d '{"title":"Hardship flyer — Khmer","target_langs":["Khmer"],"formats":["Flyer + audio"]}'
curl -s -X POST localhost:4000/api/portal/requests/<id>/submit

# walk the JMS lifecycle without a live JMS
curl -s -X POST localhost:4000/api/portal/jms/mock/advance/<id>   # -> quoted
curl -s -X POST localhost:4000/api/portal/requests/<id>/approve-quote
curl -s -X POST localhost:4000/api/portal/jms/mock/advance/<id>   # -> in_review
curl -s -X POST localhost:4000/api/portal/jms/mock/advance/<id>   # -> delivered
curl -s -X POST localhost:4000/api/portal/requests/<id>/close
```

## Go-live checklist

1. Set `JMS_MODE=live`, `JMS_BASE_URL`, `JMS_API_KEY`, `JMS_WEBHOOK_SECRET`.
2. Confirm the real JMS job schema and adjust `toJmsJob()` / endpoint paths if needed.
3. Register the webhook URL in JMS with the shared secret.
4. Send a test event and check `GET /api/portal/jms/events` shows it processed.
5. Agree retry policy with JMS (portal acknowledges bad events with 200 + `applied: false`).
