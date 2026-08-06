# HUMAN Maturity Index — Google Sheets setup

The tool in this folder (`index.html`) records every completed check into a
Google Sheet, one row per response, so you can analyse results across a group
(e.g. Woolworths staff). The recording backend is a Google Apps Script web app
bound to the Sheet — no server or hosting account needed beyond your Google
account.

## One-time setup (about 5 minutes)

### 1. Create the Google Sheet

1. Go to [sheets.new](https://sheets.new) and create a blank spreadsheet.
2. Name it something like **HUMAN Maturity Index — Responses**.

You don't need to add any columns — the script creates the header row
automatically on the first response.

### 2. Add the Apps Script

1. In the Sheet, open **Extensions → Apps Script**.
2. Delete any placeholder code and paste in the full contents of
   [`apps-script/Code.gs`](apps-script/Code.gs).
3. Click the save icon.

### 3. Deploy it as a web app

1. Click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me (your account)
   - **Who has access:** **Anyone** ← required, otherwise staff submissions are rejected
4. Click **Deploy**, authorise the script when prompted, and copy the
   **Web app URL** (it ends in `/exec`).

Visiting that URL in a browser should show
`{"ok":true,"message":"HUMAN Maturity Index recorder is running..."}`.

### 4. Connect the tool

1. Open `index.html` in this folder.
2. Find this line near the top of the `<script>` block:

   ```js
   var SHEETS_ENDPOINT="PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
   ```

3. Replace the placeholder with your `/exec` URL, keeping the quotes:

   ```js
   var SHEETS_ENDPOINT="https://script.google.com/macros/s/AKfycb.../exec";
   ```

4. Commit and push (or re-upload the file wherever it is hosted).

### 5. Share the link with staff

Send staff the hosted page URL. The organisation is recorded as
**Woolworths** by default; you can override it per link with a query
parameter, so the same page can serve other clients:

```
https://<your-host>/human-index/?org=Woolworths%20Metro
```

## What gets recorded

One row per completed check:

| Columns | Contents |
|---|---|
| Timestamp | When the response was received (Sheet's timezone) |
| Organisation, Name, Email, Team / role, Store / site | Who answered (name required, rest optional) |
| HXI score, Band | Overall index (geometric mean) and its band |
| Knowledge, Capability, Capacity, Trust | The four domain scores |
| Unsure answers | How many of the 16 checks were answered "Honestly don't know" |
| Duration (sec) | Time from Start to Results |
| Tool version | Version of the tool that submitted |
| K1–T4 answer (16 cols) | Raw answer per check: ladder level 1–5, "None yet", or "Don't know" |
| K1–T4 score (16 cols) | Points per check (level × 20; "None yet" and "Don't know" score 0) |

Answers only reach the Sheet when the respondent completes all 16 checks —
partial runs are not recorded. If the submission fails (e.g. offline), the
respondent still sees their results plus a note asking them to screenshot the
page; nothing is lost silently without the respondent knowing.

## Notes

- **Changing questions later:** if streams are added/removed/reordered in
  `index.html`, update the `STREAMS` array in `Code.gs` to match, and consider
  starting a fresh Sheet tab so old and new rows aren't mixed.
- **Redeploying the script:** after editing `Code.gs`, use
  **Deploy → Manage deployments → Edit → New version** so the existing `/exec`
  URL picks up the change (a brand-new deployment would mint a new URL).
- **Privacy:** the Sheet collects names and optionally work emails. Share the
  Sheet only with people who need to analyse the results.
