/**
 * HUMAN Maturity Index — Google Sheets response recorder.
 *
 * This script must be container-bound to the Google Sheet that stores
 * responses (open the Sheet, then Extensions > Apps Script, paste this in).
 * Deploy it as a Web app: Execute as "Me", Who has access "Anyone".
 * Paste the deployment's /exec URL into SHEETS_ENDPOINT in index.html.
 * Full walkthrough in ../SETUP.md.
 */

// The Google Sheet that stores responses. Targeting it by ID means the script
// works whether or not it is container-bound to the Sheet.
var SPREADSHEET_ID = "1bZ9XByOflMXhmAMKQTNSl5UmQ2jWGf_HfIpcwezhoLU";
var SHEET_NAME = "Responses";

// Order matters: must match the order the HTML tool asks its 16 checks in.
var STREAMS = ["K1","K2","K3","K4","C1","C2","C3","C4","Y1","Y2","Y3","Y4","T1","T2","T3","T4"];

function headers_() {
  var h = [
    "Timestamp", "Organisation", "Name", "Email", "Team / role", "Store / site",
    "HXI score", "Band",
    "Knowledge", "Capability", "Capacity", "Trust",
    "Unsure answers", "Duration (sec)", "Tool version"
  ];
  STREAMS.forEach(function (c) { h.push(c + " answer"); });
  STREAMS.forEach(function (c) { h.push(c + " score"); });
  return h;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers_());
      sheet.setFrozenRows(1);
    }
    var p = (e && e.parameter) || {};
    var row = [
      new Date(), p.org || "", p.name || "", p.email || "", p.team || "", p.store || "",
      num_(p.hxi), p.band || "",
      num_(p.d_knowledge), num_(p.d_capability), num_(p.d_capacity), num_(p.d_trust),
      num_(p.unsure_count), num_(p.duration_sec), p.version || ""
    ];
    STREAMS.forEach(function (c) { row.push(answerLabel_(p["a_" + c])); });
    STREAMS.forEach(function (c) { row.push(num_(p["s_" + c])); });
    sheet.appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the /exec URL in a browser confirms the deployment is alive.
function doGet() {
  return json_({ ok: true, message: "HUMAN Maturity Index recorder is running. Responses are POSTed here by the tool." });
}

// Raw answers arrive as "1".."5" (ladder level), "0" (none yet) or "unsure".
function answerLabel_(v) {
  if (v === "unsure") return "Don't know";
  if (v === "0") return "None yet";
  if (v === undefined || v === null || v === "") return "";
  return Number(v);
}

function num_(v) {
  if (v === undefined || v === null || v === "") return "";
  var n = Number(v);
  return isNaN(n) ? "" : n;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
