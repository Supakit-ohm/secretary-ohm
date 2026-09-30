// ทดสอบบอต Jack (Apps Script) ด้วย Node — จำลอง GAS + Firestore REST + OpenAI Responses + LINE
// รัน: node test/bot-test.js <path preview-dashboard.html> <path backup.json>
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const HTML = process.argv[2], BACKUP = process.argv[3];
const DIR = path.join(__dirname, "..");

// ---------- SecretaryParts ของแอปจริง ----------
const html = fs.readFileSync(HTML, "utf8");
const i0 = html.indexOf("window.SecretaryParts = (function () {");
const i1 = html.indexOf("})();", i0) + 5;
const win = {};
vm.runInNewContext(html.slice(i0, i1), { window: win, TextEncoder, JSON, console, encodeURIComponent, decodeURIComponent });
const SP = win.SecretaryParts;

// ---------- ข้อมูลตั้งต้น ----------
let data = JSON.parse(fs.readFileSync(BACKUP, "utf8"));
data = data.data || data;
const TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
const MONTH = TODAY.slice(0, 7);
const PREV = (() => { const d = new Date(MONTH + "-01T12:00:00Z"); d.setUTCDate(0); return d.toISOString().slice(0, 7); })();
data.finance.expenses.push({ id: "e_prev1", date: PREV + "-15", amount: -200, category: "อาหาร", memo: "ข้าวเย็น", source: "kbank-csv" });
data.finance.expenses.push({ id: "e_cur1", date: MONTH + "-01", amount: -4500, category: "อาหาร", memo: "ต้นเดือน", source: "kbank-csv" });
data.finance.expenses.push({ id: "e_ref1", date: MONTH + "-02", amount: 100, category: "อาหาร", memo: "คืนเงิน", source: "csv-refund" });
data.budgets = { "อาหาร": { amount: 5000, type: "variable" }, "ชา กาแฟ": { amount: 1500, type: "variable" } };
data.finance.investmentValues = { retirement: { value: 100000, updatedAt: TODAY }, gold: { value: 20000, updatedAt: TODAY } };
data.finance.fxRate = { USDTHB: { value: 35, updatedAt: TODAY } };
data.finance.cryptoHoldings = [
  { id: "c1", coin: "BTC", quantity: 0.01, avgCost: 60000, costCurrency: "USD", costFxRate: 34, currentPrice: 100000, priceCurrency: "USD", platform: "Binance Global" },
  { id: "c2", coin: "ETH", quantity: 1, avgCost: 80000, currentPrice: 90000, platform: "Binance TH" }
];
data.finance.cashAccounts = [{ id: "a1", name: "KBank", balance: 50000 }];
data.finance.debts = [{ id: "d1", name: "รถ", currentBalance: 30000 }];
data.tasks = [
  { id: "t_over", projectId: null, title: "งานเลยกำหนด", note: "", status: "pending", dueDate: "2026-01-01", recurrence: "none", weight: 1, completions: {} },
  { id: "t_rec", projectId: null, title: "อ่านหนังสือ", note: "", status: "pending", dueDate: null, recurrence: "daily", weight: 1, completions: {} }
];
data.journal = [{ id: "j_old", date: "2026-08-01", entry: "เก่า" }];
data.notes = [];
data.events = [{ id: "ev1", title: "นัดลูกค้า", startDate: TODAY, startTime: "14:00" }];

// ---------- Fake Firestore ----------
const UID = "UIDOHM123";
const BASE = "projects/personal-os-505713/databases/(default)/documents";
const PFX = BASE + "/users/" + UID + "/parts/";
const FPFX = BASE + "/users/" + UID + "/files/";
const fstore = {};   // ขั้นที่ 8: fileId -> {json, by, updateTime}
let clock = 1;
const store = {};   // docId -> {json, by, size, updateTime}
const ts = () => "2026-09-28T00:00:00." + String(clock++).padStart(6, "0") + "Z";
function seed(parts) { for (const k in parts) store[k] = { json: parts[k], by: "app", updateTime: ts() }; }
seed(SP.split(data));
const partsNow = () => { const o = {}; for (const k in store) o[k] = store[k].json; return o; };
let injectConflict = null;   // fn() ที่รันก่อน commit ครั้งถัดไป (จำลองแอปเขียนแทรก)
let commits = 0, conflictsSeen = 0;

function firestore(url, opt) {
  const u = url.replace("https://firestore.googleapis.com/v1/", "");
  const hdr = opt.headers || {};
  assert.strictEqual(hdr.Authorization, "Bearer tok");
  assert.strictEqual(hdr["x-goog-user-project"], "personal-os-505713");
  if (u.startsWith(BASE + "/users?showMissing=true")) return res(200, { documents: [{ name: BASE + "/users/" + UID }] });
  if (u.startsWith(BASE + "/users/" + UID + "/files?")) {
    return res(200, { documents: Object.keys(fstore).map((id) => ({ name: FPFX + id, fields: { json: { stringValue: fstore[id].json } }, updateTime: fstore[id].updateTime })) });
  }
  if (u === BASE + ":batchGet") {
    const body = JSON.parse(opt.payload);
    return res(200, body.documents.map((n) => {
      if (n.startsWith(FPFX)) { const f = fstore[n.replace(FPFX, "")]; return f ? { found: { name: n, fields: { json: { stringValue: f.json } }, updateTime: f.updateTime } } : { missing: n }; }
      const id = n.replace(PFX, "");
      const d = store[id];
      return d ? { found: { name: n, fields: { json: { stringValue: d.json } }, updateTime: d.updateTime } } : { missing: n };
    }));
  }
  if (u === BASE + ":commit") {
    if (injectConflict) { const f = injectConflict; injectConflict = null; f(); }
    const body = JSON.parse(opt.payload);
    for (const w of body.writes) {
      if (w.delete) { assert.ok(w.delete.startsWith(FPFX), "ลบได้เฉพาะเอกสารไฟล์"); continue; }
      if (w.update.name.startsWith(FPFX)) {
        const cur = fstore[w.update.name.replace(FPFX, "")], pc = w.currentDocument;
        if (pc.exists === false && cur) { conflictsSeen++; return res(409, { error: { status: "ALREADY_EXISTS", message: "exists" } }); }
        if (pc.updateTime && (!cur || cur.updateTime !== pc.updateTime)) { conflictsSeen++; return res(400, { error: { status: "FAILED_PRECONDITION", message: "stale" } }); }
        assert.deepStrictEqual(Object.keys(w.update.fields).sort(), ["by", "json"]);
        assert.strictEqual(w.updateTransforms[0].fieldPath, "at");
        continue;
      }
      const id = w.update.name.replace(PFX, "");
      const cur = store[id];
      const pc = w.currentDocument;
      if (pc.exists === false && cur) { conflictsSeen++; return res(409, { error: { status: "ALREADY_EXISTS", message: "exists" } }); }
      if (pc.updateTime && (!cur || cur.updateTime !== pc.updateTime)) { conflictsSeen++; return res(400, { error: { status: "FAILED_PRECONDITION", message: "stale" } }); }
      assert.deepStrictEqual(Object.keys(w.update.fields).sort(), ["by", "json", "size"]);
      assert.strictEqual(w.updateTransforms[0].fieldPath, "at");
      assert.strictEqual(w.update.fields.by.stringValue, "line-bot");
      assert.strictEqual(Number(w.update.fields.size.integerValue), Buffer.byteLength(w.update.fields.json.stringValue));
    }
    for (const w of body.writes) {
      if (w.delete) { delete fstore[w.delete.replace(FPFX, "")]; continue; }
      if (w.update.name.startsWith(FPFX)) { fstore[w.update.name.replace(FPFX, "")] = { json: w.update.fields.json.stringValue, by: w.update.fields.by.stringValue, updateTime: ts() }; continue; }
      const id = w.update.name.replace(PFX, "");
      store[id] = { json: w.update.fields.json.stringValue, by: "line-bot", updateTime: ts() };
    }
    commits++;
    return res(200, { writeResults: [] });
  }
  throw new Error("unknown firestore url " + u);
}

// ---------- Fake OpenAI ----------
let aiScript = null;          // fn(body, round) -> {calls:[{name,args}]} | {text}
const aiLog = [];
let aiFail = null;
let ocrScript = () => ({ kind: "other", amount: null, currency: null, date: null, memo: null, category: null, confidence: "low" });   // ขั้นที่ 9: ตัวอ่านสลิป (ค่าตั้งต้น = ไม่ใช่สลิป)
const ocrLog = [];
function openai(url, opt) {
  const body = JSON.parse(opt.payload);
  if (body.text && body.text.format) {   // คำขออ่านสลิป (vision + JSON schema) แยกจากแชทปกติ
    ocrLog.push(body);
    assert.strictEqual(body.store, false);
    assert.strictEqual(body.text.format.type, "json_schema");
    assert.strictEqual(body.text.format.strict, true);
    if (aiFail) return res(aiFail.code, { error: { message: aiFail.msg } });
    const r = ocrScript(body);
    if (r === "garbage") return res(200, { model: body.model + "-x", output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: "ไม่ใช่ json" }] }], usage: { input_tokens: 1500, input_tokens_details: { cached_tokens: 0 }, output_tokens: 20 } });
    return res(200, { model: body.model + "-2026-05-18", output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: JSON.stringify(r) }] }], usage: { input_tokens: 1500, input_tokens_details: { cached_tokens: 0 }, output_tokens: 80 } });
  }
  aiLog.push(body);
  if (aiFail) return res(aiFail.code, { error: { message: aiFail.msg } });
  assert.strictEqual(body.store, false);
  const outputs = body.input.filter((x) => x.type === "function_call_output");
  const round = body.input.filter((x) => x.type === "function_call").length ? outputs.length : 0;
  const r = aiScript(body, outputs.map((o) => JSON.parse(o.output)));
  const output = [];
  if (body.reasoning && body.reasoning.effort !== "none") output.push({ type: "reasoning", id: "rs_" + clock, encrypted_content: "xx" });
  if (r.calls) r.calls.forEach((c, i) => output.push({ type: "function_call", id: "fc_" + clock + i, call_id: "call_" + clock++ + "_" + i, name: c.name, arguments: JSON.stringify(c.args) }));
  if (r.text) output.push({ type: "message", role: "assistant", content: [{ type: "output_text", text: r.text }] });
  return res(200, { model: body.model + "-2026-05-18", output, usage: { input_tokens: 5000, input_tokens_details: { cached_tokens: 4000 }, output_tokens: 300 } });
}
// สคริปต์ง่าย: รอบแรกเรียกเครื่องมือตาม calls แล้วรอบถัดไปตอบข้อความ
const once = (calls, text) => (body, outs) => outs.length ? { text: text || "โอเคครับ" } : { calls };

// ---------- Fake LINE ----------
const lineLog = [];
const richmenus = [{ richMenuId: "old1", name: "jack-main-v0" }, { richMenuId: "other", name: "manual-menu" }];
let pushFail = null;
let rmDefault = null, rmImage = null, rmSpec = null;
let previewBytes = 3000;
const contentLog = [];
function blob(n, type) { let name = null; const bytes = Buffer.alloc(n, 7); return { getBytes: () => [...bytes], getContentType: () => type, setName: (x) => { name = x; }, getName: () => name }; }
function line(url, opt) {
  const m = (opt.method || "get").toLowerCase();
  const cm = url.match(/api-data\.line\.me\/v2\/bot\/message\/([^/]+)\/content(\/preview)?$/);
  if (cm) {
    contentLog.push(url);
    assert.strictEqual(opt.headers.Authorization, "Bearer L");
    if (cm[1].startsWith("pdf")) return { getResponseCode: () => 200, getBlob: () => blob(50000, "application/pdf") };
    return { getResponseCode: () => 200, getBlob: () => blob(cm[2] ? previewBytes : 250000, "image/jpeg") };
  }
  if (url.endsWith("/v2/bot/info")) return res(200, { displayName: "Jack", basicId: "@jack" });
  if (url.endsWith("/v2/bot/message/quota/consumption")) return res(200, { totalUsage: lineLog.filter((x) => x.path === "/v2/bot/message/push").length });
  if (url.endsWith("/v2/bot/message/push") && pushFail) return res(pushFail, { message: "fail" });
  if (url.endsWith("/v2/bot/richmenu/list")) return res(200, { richmenus: richmenus.slice() });
  if (url.endsWith("/v2/bot/richmenu") && m === "post") { rmSpec = JSON.parse(opt.payload); richmenus.push({ richMenuId: "new1", name: rmSpec.name }); return res(200, { richMenuId: "new1" }); }
  if (url.includes("api-data.line.me/v2/bot/richmenu/new1/content")) { assert.strictEqual(opt.contentType, "image/png"); rmImage = opt.payload; return res(200, {}); }
  if (url.endsWith("/v2/bot/user/all/richmenu/new1") && m === "post") { assert.ok(!opt.payload); rmDefault = "new1"; return res(200, {}); }
  if (m === "delete") { const id = url.split("/").pop(); const i = richmenus.findIndex((r) => r.richMenuId === id); if (i >= 0) richmenus.splice(i, 1); return res(200, {}); }
  lineLog.push({ path: url.replace("https://api.line.me", ""), body: JSON.parse(opt.payload || "{}") });
  return res(200, {});
}

function res(code, obj) { const t = JSON.stringify(obj); return { getResponseCode: () => code, getContentText: () => t }; }

// ---------- Fake GAS ----------
const propsMap = { LINE_CHANNEL_ACCESS_TOKEN: "L", OPENAI_API_KEY: "sk-x", WEBHOOK_KEY: "SECRET" };
const cacheMap = {};
const triggers = [];
function fmtDate(d, tz, p) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short", hourCycle: "h23" }).formatToParts(d).map((x) => [x.type, x.value]));
  const wd = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[parts.weekday];
  return p.replace("yyyy", parts.year).replace("MM", parts.month).replace("dd", parts.day).replace("HH", parts.hour).replace("mm", parts.minute).replace("ss", parts.second)
    .replace(/^H$/, String(Number(parts.hour))).replace(/^u$/, String(wd)).replace("d/M", Number(parts.day) + "/" + Number(parts.month));
}
const drive = { folders: {}, files: {}, n: 0 };
const iter = (arr) => { let i = 0; return { hasNext: () => i < arr.length, next: () => arr[i++] }; };
function mkFolder(name, parent) {
  const id = "fold" + (++drive.n);
  const f = { id, name, parent, trashed: false, getId: () => id, isTrashed: () => f.trashed, getUrl: () => "https://drive.google.com/drive/folders/" + id,
    getFoldersByName: (nm) => iter(Object.values(drive.folders).filter((x) => x.parent === id && x.name === nm)),
    createFolder: (nm) => mkFolder(nm, id),
    createFile: (b) => { const fid = "drv" + (++drive.n); const file = { id: fid, name: b.getName(), parent: id, bytes: b.getBytes().length, trashed: false, getId: () => fid, getUrl: () => "https://drive.google.com/file/d/" + fid + "/view", setTrashed: (t) => { file.trashed = t; } }; drive.files[fid] = file; return file; } };
  drive.folders[id] = f; return f;
}
const ROOT = mkFolder("SecretaryOhmApp", null);   // แอปสร้างไว้แล้ว (สำรองรายสัปดาห์)
const ctx = {
  console: { log: () => {}, error: (e) => { if (process.env.DEBUG) console.error("GAS error:", e); } },
  JSON, Math, Date, String, Number, Object, Array, isFinite, isNaN, Error, encodeURIComponent, decodeURIComponent, RegExp,
  UrlFetchApp: { fetch: (url, opt) => {
    opt = opt || {};
    if (url.startsWith("https://firestore.googleapis.com/")) return firestore(url, opt);
    if (url.startsWith("https://api.openai.com/")) return openai(url, opt);
    if (url.startsWith("https://api.line.me/") || url.startsWith("https://api-data.line.me/")) return line(url, opt);
    if (url.startsWith("https://www.googleapis.com/drive/v3/files/")) return res(200, { thumbnailLink: "https://lh3.googleusercontent.com/thumb=s220" });
    if (url === "https://lh3.googleusercontent.com/thumb=s160") return { getResponseCode: () => 200, getBlob: () => blob(4000, "image/png") };
    if (url.startsWith("https://supakit-ohm.github.io/")) return { getResponseCode: () => 200, getContentText: () => "", getBlob: () => ({ getBytes: () => [137, 80, 78, 71] }) };
    throw new Error("unexpected fetch " + url);
  } },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in propsMap ? propsMap[k] : null), setProperty: (k, v) => { propsMap[k] = String(v); }, deleteProperty: (k) => { delete propsMap[k]; } }) },
  CacheService: { getScriptCache: () => ({ get: (k) => (k in cacheMap ? cacheMap[k] : null), put: (k, v) => { assert.ok(String(v).length < 100000, "cache value too big"); cacheMap[k] = String(v); }, remove: (k) => { delete cacheMap[k]; }, removeAll: (ks) => ks.forEach((k) => delete cacheMap[k]) }) },
  LockService: { getScriptLock: () => ({ waitLock: () => {}, tryLock: () => true, releaseLock: () => {} }) },
  Utilities: {
    formatDate: fmtDate, getUuid: () => require("crypto").randomUUID(), sleep: () => {},
    newBlob: (s) => ({ getBytes: () => [...Buffer.from(s, "utf8")] }),
    base64EncodeWebSafe: (x) => Buffer.from(x).toString("base64url"),
    base64Encode: (x) => Buffer.from(x).toString("base64"),
  },
  ContentService: { createTextOutput: (t) => ({ t }) },
  DriveApp: {
    getFolderById: (id) => { if (!drive.folders[id]) throw new Error("no folder"); return drive.folders[id]; },
    getFoldersByName: (nm) => iter(Object.values(drive.folders).filter((x) => !x.parent && x.name === nm)),
    createFolder: (nm) => mkFolder(nm, null),
    getFileById: (id) => { if (!drive.files[id]) throw new Error("File not found"); return drive.files[id]; },
  },
  ScriptApp: {
    getOAuthToken: () => "tok",
    WeekDay: { SUNDAY: "SUNDAY" },
    getProjectTriggers: () => triggers.slice(),
    deleteTrigger: (t) => { const i = triggers.indexOf(t); if (i >= 0) triggers.splice(i, 1); },
    newTrigger: (fn) => { const spec = { fn }; const b = {
      timeBased: () => b, atHour: (h) => { spec.hour = h; return b; }, nearMinute: (m) => { spec.minute = m; return b; },
      everyDays: (d) => { spec.everyDays = d; return b; }, inTimezone: (tz) => { spec.tz = tz; return b; }, onWeekDay: (w) => { spec.weekDay = w; return b; },
      create: () => { const t = { spec, getHandlerFunction: () => fn }; triggers.push(t); return t; } }; return b; },
  },
};
vm.createContext(ctx);
for (const f of ["Config.gs", "Persona.gs", "Bot.gs", "Files.gs"]) vm.runInContext(fs.readFileSync(path.join(DIR, f), "utf8"), ctx, { filename: f });

// ขั้นที่ 1: Jack ไม่มีเครื่องมือจดเงินแล้ว (ไม่อยู่ใน TOOLS) — แต่เทสต์ส่วนไฟล์แนบ/ยกเลิก/OCR ยังต้องสร้างรายการเงินเป็นข้อมูลตั้งต้น
// จึงต่อ "ทางลัดเฉพาะเทสต์" ให้ add_expense/add_income เรียกฟังก์ชันภายใน · เทสต์ขั้นที่ 1 ใช้ REAL_TOOLS ตรวจว่า AI มองไม่เห็นเครื่องมือเหล่านี้จริง
const realRunTool = ctx.runTool_;
ctx.runTool_ = (name, args, c) => name === "add_expense" ? ctx.toolAddExpense_(args || {}, c) : name === "add_income" ? ctx.toolAddIncome_(args || {}, c) : realRunTool(name, args, c);
const withRealTools = (fn) => { const keep = ctx.runTool_; ctx.runTool_ = realRunTool; try { return fn(); } finally { ctx.runTool_ = keep; } };

// ---------- helpers ----------
let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("✅ " + name); }
  catch (e) { console.log("❌ " + name + "\n   " + (e.stack || e).toString().split("\n").slice(0, 4).join("\n   ")); process.exitCode = 1; }
}
let evn = 0;
function post(events, key) { return ctx.doPost({ parameter: { k: key === undefined ? "SECRET" : key }, postData: { contents: JSON.stringify({ events }) } }); }
const msg = (text, user) => ({ type: "message", webhookEventId: "ev" + evn++, replyToken: "rt" + evn, source: { type: "user", userId: user || "U_OHM" }, message: { type: "text", text } });
const pb = (data) => ({ type: "postback", webhookEventId: "ev" + evn++, replyToken: "rt" + evn, source: { type: "user", userId: "U_OHM" }, postback: { data } });
const lastReply = () => { const r = lineLog.filter((x) => x.path === "/v2/bot/message/reply").pop(); return r && r.body.messages[0]; };
const app = () => SP.assemble(partsNow());
const canonical = () => { const p = partsNow(); const again = SP.split(SP.assemble(p)); const diff = Array.from(SP.diffIds(again, p)); assert.strictEqual(diff.length, 0, "ไม่อยู่ในรูปแบบมาตรฐานของแอป: " + diff.join(",")); };
const month = (m) => app().finance.expenses.filter((e) => String(e.date).slice(0, 7) === m);

// =================== TESTS ===================
test("รหัสลับผิด → ไม่ทำอะไรเลย", () => {
  post([msg("hi")], "WRONG");
  assert.strictEqual(lineLog.length, 0);
  assert.ok(!propsMap.OWNER_LINE_USER_ID);
});

test("Verify จาก LINE (events ว่าง) → ok", () => { const o = post([]); assert.strictEqual(o.t, "ok"); });

test("ข้อความแรก → ล็อก userId ของโอม + ทักทาย ไม่เรียก AI", () => {
  post([msg("สวัสดี")]);
  assert.strictEqual(propsMap.OWNER_LINE_USER_ID, "U_OHM");
  assert.ok(lastReply().text.includes("โอม"));
  assert.strictEqual(aiLog.length, 0);
});

test("คนอื่นทักมา → เงียบ", () => {
  const n = lineLog.length;
  post([msg("ขอยืมเงิน", "U_OTHER")]);
  assert.strictEqual(lineLog.length, n);
});

test("[ข้อมูลตั้งต้น ผ่านทางลัดเทสต์] จดรายจ่าย: ติดลบ + source manual + via line + activity + ปุ่มแก้/ยกเลิก + รูปแบบมาตรฐาน", () => {
  aiScript = once([{ name: "add_expense", args: { amount: 60, category: "อาหาร", memo: "ข้าวมันไก่" } }], "จดแล้วครับ ข้าวมันไก่ 60");
  post([msg("ข้าวมันไก่ 60")]);
  const e = month(MONTH).filter((x) => x.memo === "ข้าวมันไก่");
  assert.strictEqual(e.length, 1);
  assert.strictEqual(e[0].amount, -60);
  assert.strictEqual(e[0].source, "manual");
  assert.strictEqual(e[0].via, "line");
  assert.strictEqual(e[0].date, TODAY);
  assert.ok(app().activity[0].text.includes("อาหาร") && app().activity[0].text.includes("LINE"));
  const r = lastReply();
  assert.strictEqual(r.text, "จดแล้วครับ ข้าวมันไก่ 60");
  assert.deepStrictEqual(r.quickReply.items.map((i) => i.action.label), ["แก้", "ยกเลิก"]);
  canonical();
  // prompt มีหมวด + วันที่ + reasoning ส่งกลับ
  const b = aiLog[aiLog.length - 1];
  assert.ok(b.instructions.includes(TODAY) && b.instructions.includes("Jack") && !b.instructions.includes("หมวดรายจ่ายที่มีอยู่"));
  assert.ok(b.input.some((x) => x.type === "reasoning"), "ต้องส่ง reasoning item กลับไปในรอบที่ 2");
  assert.deepStrictEqual(b.include, ["reasoning.encrypted_content"]);
  assert.strictEqual(b.model, "gpt-6-luna");
});

test("ผลเครื่องมือบอกสถานะงบหมวดนั้น (หักคืนเงินแบบ expOut)", () => {
  const b = aiLog[aiLog.length - 1];
  const out = JSON.parse(b.input.find((x) => x.type === "function_call_output").output);
  assert.strictEqual(out.budget.budget, 5000);
  assert.strictEqual(out.budget.usedThisMonth, 4500 - 100 + 60);
});

test("ยกเลิกด้วยปุ่ม → รายการ + activity หาย", () => {
  const tok = new URLSearchParams(lastReply().quickReply.items[1].action.data).get("r");
  const actBefore = app().activity.length;
  post([pb("a=undo&r=" + tok)]);
  assert.strictEqual(month(MONTH).filter((x) => x.memo === "ข้าวมันไก่").length, 0);
  assert.strictEqual(app().activity.length, actBefore - 1);
  assert.ok(lastReply().text.startsWith("ยกเลิกแล้ว"));
  post([pb("a=undo&r=" + tok)]);
  assert.ok(lastReply().text.includes("ยกเลิกไปแล้ว"));
  canonical();
});

test("กบข. ผ่าน add_expense → ไปอยู่ investments (retirement, บวก) ไม่ใช่รายจ่าย", () => {
  const nExp = app().finance.expenses.length;
  aiScript = once([{ name: "add_expense", args: { amount: 1500, category: "กบข.", memo: "สะสม กบข." } }]);
  post([msg("กบข 1500")]);
  assert.strictEqual(app().finance.expenses.length, nExp);
  const inv = app().finance.investments.filter((v) => v.via === "line");
  assert.strictEqual(inv.length, 1);
  assert.strictEqual(inv[0].amount, 1500);
  assert.strictEqual(inv[0].type, "retirement");
  canonical();
});

test("รายรับ: บวก + มี month", () => {
  aiScript = once([{ name: "add_income", args: { amount: 3000, source: "อื่นๆ", note: "ขายของ", date: PREV + "-20" } }]);
  post([msg("เมื่อเดือนก่อนขายของได้ 3000")]);
  const i = app().finance.income.find((x) => x.note === "ขายของ");
  assert.strictEqual(i.amount, 3000);
  assert.strictEqual(i.month, PREV);
  assert.strictEqual(i.date, PREV + "-20");
  canonical();
});

test("หลายรายการในข้อความเดียว → ปุ่มยกเลิกทีละอัน", () => {
  aiScript = once([
    { name: "add_expense", args: { amount: 45, category: "ชา กาแฟ", memo: "ลาเต้" } },
    { name: "add_expense", args: { amount: 120, category: "อาหาร", memo: "ส้มตำ" } }]);
  post([msg("ลาเต้ 45 ส้มตำ 120")]);
  const items = lastReply().quickReply.items;
  assert.strictEqual(items.length, 2);
  assert.ok(items.every((i) => i.action.label.length <= 20));
  assert.strictEqual(month(MONTH).filter((x) => x.memo === "ลาเต้" || x.memo === "ส้มตำ").length, 2);
});

test("ขั้นที่ 1: update_entry แก้รายการเงินไม่ได้ (คืนเงิน/รายจ่าย) — ข้อมูลไม่เปลี่ยน", () => {
  aiScript = once([{ name: "add_expense", args: { amount: 99, category: "อาหาร", memo: "ชาบูขั้น1" } }]);
  post([msg("ชาบู 99")]);
  const ref = JSON.parse(cacheMap.recent)[0].ref;
  let outs = [];
  aiScript = (body) => {
    outs = body.input.filter((x) => x.type === "function_call_output").map((o) => JSON.parse(o.output));
    return outs.length ? { text: "ไม่ได้ครับ" } : { calls: [
      { name: "update_entry", args: { ref, amount: 459 } },
      { name: "update_entry", args: { ref: "fg.expenses." + MONTH + "#e_ref1", amount: 150 } }] };
  };
  post([msg("แก้ยอด")]);
  assert.strictEqual(outs.length, 2);
  assert.ok(outs.every((o) => o.ok === false && o.error.includes("ไม่แก้/ลบรายการเงิน")), JSON.stringify(outs));
  assert.strictEqual(month(MONTH).find((x) => x.memo === "ชาบูขั้น1").amount, -99);
  assert.strictEqual(month(MONTH).find((x) => x.id === "e_ref1").amount, 100);
  canonical();
});

test("งาน: เพิ่ม → ดูรายการ → ทำเสร็จ (ครั้งเดียว + งานประจำ) → ยกเลิก", () => {
  aiScript = once([{ name: "add_task", args: { title: "โทรหาซัพพลายเออร์", dueDate: TODAY } }]);
  post([msg("เพิ่มงาน โทรหาซัพพลายเออร์ วันนี้")]);
  const t = app().tasks.find((x) => x.title === "โทรหาซัพพลายเออร์");
  assert.deepStrictEqual([t.status, t.dueDate, t.recurrence, t.projectId, t.weight], ["pending", TODAY, "none", null, 1]);
  let listOut = null;
  aiScript = (b, outs) => outs.length ? (listOut = outs[0], { text: "มี 3 งาน" }) : { calls: [{ name: "list_tasks", args: {} }] };
  post([msg("วันนี้มีงานอะไร")]);
  assert.strictEqual(listOut.overdue[0].title, "งานเลยกำหนด");
  assert.ok(listOut.today.some((x) => x.title === "โทรหาซัพพลายเออร์"));
  assert.strictEqual(listOut.recurringToday[0].title, "อ่านหนังสือ");
  aiScript = once([{ name: "complete_task", args: { ref: "k.tasks#" + t.id } }, { name: "complete_task", args: { ref: "k.tasks#t_rec" } }]);
  post([msg("โทรแล้ว อ่านหนังสือแล้ว")]);
  assert.strictEqual(app().tasks.find((x) => x.id === t.id).status, "done");
  assert.strictEqual(app().tasks.find((x) => x.id === "t_rec").completions[TODAY], true);
  assert.strictEqual(app().activity[0].status, "completed");
  const undoRec = lastReply().quickReply.items[1].action.data;
  post([pb(undoRec)]);
  assert.ok(!app().tasks.find((x) => x.id === "t_rec").completions[TODAY], "ยกเลิกต้องคืนสถานะเดิม");
  canonical();
});

test("Journal: เขียนใหม่ → ต่อท้ายวันเดิม → ยกเลิกอันที่ต่อ → ตัดเฉพาะส่วนที่ต่อ", () => {
  aiScript = once([{ name: "add_journal", args: { text: "วันนี้ขายดี" } }]);
  post([msg("journal วันนี้ขายดี")]);
  aiScript = once([{ name: "add_journal", args: { text: "เย็นไปกินหมูกระทะ" } }]);
  post([msg("เพิ่ม journal เย็นไปกินหมูกระทะ")]);
  let j = app().journal.find((x) => x.date === TODAY);
  assert.strictEqual(j.entry, "วันนี้ขายดี\nเย็นไปกินหมูกระทะ");
  post([pb(lastReply().quickReply.items[1].action.data)]);
  j = app().journal.find((x) => x.date === TODAY);
  assert.strictEqual(j.entry, "วันนี้ขายดี");
  assert.ok(app().journal.find((x) => x.id === "j_old"));
  canonical();
});

test("โน้ต", () => {
  aiScript = once([{ name: "add_note", args: { text: "ไอเดีย: ทำโปรลูกค้าประจำ" } }]);
  post([msg("จดไว้หน่อย ไอเดีย ทำโปรลูกค้าประจำ")]);
  const n = app().notes[0];
  assert.deepStrictEqual([n.text, n.color], ["ไอเดีย: ทำโปรลูกค้าประจำ", "amber"]);
});

test("สรุป: ตัวเลขตรงกับสูตรในแอป (expOut, พอร์ต THB/USD, net worth)", () => {
  let out = null;
  aiScript = (b, outs) => outs.length ? (out = outs[0], { text: "สรุปครับ" }) : { calls: [{ name: "get_summary", args: {} }] };
  post([msg("เดือนนี้ใช้ไปเท่าไหร่")]);
  const d = app();
  const exp = d.finance.expenses.filter((e) => String(e.date).slice(0, 7) === MONTH).reduce((s, e) => s - e.amount, 0);
  assert.strictEqual(out.expenses.total, Math.round(exp * 100) / 100);
  const btcVal = 0.01 * 100000 * 35, ethVal = 90000;
  assert.strictEqual(out.portfolio.crypto.value, btcVal + ethVal);
  assert.strictEqual(out.portfolio.crypto.cost, 0.01 * 60000 * 34 + 80000);
  assert.strictEqual(out.portfolio.total, 100000 + 20000 + btcVal + ethVal);
  assert.strictEqual(out.netWorth, 50000 + out.portfolio.total - 30000);
  assert.strictEqual(out.events[0].title, "นัดลูกค้า");
  assert.ok(out.tasks.overdue >= 1);
  assert.strictEqual(out.expenses.byCategory.find((c) => c.category === "อาหาร").budget, 5000);
});

test("คำถามวิเคราะห์ → ใช้ gpt-6-sol effort medium", () => {
  aiScript = once([{ name: "get_summary", args: {} }], "วิเคราะห์ให้ครับ");
  post([msg("ช่วยวิเคราะห์การใช้เงินเดือนนี้หน่อย")]);
  assert.strictEqual(aiLog[aiLog.length - 1].model, "gpt-6-sol");
  assert.strictEqual(aiLog[aiLog.length - 1].reasoning.effort, "medium");
});

test("ค้นรายจ่าย (อ่านอย่างเดียว) ได้ dataAsOf · สั่งลบตาม ref ถูกปฏิเสธ รายการยังอยู่", () => {
  let found = null, delOut = null;
  aiScript = (b) => {
    const outs = b.input.filter((x) => x.type === "function_call_output").map((o) => JSON.parse(o.output));
    if (outs.length === 0) return { calls: [{ name: "search_expenses", args: { keyword: "ลาเต้" } }] };
    if (outs.length === 1) { found = outs[0]; return { calls: [{ name: "delete_entry", args: { ref: found.items[0].ref } }] }; }
    delOut = outs[1];
    return { text: "ลบไม่ได้ครับ" };
  };
  post([msg("ลบลาเต้เมื่อกี้")]);
  assert.strictEqual(found.matched, 1);
  assert.ok("dataAsOf" in found);
  assert.strictEqual(delOut.ok, false);
  assert.strictEqual(month(MONTH).filter((x) => x.memo === "ลาเต้").length, 1);
  canonical();
});

test("แอปเขียนแทรกพร้อมกัน → บอตอ่านใหม่แล้วเขียนซ้ำ ไม่ทับของแอป", () => {
  const before = conflictsSeen;
  injectConflict = () => {
    const id = "fg.expenses." + MONTH;
    const arr = JSON.parse(store[id].json);
    arr.push({ id: "from_app", date: TODAY, amount: -10, category: "ขนม", memo: "จากแอป", source: "manual" });
    store[id] = { json: JSON.stringify(arr), by: "app", updateTime: ts() };
  };
  aiScript = once([{ name: "add_expense", args: { amount: 30, category: "ขนม", memo: "จากบอต" } }]);
  post([msg("ขนม 30")]);
  assert.strictEqual(conflictsSeen, before + 1);
  const m = month(MONTH);
  assert.ok(m.find((x) => x.memo === "จากแอป") && m.find((x) => x.memo === "จากบอต"));
});

test("เดือนใหม่ที่ยังไม่มีเอกสาร → สร้างเอกสารใหม่ (exists:false) แอปอ่านได้", () => {
  aiScript = once([{ name: "add_expense", args: { amount: 500, category: "อาหาร", memo: "จองโต๊ะล่วงหน้า", date: "2027-01-05" } }]);
  post([msg("x")]);
  assert.ok(store["fg.expenses.2027-01"]);
  assert.strictEqual(month("2027-01")[0].amount, -500);
  canonical();
});

test("เอกสารใหญ่ใกล้ 400KB → ตัดท่อน ~2 และแอปประกอบกลับได้", () => {
  const id = "fg.expenses.2027-02";
  const big = [];
  for (let i = 0; big.length < 5000 && Buffer.byteLength(JSON.stringify(big)) < 400 * 1024 - 60; i++) big.push({ id: "b" + i, date: "2027-02-01", amount: -1, category: "อื่นๆ", memo: "x".repeat(60), source: "manual" });
  store[id] = { json: JSON.stringify(big), by: "app", updateTime: ts() };
  aiScript = once([{ name: "add_expense", args: { amount: 7, category: "อื่นๆ", memo: "ท่อนสอง", date: "2027-02-02" } }]);
  post([msg("y")]);
  assert.ok(store[id + "~2"], "ต้องมีท่อน ~2");
  const m = month("2027-02");
  assert.strictEqual(m.length, big.length + 1);
  assert.strictEqual(m[m.length - 1].memo, "ท่อนสอง");
  canonical();
});

test("ค่าใช้จ่าย AI ถูกนับ (luna: 1000*0.10 + 4000*0.01 + 300*0.5 ต่อล้าน)", () => {
  const u = JSON.parse(propsMap[Object.keys(propsMap).find((k) => k.startsWith("usage_"))]);
  assert.ok(u.byModel["gpt-6-luna-2026-05-18"] > 0);
  const per = (1000 * 0.10 + 4000 * 0.01 + 300 * 0.5) / 1e6;
  const lunaCalls = aiLog.filter((b) => b.model === "gpt-6-luna").length;
  assert.ok(Math.abs(u.byModel["gpt-6-luna-2026-05-18"] - per * lunaCalls) < 1e-6);
  assert.ok(u.byModel["gpt-6-sol-2026-05-18"] > 0);
});

test("สถานะ jack → ไม่เรียก AI", () => {
  const n = aiLog.length;
  post([msg("สถานะ jack")]);
  assert.strictEqual(aiLog.length, n);
  assert.ok(lastReply().text.includes("$"));
});

test("เพดานเต็ม → ไม่เรียก AI · ไม่จดเงิน (ขั้นที่ 1) · บอกให้ใช้ปุ่มเมนู/เปิดแอป", () => {
  const key = Object.keys(propsMap).find((k) => k.startsWith("usage_"));
  const u = JSON.parse(propsMap[key]); u.usd = 5.0; propsMap[key] = JSON.stringify(u);
  const n = aiLog.length, nExp = app().finance.expenses.length;
  try {
    post([msg("ข้าวผัดกะเพรา 50")]);
    assert.strictEqual(aiLog.length, n);
    assert.strictEqual(app().finance.expenses.length, nExp, "Jack ไม่จดเงินแล้ว แม้อยู่โหมดสำรอง");
    assert.ok(lastReply().text.includes("เพดาน") && lastReply().text.includes("เปิดแอป"));
    post([msg("สรุปงานให้หน่อย")]);
    assert.ok(lastReply().text.includes("เปิดแอป"));
    assert.strictEqual(aiLog.length, n);
  } finally { u.usd = 0.5; propsMap[key] = JSON.stringify(u); }
});

test("OpenAI 401 → ถอยไปโหมดสำรอง + เก็บ LAST_ERROR", () => {
  aiFail = { code: 401, msg: "Incorrect API key" };
  post([msg("ลาเต้ 55")]);
  aiFail = null;
  assert.ok(lastReply().text.includes("API key ไม่ถูกต้อง"));
  assert.ok(!month(MONTH).find((x) => x.memo === "ลาเต้" && x.amount === -55), "โหมดสำรองไม่จดเงินแล้ว");
  assert.ok(propsMap.LAST_ERROR.includes("401"));
});

test("LINE ส่งเหตุการณ์ซ้ำ (webhookEventId เดิม) → ทำครั้งเดียว", () => {
  aiScript = once([{ name: "add_expense", args: { amount: 11, category: "ขนม", memo: "ซ้ำ" } }]);
  const ev = msg("ซ้ำ 11");
  post([ev]); post([ev]);
  assert.strictEqual(month(MONTH).filter((x) => x.memo === "ซ้ำ").length, 1);
});

test("ความจำสั้น: ส่งประวัติแชทเข้าไปด้วย (ไม่เกิน HISTORY_TURNS)", () => {
  aiScript = once([], "โอเค");
  aiScript = () => ({ text: "จำได้ครับ" });
  post([msg("เมื่อกี้จดอะไรไป")]);
  const b = aiLog[aiLog.length - 1];
  const turns = b.input.filter((x) => x.role === "user").length;
  assert.ok(turns >= 2 && turns <= ctx.CONFIG.HISTORY_TURNS + 1);
  assert.ok(b.instructions.includes("รายการที่บันทึกล่าสุด"));
});

test("AI เรียกเครื่องมือวนไม่จบ → หยุดที่ MAX_TOOL_ROUNDS แล้วสรุปเอง", () => {
  const n = aiLog.length;
  aiScript = () => ({ calls: [{ name: "list_tasks", args: {} }] });
  post([msg("วน")]);
  assert.strictEqual(aiLog.length - n, ctx.CONFIG.MAX_TOOL_ROUNDS);
  assert.ok(lastReply().text.length > 0);
});

test("ไม่มีเอกสาร k.journal (ตัวบอก key) → สร้างให้ แอปเห็น journal", () => {
  delete store["k.journal"];
  assert.ok(!app().journal);
  aiScript = once([{ name: "add_journal", args: { text: "ทดสอบ marker", date: "2027-03-01" } }]);
  post([msg("z")]);
  assert.ok(app().journal.find((j) => j.entry === "ทดสอบ marker"));
  canonical();
});

test("ข้อความชนิดอื่น (สติกเกอร์/เสียง) → บอกว่ารับได้แค่ข้อความ รูป PDF", () => {
  post([{ type: "message", webhookEventId: "stk1", replyToken: "rti", source: { type: "user", userId: "U_OHM" }, message: { type: "sticker", id: "1" } }]);
  assert.ok(lastReply().text.includes("รูป และ PDF"));
  assert.strictEqual(Object.keys(fstore).length, 0);
});

test("Rich Menu: ติดตั้ง 6 ปุ่ม + อัปรูป + ตั้งเป็นเมนูหลัก + ลบเมนูเก่าของ Jack (ไม่แตะเมนูอื่น)", () => {
  assert.strictEqual(ctx.setupRichMenu(), true);
  assert.strictEqual(rmDefault, "new1");
  assert.ok(rmImage && rmImage.length);
  assert.strictEqual(rmSpec.areas.length, 6);
  const covered = rmSpec.areas.reduce((a, x) => a + x.bounds.width * x.bounds.height, 0);
  assert.strictEqual(covered, 2500 * 1686, "ปุ่มต้องเต็มพื้นที่พอดี");
  rmSpec.areas.forEach((x) => { assert.ok(x.bounds.x + x.bounds.width <= 2500 && x.bounds.y + x.bounds.height <= 1686); });
  assert.ok(rmSpec.chatBarText.length <= 14);
  assert.ok(rmSpec.areas.every((x) => (x.action.label || "").length <= 20));
  assert.ok(rmSpec.areas[5].action.uri.includes("openExternalBrowser=1"));
  assert.deepStrictEqual(richmenus.map((r) => r.richMenuId).sort(), ["new1", "other"]);
});

test("ปุ่มเมนูเปิดคีย์บอร์ด (noop) → ไม่ตอบ ไม่เรียก AI", () => {
  const nL = lineLog.length, nA = aiLog.length;
  post([pb("a=noop")]);
  assert.strictEqual(lineLog.length, nL);
  assert.strictEqual(aiLog.length, nA);
});

test("ปุ่ม งานวันนี้ → ตอบทันทีไม่ใช้ AI + ปุ่ม ✓ ติ๊กเสร็จ → ติ๊กได้จริง + ยกเลิกได้", () => {
  aiScript = once([{ name: "add_task", args: { title: "ส่งของให้ลูกค้า", dueDate: TODAY } }]);
  post([msg("เพิ่มงาน ส่งของให้ลูกค้า")]);
  const nA = aiLog.length;
  post([pb("a=menu&m=tasks")]);
  assert.strictEqual(aiLog.length, nA);
  const r = lastReply();
  if (process.env.SHOW) console.log(r.text + "\n---");
  assert.ok(r.text.includes("งานเลยกำหนด") && r.text.includes("ส่งของให้ลูกค้า") && r.text.includes("เลยกำหนด"));
  const btn = r.quickReply.items.find((i) => i.action.label.includes("ส่งของ"));
  assert.ok(btn.action.label.length <= 20);
  post([pb(btn.action.data)]);
  assert.ok(lastReply().text.startsWith("เสร็จแล้ว ✓"));
  const t = app().tasks.find((x) => x.title === "ส่งของให้ลูกค้า");
  assert.strictEqual(t.status, "done");
  assert.strictEqual(aiLog.length, nA);
  post([pb(lastReply().quickReply.items[0].action.data)]);   // ยกเลิก
  assert.strictEqual(app().tasks.find((x) => x.title === "ส่งของให้ลูกค้า").status, "pending");
  post([pb(btn.action.data)]);
  post([pb(btn.action.data)]);
  assert.ok(lastReply().text.includes("ติ๊กไว้แล้ว"));
});

test("ปุ่ม ยอดเดือนนี้ → สรุปไม่ใช้ AI ตัวเลขตรง + ปุ่มวิเคราะห์ต่อ", () => {
  const nA = aiLog.length;
  post([pb("a=menu&m=month")]);
  assert.strictEqual(aiLog.length, nA);
  const r = lastReply();
  const exp = app().finance.expenses.filter((e) => String(e.date).slice(0, 7) === MONTH).reduce((s, e) => s - e.amount, 0);
  const fmt = (n) => { const x = Math.round(n * 100) / 100; const [a, b] = String(Math.abs(x)).split("."); return (x < 0 ? "-" : "") + a.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (b ? "." + b : ""); };
  assert.ok(r.text.includes("รายจ่าย " + fmt(exp) + " บาท / งบ 6,500"), r.text);
  assert.ok(r.text.includes("อาหาร"));
  assert.ok(!/NaN|undefined/.test(r.text), r.text);
  assert.strictEqual(r.quickReply.items[0].action.type, "message");
  if (process.env.SHOW) console.log(r.text);
});

test("checkAll ผ่านทุกข้อกับของปลอม", () => { assert.strictEqual(ctx.checkAll(), true); });


// =================== ขั้นที่ 7: ความจำระยะยาว ===================
const lastPush = () => { const r = lineLog.filter((x) => x.path === "/v2/bot/message/push").pop(); return r && r.body; };
const pushCount = () => lineLog.filter((x) => x.path === "/v2/bot/message/push").length;
const mem = () => JSON.parse(JSON.stringify(app().jackMemory || []));

test("ความจำ: ยังว่าง → context บอกว่ายังไม่มี · 'jack จำอะไรบ้าง' ไม่เรียก AI", () => {
  aiScript = () => ({ text: "ครับ" });
  post([msg("หวัดดี")]);
  assert.ok(aiLog[aiLog.length - 1].instructions.includes("สิ่งที่ Jack จำเกี่ยวกับโอม: (ยังไม่มี)"));
  const n = aiLog.length;
  post([msg("jack จำอะไรบ้าง")]);
  assert.strictEqual(aiLog.length, n);
  assert.ok(lastReply().text.includes("ยังไม่ได้จำ"));
});

test("ความจำ: สั่งจำ → เก็บใน k.jackMemory (แอปถือไว้ได้ รูปแบบมาตรฐาน) + ปุ่ม 'ลืม:' + รอบถัดไป AI เห็น", () => {
  aiScript = once([{ name: "remember", args: { text: "โอมไม่กินเผ็ด" } }], "จำไว้แล้วครับ");
  post([msg("จำไว้ว่าเราไม่กินเผ็ด")]);
  assert.deepStrictEqual(mem().map((m) => [m.id, m.text]), [["m1", "โอมไม่กินเผ็ด"]]);
  assert.strictEqual(mem()[0].at, TODAY);
  canonical();
  const q = lastReply().quickReply.items;
  assert.ok(q.some((i) => i.action.data === "a=forget&id=m1" && i.action.label.length <= 20));
  aiScript = () => ({ text: "โอเค" });
  post([msg("กินอะไรดี")]);
  assert.ok(aiLog[aiLog.length - 1].instructions.includes("ข้อ 1 (id=m1): โอมไม่กินเผ็ด"));
});

test("ความจำ: ซ้ำไม่เพิ่ม · id เดินต่อ · รหัสผ่าน/เลขบัญชีไม่จำ · เบอร์โทรจำได้", () => {
  aiScript = once([{ name: "remember", args: { text: "โอมไม่กินเผ็ด" } }, { name: "remember", args: { text: "ทุกวันที่ 25 โอนค่าเช่าร้าน 15,000 บาท" } },
    { name: "remember", args: { text: "รหัสผ่านเน็ตบ้าน abc123" } }, { name: "remember", args: { text: "บัญชีกสิกร 123-4-56789-0" } },
    { name: "remember", args: { text: "เบอร์ซัพพลายเออร์ผ้า 081-234-5678" } }]);
  post([msg("จำหลายอย่าง")]);
  const outs = aiLog[aiLog.length - 1].input.filter((x) => x.type === "function_call_output").map((o) => JSON.parse(o.output));
  assert.strictEqual(outs[0].already, true);
  assert.strictEqual(outs[2].ok, false); assert.strictEqual(outs[3].ok, false);
  assert.deepStrictEqual(mem().map((m) => m.id), ["m1", "m2", "m3"]);
  assert.ok(mem().find((m) => m.text.includes("081-234-5678")));
  canonical();
});

test("ความจำ: รายการ + ปุ่มลืม (postback ไม่ใช้ AI) · ลืมผ่าน AI ด้วย id", () => {
  const n = aiLog.length;
  post([msg("Jack จำอะไรบ้าง?")]);
  const r = lastReply();
  assert.ok(r.text.includes("1. โอมไม่กินเผ็ด") && r.text.includes("(3/60)"), r.text);
  const btn = r.quickReply.items.find((i) => i.action.data === "a=forget&id=m2");
  post([pb(btn.action.data)]);
  assert.ok(lastReply().text.startsWith("ลืมแล้วครับ"));
  assert.deepStrictEqual(mem().map((m) => m.id), ["m1", "m3"]);
  post([pb("a=forget&id=m2")]);
  assert.ok(lastReply().text.includes("ไม่พบ"));
  assert.strictEqual(aiLog.length, n);
  aiScript = once([{ name: "forget", args: { id: "m3" } }], "ลืมแล้วครับ");
  post([msg("ลืมเบอร์ซัพไปเลย")]);
  assert.deepStrictEqual(mem().map((m) => m.id), ["m1"]);
  canonical();
});

test("ความจำ: เต็มแล้วไม่จำเพิ่ม", () => {
  const was = ctx.CONFIG.MEMORY_MAX_ITEMS; ctx.CONFIG.MEMORY_MAX_ITEMS = 1;
  aiScript = once([{ name: "remember", args: { text: "เรื่องใหม่" } }]);
  post([msg("จำอันนี้ด้วย")]);
  const out = JSON.parse(aiLog[aiLog.length - 1].input.filter((x) => x.type === "function_call_output")[0].output);
  assert.strictEqual(out.ok, false); assert.ok(out.error.includes("เต็ม"));
  assert.strictEqual(mem().length, 1);
  ctx.CONFIG.MEMORY_MAX_ITEMS = was;
});

test("ความจำ: Jack ถาม 'ให้ Jack จำไว้ไหมครับ' → มีปุ่ม จำไว้เลย/ไม่ต้องจำ · 'ไม่ต้องจำ' ไม่เรียก AI", () => {
  aiScript = () => ({ text: "เข้าใจเลยครับ ให้ Jack จำไว้ไหมครับ: โอมอยากเก็บเงินดาวน์รถ" });
  post([msg("ปีหน้าอยากดาวน์รถ")]);
  const labels = lastReply().quickReply.items.map((i) => i.action.label);
  assert.deepStrictEqual(labels, ["จำไว้เลย", "ไม่ต้องจำ"]);
  const n = aiLog.length;
  post([msg("ไม่ต้องจำ")]);
  assert.strictEqual(aiLog.length, n);
  assert.strictEqual(mem().length, 1);
});

test("ความจำ: rules ใน prompt ห้ามจำเองโดยไม่ถาม", () => {
  const ins = aiLog[aiLog.length - 1].instructions;
  assert.ok(ins.includes("ห้ามจำเองโดยไม่ถาม") && ins.includes("ห้ามจำรหัสผ่าน"));
  assert.ok(aiLog[aiLog.length - 1].tools.some((t) => t.name === "remember") && aiLog[aiLog.length - 1].tools.some((t) => t.name === "forget"));
});

// =================== ขั้นที่ 7: ทักก่อน ===================
test("setupSchedules → ทริกเกอร์ 07:00 + 20:00 เขต Asia/Bangkok · รันซ้ำไม่ซ้อน · removeSchedules ลบหมด", () => {
  ctx.setupSchedules(); ctx.setupSchedules();
  const sp = triggers.map((t) => t.spec).sort((a, b) => a.hour - b.hour);
  assert.deepStrictEqual(sp, [{ fn: "morningPush", hour: 7, minute: 0, everyDays: 1, tz: "Asia/Bangkok" }, { fn: "eveningJournalPush", hour: 20, minute: 0, everyDays: 1, tz: "Asia/Bangkok" },
    { fn: "weeklyReflectionPush", weekDay: "SUNDAY", hour: 21, minute: 30, tz: "Asia/Bangkok" }]);   // ขั้นที่ 6: สะท้อนสัปดาห์
  triggers.push({ spec: { fn: "other" }, getHandlerFunction: () => "other" });
  ctx.removeSchedules();
  assert.deepStrictEqual(triggers.map((t) => t.getHandlerFunction()), ["other"]);
  triggers.length = 0;
  ctx.setupSchedules();
  assert.strictEqual(triggers.length, 3);
});

test("สรุปเช้า (AI): ส่ง push หาโอม + ข้อมูลที่ส่งให้ AI ครบ/ถูก + ความจำ + ปุ่มลัด + วันเดียวส่งครั้งเดียว", () => {
  aiScript = (body) => ({ text: "งานเลยกำหนดทำก่อนเลยนะครับ (AI)" });
  const n = aiLog.length, p0 = pushCount();
  assert.strictEqual(ctx.morningPush(), "sent");
  assert.strictEqual(aiLog.length - n, 1);
  const b = aiLog[aiLog.length - 1];
  assert.strictEqual(b.model, "gpt-6-luna"); assert.ok(!b.tools);
  assert.ok(b.instructions.includes("โอมไม่กินเผ็ด"));
  const f = JSON.parse(b.input[0].content);
  assert.ok(f.tasksOverdue.some((x) => x.startsWith("งานเลยกำหนด")));
  assert.ok(f.recurringToday.includes("อ่านหนังสือ") || f.recurringToday.length === 0);
  assert.deepStrictEqual(f.eventsToday, ["14:00 นัดลูกค้า"]);
  assert.ok(!("month" in f) && !("yesterdaySpent" in f), "ขั้นที่ 1: ข้อมูลที่ส่งให้ AI ตอนเช้าไม่มีเรื่องเงิน");
  assert.ok(b.instructions.includes("ห้ามพูดถึงเรื่องเงิน"));
  const p = lastPush();
  assert.strictEqual(pushCount() - p0, 1);
  assert.strictEqual(p.to, "U_OHM");
  const mt = p.messages[0].text;
  assert.ok(mt.startsWith("☀️ อรุณสวัสดิ์ครับโอม ·") && mt.includes("\n\n📋 งานวันนี้") && !mt.includes("💰") && !mt.includes("งบ"), mt);
  assert.ok(mt.endsWith("\n\n💬 งานเลยกำหนดทำก่อนเลยนะครับ (AI)"), mt);
  assert.deepStrictEqual(p.messages[0].quickReply.items.map((i) => i.action.data), ["a=menu&m=tasks"]);
  assert.strictEqual(ctx.morningPush(), "already");
  assert.strictEqual(pushCount() - p0, 1);
  const hist = JSON.parse(cacheMap.hist);
  assert.ok(hist[hist.length - 1].u.includes("Jack ทักเอง") && hist[hist.length - 1].a.includes("(AI)"));
  assert.ok(!b.instructions.includes("ยาวไม่เกิน 10 บรรทัด") && b.instructions.includes("คำพูดเพื่อนปิดท้าย"));
});

test("สรุปเช้า: เพดานเต็ม → แม่แบบไม่ใช้ AI · ไม่มีเรื่องเงินเลย ไม่มี NaN", () => {
  const key = Object.keys(propsMap).find((k) => k.startsWith("usage_"));
  const u = JSON.parse(propsMap[key]); const was = u.usd; u.usd = 5; propsMap[key] = JSON.stringify(u);
  try {
    const n = aiLog.length;
    assert.strictEqual(ctx.testMorningPush(), "sent");
    assert.strictEqual(aiLog.length, n);
    const t = lastPush().messages[0].text;
    if (process.env.SHOW) console.log(t + "\n---");
    assert.ok(t.includes("อรุณสวัสดิ์") && t.includes("งานเลยกำหนด") && t.includes("14:00 นัดลูกค้า"), t);
    assert.ok(!/NaN|undefined|null/.test(t), t);
    const noTargets = t.replace(/💤 โปรเจกต์ไม่ขยับ[\s\S]*?(\n\n|$)/, "");   // ชื่อโปรเจกต์อาจมีคำว่า "บาท" (เช่น เก็บเงิน 1,000,000 บาท) ไม่ใช่รายงานเงิน
    assert.ok(!/💰|บาท|งบ|รายจ่าย|รายรับ|ใช้ไป/.test(noTargets), "ขั้นที่ 1: สรุปเช้าไม่มีเรื่องเงิน\n" + t);
  } finally { u.usd = was; propsMap[key] = JSON.stringify(u); }
});

test("สรุปเช้า: OpenAI ล่ม → ยังส่งแม่แบบ · ปิด MORNING_USE_AI → ไม่เรียก AI", () => {
  aiFail = { code: 500, msg: "down" };
  assert.strictEqual(ctx.testMorningPush(), "sent");
  aiFail = null;
  assert.ok(lastPush().messages[0].text.includes("อรุณสวัสดิ์ครับโอม ·"));
  ctx.CONFIG.MORNING_USE_AI = false;
  const n = aiLog.length;
  ctx.testMorningPush();
  assert.strictEqual(aiLog.length, n);
  ctx.CONFIG.MORNING_USE_AI = true;
});

test("สรุปเช้า: แม้เมื่อวานมีรายจ่าย ก็ไม่อ่าน/ไม่พูดถึงเงิน (ข้อ 56 ข้อ 1)", () => {
  const c = { today: MONTH + "-01", time: "07:00", hour: 7, weekday: 1, records: [] };
  const y = ctx.addDays_(c.today, -1);
  const yDoc = "fg.expenses." + y.slice(0, 7);
  const arr = JSON.parse(store[yDoc] ? store[yDoc].json : "[]");
  arr.push({ id: "y1", date: y, amount: -123, category: "อาหาร", memo: "เมื่อวาน", source: "kbank-csv" });
  store[yDoc] = { json: JSON.stringify(arr), by: "app", updateTime: ts() };
  const f = ctx.morningFacts_(c);
  assert.ok(!("yesterdaySpent" in f) && !("month" in f));
  const t = ctx.morningTemplate_(f);
  assert.ok(!/123|💰|บาท|งบ/.test(t.replace(/💤 โปรเจกต์ไม่ขยับ[\s\S]*?(\n\n|$)/, "")), t);
});

function clearTodayJournal() {
  const id = "g.journal." + TODAY.slice(0, 4);
  if (store[id]) store[id] = { json: JSON.stringify(JSON.parse(store[id].json).filter((j) => j.date !== TODAY)), by: "app", updateTime: ts() };
  delete propsMap.PUSHED_journal;
}
function setTodayJournal(o) {
  clearTodayJournal();
  const id = "g.journal." + TODAY.slice(0, 4);
  const arr = JSON.parse(store[id] ? store[id].json : "[]");
  arr.push(Object.assign({ id: "jt", date: TODAY }, o));
  store[id] = { json: JSON.stringify(arr), by: "app", updateTime: ts() };
  delete propsMap.PUSHED_journal;
}
const todayJournal = () => (app().journal || []).find((j) => j.date === TODAY);

test("20:00 วางแผนพรุ่งนี้: ยังไม่เขียน Journal → สรุปวันนี้ + ถามต้องทำ/อยากทำ + 5 ปุ่มอารมณ์ + ชวน Journal + ปุ่มข้าม · ไม่ใช้ AI", () => {
  aiScript = once([{ name: "add_expense", args: { amount: 80, category: "อาหาร", memo: "ข้าวเย็น journal" } }]);
  post([msg("ข้าวเย็น 80")]);      // ข้อมูลตั้งต้น: มีรายจ่ายวันนี้ → ข้อความ 20:00 ต้องไม่พูดถึง
  clearTodayJournal();
  const n = aiLog.length;
  assert.strictEqual(ctx.eveningJournalPush(), "sent");
  assert.strictEqual(aiLog.length, n);
  const m = lastPush().messages[0];
  if (process.env.SHOW) console.log(m.text + "\n---");
  assert.ok(m.text.startsWith("🌙 สรุปวันนี้ ·") && !/💸|ใช้ไป|บาท/.test(m.text), "ขั้นที่ 1: 20:00 ไม่มีเรื่องเงิน\n" + m.text);
  assert.ok(m.text.includes("📌 พรุ่งนี้") && m.text.includes("1) พรุ่งนี้ต้องทำอะไรบ้าง?") && m.text.includes("2) อยากทำอะไรบ้าง?"), m.text);
  assert.ok(m.text.includes("😌 วันนี้รู้สึกยังไงครับ?") && m.text.includes("📝 ถ้าอยากเขียน Journal (ไม่บังคับ)"), m.text);
  assert.ok(!/NaN|undefined|null/.test(m.text), m.text);
  const q = m.quickReply.items.map((i) => i.action).filter((a) => !/^a=done&src=eve/.test(a.data || ""));   // ขั้นที่ 3: ปุ่ม ✓ งานประจำอยู่หลังปุ่มอารมณ์ (เทสต์แยกด้านล่าง)
  assert.deepStrictEqual(q.slice(0, 5).map((a) => a.data), [1, 2, 3, 4, 5].map((v) => "a=mood&v=" + v + "&d=" + TODAY));
  assert.deepStrictEqual(q.slice(0, 5).map((a) => a.label), ["😩 แย่มาก", "😕 ไม่ค่อยดี", "😐 กลางๆ", "🙂 ดี", "🤩 ดีมาก"]);
  assert.strictEqual(q[5].inputOption, "openKeyboard"); assert.strictEqual(q[5].fillInText, "journal วันนี้ ");
  assert.strictEqual(q[6].data, "a=skipj");
  assert.ok(JSON.parse(cacheMap.plan).target === ctx.addDays_(TODAY, 1));
  post([pb("a=skipj")]);
  assert.ok(lastReply().text.includes("พรุ่งนี้"));
  assert.strictEqual(aiLog.length, n);
  assert.strictEqual(ctx.eveningJournalPush(), "already");
});

test("20:00: วันนี้เขียน Journal แล้ว → ยังทัก (วางแผน+อารมณ์) แต่ตัดส่วนชวนเขียนออก + ไม่มีปุ่มเขียน Journal · entry ว่างยังชวน", () => {
  setTodayJournal({ entry: "  " });
  assert.strictEqual(ctx.eveningJournalPush(), "sent");
  let m = lastPush().messages[0];
  assert.ok(m.text.includes("📝 ถ้าอยากเขียน Journal") && m.quickReply.items.some((i) => i.action.fillInText === "journal วันนี้ "));
  setTodayJournal({ entry: "วันนี้ขายดี" });
  const p0 = pushCount();
  assert.strictEqual(ctx.eveningJournalPush(), "sent");
  assert.strictEqual(pushCount() - p0, 1);
  m = lastPush().messages[0];
  assert.ok(m.text.includes("1) พรุ่งนี้ต้องทำอะไรบ้าง?") && !m.text.includes("Journal") && !m.text.includes("📝"), m.text);
  const q = m.quickReply.items.map((i) => i.action).filter((a) => !/^a=done&src=eve/.test(a.data || ""));
  assert.strictEqual(q.length, 6);
  assert.ok(!q.some((a) => a.fillInText) && q[5].data === "a=skipj");
  assert.strictEqual(ctx.eveningJournalPush(), "already");
});

test("ปุ่มอารมณ์: เก็บ mood ลง Journal วันนั้น (สร้าง entry ว่างถ้ายังไม่มี) · กดซ้ำ = เปลี่ยนค่า · ไม่ใช้ AI · ไม่นับเป็นเขียน Journal", () => {
  clearTodayJournal();
  const n = aiLog.length;
  post([pb("a=mood&v=4&d=" + TODAY)]);
  assert.ok(lastReply().text.includes("บันทึกอารมณ์วันนี้แล้ว: 🙂 ดี"), lastReply().text);
  assert.ok(lastReply().quickReply.items.some((i) => i.action.fillInText === "journal วันนี้ "));
  let j = todayJournal();
  assert.strictEqual(j.mood, 4); assert.strictEqual(j.entry, "");
  assert.strictEqual(app().journal.filter((x) => x.date === TODAY).length, 1);
  post([pb("a=mood&v=2&d=" + TODAY)]);
  assert.ok(lastReply().text.includes("เปลี่ยนอารมณ์เป็น 😕 ไม่ค่อยดี"), lastReply().text);
  assert.strictEqual(todayJournal().mood, 2);
  assert.strictEqual(aiLog.length, n);
  delete propsMap.PUSHED_journal;
  assert.strictEqual(ctx.eveningJournalPush(), "sent");
  assert.ok(lastPush().messages[0].text.includes("📝 ถ้าอยากเขียน Journal"));       // entry ว่าง + มี mood = ยังชวน
  aiScript = once([{ name: "add_journal", args: { text: "วันนี้เหนื่อยหน่อย" } }]);
  post([msg("journal วันนี้เหนื่อยหน่อย")]);
  j = todayJournal();
  assert.strictEqual(j.entry, "วันนี้เหนื่อยหน่อย"); assert.strictEqual(j.mood, 2);   // เขียนต่อ mood ไม่หาย
  post([pb("a=mood&v=5&d=" + TODAY)]);
  assert.strictEqual(todayJournal().entry, "วันนี้เหนื่อยหน่อย"); assert.strictEqual(todayJournal().mood, 5);
  assert.ok(!((lastReply().quickReply || { items: [] }).items.some((i) => i.action.fillInText)));   // เขียนแล้ว ไม่ชวนซ้ำ (ปุ่มน้ำขั้นที่ 7A ยังอยู่ได้)
  post([pb("a=mood&v=9&d=" + TODAY)]);
  assert.ok(lastReply().text.includes("ไม่ได้"));
  post([pb("a=mood&v=3&d=2020-01-05")]);                                            // ปุ่มเก่า ลงวันที่ในปุ่ม
  assert.strictEqual((app().journal || []).find((x) => x.date === "2020-01-05").mood, 3);
  assert.strictEqual(app().journal.filter((x) => x.date === TODAY).length, 1);
});

test("โหมดวางแผนพรุ่งนี้: หลัง 20:00 ทัก → prompt บอก AI แยกต้องทำ/อยากทำ dueDate พรุ่งนี้ · งานได้ kind+plannedOn · สรุปเช้าโชว์แผนเมื่อคืน", () => {
  delete propsMap.PUSHED_journal;
  assert.strictEqual(ctx.eveningJournalPush(), "sent");
  const tomorrow = ctx.addDays_(TODAY, 1);
  aiScript = once([
    { name: "add_task", args: { title: "ส่งของลูกค้า", dueDate: tomorrow, kind: "must" } },
    { name: "add_task", args: { title: "ไปยิม", dueDate: tomorrow, kind: "want" } },
    { name: "add_task", args: { title: "งานไม่มีวัน", dueDate: TODAY, kind: "must" } }
  ]);
  post([msg("พรุ่งนี้ต้องส่งของลูกค้า ถ้ามีเวลาอยากไปยิม")]);
  const ins = aiLog[aiLog.length - 1].instructions;
  assert.ok(ins.includes("Jack เพิ่งทักตอน 20:00") && ins.includes("dueDate=" + tomorrow), ins.slice(-700));
  assert.ok(aiLog[aiLog.length - 1].tools.find((t) => t.name === "add_task").parameters.properties.kind);
  const t1 = app().tasks.find((t) => t.title === "ส่งของลูกค้า"), t2 = app().tasks.find((t) => t.title === "ไปยิม"), t3 = app().tasks.find((t) => t.title === "งานไม่มีวัน");
  assert.deepStrictEqual([t1.kind, t1.note, t1.dueDate, t1.plannedOn], ["must", "ต้องทำ", tomorrow, TODAY]);
  assert.deepStrictEqual([t2.kind, t2.note, t2.dueDate, t2.plannedOn], ["want", "อยากทำ", tomorrow, TODAY]);
  assert.strictEqual(t3.plannedOn, undefined);                                        // ไม่ใช่งานพรุ่งนี้ → ไม่นับเป็นแผนเมื่อคืน
  // จำลองเช้าวันถัดไป: สรุปเช้าดูแผนเมื่อวาน
  const c = { today: tomorrow, time: "07:00", hour: 7, weekday: (ctx.newCtx_().weekday + 1) % 7, records: [] };
  const f = ctx.morningFacts_(c);
  assert.strictEqual(JSON.stringify(f.plannedLastNight), JSON.stringify({ must: ["ส่งของลูกค้า"], want: ["ไปยิม"] }));
  assert.ok(!f.tasksToday.some((x) => x.startsWith("ส่งของลูกค้า") || x.startsWith("ไปยิม")));
  const t = ctx.morningTemplate_(f);
  assert.ok(t.includes("🎯 แผนที่โอมวางไว้เมื่อคืน\n• ต้องทำ: ส่งของลูกค้า\n• อยากทำ: ไปยิม\n\n📋 งานวันนี้"), t);
  // ไม่มีโหมดวางแผน (cache หมด) → งานทั่วไปไม่ติด plannedOn/kind
  delete cacheMap.plan;
  aiScript = once([{ name: "add_task", args: { title: "งานทั่วไป", dueDate: tomorrow } }]);
  post([msg("เพิ่มงาน งานทั่วไป พรุ่งนี้")]);
  const t4 = app().tasks.find((t) => t.title === "งานทั่วไป");
  assert.strictEqual(t4.plannedOn, undefined); assert.strictEqual(t4.kind, undefined);
  assert.ok(!aiLog[aiLog.length - 1].instructions.includes("Jack เพิ่งทักตอน 20:00"));
});

test("ทักก่อน: ยังไม่ผูก LINE → ไม่ส่ง · LINE push พัง → เก็บ LAST_ERROR ไม่ throw", () => {
  const owner = propsMap.OWNER_LINE_USER_ID;
  delete propsMap.OWNER_LINE_USER_ID;
  assert.strictEqual(ctx.testMorningPush(), "no-owner");
  propsMap.OWNER_LINE_USER_ID = owner;
  pushFail = 429;
  assert.strictEqual(ctx.testMorningPush(), "error");
  pushFail = null;
  assert.ok(propsMap.LAST_ERROR.includes("LINE push 429"));
});

test("สถานะ jack แสดงความจำ/ตั้งเวลา/จำนวน push", () => {
  post([msg("สถานะ jack")]);
  const t = lastReply().text;
  assert.ok(t.includes("ความจำระยะยาว: 1/60") && t.includes("สรุปเช้า 07:00") && t.includes("วางแผนพรุ่งนี้ 20:00") && /ส่งไป \d+ ครั้ง/.test(t), t);
});

// =================== ข้อ 55 ขั้นที่ 8: ไฟล์แนบ ===================
const img = (id, set) => ({ type: "message", webhookEventId: "ev" + evn++, replyToken: "rt" + evn, source: { type: "user", userId: "U_OHM" }, message: Object.assign({ type: "image", id, contentProvider: { type: "line" } }, set ? { imageSet: set } : {}) });
const fmsg = (id, fileName, fileSize) => ({ type: "message", webhookEventId: "ev" + evn++, replyToken: "rt" + evn, source: { type: "user", userId: "U_OHM" }, message: { type: "file", id, fileName, fileSize } });
const files = () => Object.values(fstore).map((x) => JSON.parse(x.json));
const fileById = (id) => { const f = fstore[id]; return f && JSON.parse(f.json); };
const ageRecent = () => { const r = JSON.parse(cacheMap.recent || "[]"); r.forEach((x) => { x.at = Date.now() - 30 * 60000; }); cacheMap.recent = JSON.stringify(r); };
const replies = () => lineLog.filter((x) => x.path === "/v2/bot/message/reply").length;
const qdata = (label) => { const it = lastReply().quickReply.items.find((i) => i.action.label.includes(label)); return it && it.action.data; };
const newestExp = (memo) => month(MONTH).find((x) => x.memo === memo);

test("ไฟล์: จดรายจ่ายแล้วส่งรูปภายใน 10 นาที → Drive files-line + ผูกอัตโนมัติ + รูปย่อ · ไม่เรียก AI", () => {
  aiScript = once([{ name: "add_expense", args: { amount: 850, category: "อื่นๆ", memo: "ค่าซ่อมแอร์" } }]);
  post([msg("ค่าซ่อมแอร์ 850")]);
  const exp = newestExp("ค่าซ่อมแอร์");
  const ai0 = aiLog.length;
  post([img("m1")]);
  assert.strictEqual(aiLog.length, ai0, "รูปไม่ต้องใช้ AI");
  const fl = files();
  assert.strictEqual(fl.length, 1, JSON.stringify(fl.map((x) => [x.name, x.link])) + " " + JSON.stringify(Object.values(drive.files).map((x) => x.name)));
  const f = fl[0];
  assert.deepStrictEqual(f.link, { kind: "expense", id: exp.id });
  assert.strictEqual(f.from, "line");
  assert.ok(/^f[a-z0-9]+$/.test(f.id) && /^LINE_\d{4}-\d{2}-\d{2}_\d{6}\.jpg$/.test(f.name), f.name);
  assert.ok(/^data:image\/jpeg;base64,/.test(f.thumb) && f.thumb.length < 16000);
  const df = drive.files[f.driveId];
  assert.ok(df && drive.folders[df.parent].name === "files-line" && drive.folders[df.parent].parent === ROOT.id, "ต้องอยู่ใน SecretaryOhmApp/files-line (ใช้โฟลเดอร์หลักเดิม)");
  assert.strictEqual(f.url, "https://drive.google.com/file/d/" + f.driveId + "/view");
  assert.strictEqual(f.size, 250000);
  assert.ok(lastReply().text.includes("แนบรูปกับ") && lastReply().text.includes("850"), lastReply().text);
  assert.deepStrictEqual(lastReply().quickReply.items.map((i) => i.action.label), ["เปลี่ยนรายการ", "📄 เก็บเป็นเอกสาร", "🗑️ ลบ"]);
  assert.ok(contentLog.some((u) => u.endsWith("/m1/content")) && contentLog.some((u) => u.endsWith("/m1/content/preview")));
  canonical();
});

test("ไฟล์: ปุ่มเปลี่ยนรายการ → เลือกรายการอื่น → ผูกใหม่ (label ≤20)", () => {
  const f = files()[0];
  post([pb(qdata("เปลี่ยนรายการ"))]);
  const items = lastReply().quickReply.items;
  assert.ok(items.every((i) => i.action.label.length <= 20));
  const picks = items.filter((i) => i.action.label.startsWith("📎"));
  assert.ok(picks.length >= 2, "ต้องมีตัวเลือกรายการ");
  const other = picks.find((i) => !i.action.data.endsWith("#" + f.link.id));
  const ref = new URLSearchParams(other.action.data).get("ref");
  post([pb(other.action.data)]);
  assert.strictEqual(fileById(f.id).link.id, ref.split("#")[1]);
  assert.ok(lastReply().text.startsWith("📎 แนบกับ"), lastReply().text);
});

test("ไฟล์: ส่งรูปก่อน → รอผูก → พิมพ์รายการภายใน 10 นาที → แนบให้เอง", () => {
  ageRecent();
  post([img("m2")]);
  const f = files().find((x) => x.name && !x.link);
  assert.ok(f, "ยังไม่ผูก");
  assert.ok(lastReply().text.includes("เก็บรูปไว้ใน Drive") && lastReply().quickReply.items.some((i) => i.action.label === "เก็บไว้ก่อน"));
  assert.strictEqual(JSON.parse(cacheMap.pendingFiles).length, 1);
  aiScript = once([{ name: "add_expense", args: { amount: 320, category: "อาหาร", memo: "หมูกระทะ" } }], "จดแล้วครับ");
  post([msg("หมูกระทะ 320")]);
  assert.deepStrictEqual(fileById(f.id).link, { kind: "expense", id: newestExp("หมูกระทะ").id });
  assert.ok(lastReply().text.includes("📎 แนบรูปที่ส่งมาเมื่อกี้"), lastReply().text);
  assert.ok(!cacheMap.pendingFiles);
});

test("ไฟล์: รูปรอเกิน 10 นาที → ไม่แนบกับรายการถัดไป", () => {
  ageRecent();
  post([img("m3")]);
  const f = files().find((x) => !x.link);
  cacheMap.pendingFiles = JSON.stringify([{ id: f.id, at: Date.now() - 11 * 60000 }]);
  aiScript = once([{ name: "add_expense", args: { amount: 40, category: "ขนม", memo: "โดนัท" } }], "จดแล้วครับ");
  post([msg("โดนัท 40")]);
  assert.strictEqual(fileById(f.id).link, null);
  assert.ok(!lastReply().text.includes("📎"));
  post([pb("a=ftrash&f=" + f.id)]);
});

test("ไฟล์: ส่ง 3 รูปชุดเดียว (imageSet) → ตอบครั้งเดียว · ปุ่มเก็บไว้ก่อน → ไฟล์รอจัด", () => {
  ageRecent();
  const r0 = replies();
  post([img("s1", { id: "SET1", index: 1, total: 3 })]);
  post([img("s2", { id: "SET1", index: 2, total: 3 })]);
  assert.strictEqual(replies(), r0, "ยังไม่ครบชุด ยังไม่ตอบ");
  post([img("s3", { id: "SET1", index: 3, total: 3 })]);
  assert.strictEqual(replies(), r0 + 1);
  assert.ok(lastReply().text.includes("3 รูป"));
  const ids = new URLSearchParams(qdata("เก็บไว้ก่อน")).get("f").split(",");
  assert.strictEqual(ids.length, 3);
  assert.strictEqual(JSON.parse(cacheMap.pendingFiles).length, 3);
  post([pb(qdata("เก็บไว้ก่อน"))]);
  assert.ok(ids.every((id) => fileById(id).link === null));
  assert.ok(!cacheMap.pendingFiles);
  assert.ok(lastReply().text.includes("ไฟล์รอจัด"));
});

test("ไฟล์: เก็บเป็นเอกสาร → สร้างใน documents + ผูกทั้ง 3 รูป (รูปแบบมาตรฐานของแอป)", () => {
  const f3 = files().filter((x) => x.link === null && /_\d\.jpg$/.test(x.name)).map((x) => x.id);
  assert.strictEqual(f3.length, 3);
  post([pb("a=fdoc&f=" + f3.join(","))]);
  const doc = (app().documents || []).find((d) => d.description === "ส่งมาจาก LINE");
  assert.ok(doc && doc.title.startsWith("เอกสารจาก LINE ") && doc.category === "อื่นๆ", JSON.stringify(doc));
  assert.ok(f3.every((id) => fileById(id).link.kind === "document" && fileById(id).link.id === doc.id));
  assert.ok(lastReply().text.includes("เก็บเป็นเอกสาร"));
  canonical();
});

test("ไฟล์: PDF → เก็บชื่อเดิม ไม่มีรูปย่อ · เก็บเป็นเอกสารใช้ชื่อไฟล์", () => {
  ageRecent();
  post([fmsg("pdf1", "ใบกำกับภาษี.pdf", 50000)]);
  const f = files().find((x) => x.name === "ใบกำกับภาษี.pdf");
  assert.ok(f && f.mime === "application/pdf" && f.thumb === null && f.link === null);
  assert.ok(lastReply().text.includes("ไฟล์ ใบกำกับภาษี.pdf"));
  post([pb(qdata("เก็บเป็นเอกสาร"))]);
  assert.ok((app().documents || []).some((d) => d.title === "ใบกำกับภาษี"));
});

test("ไฟล์: ชนิดอื่น/ใหญ่เกิน → ปฏิเสธ ไม่อัป", () => {
  const n = Object.keys(drive.files).length;
  post([fmsg("x1", "งบ.xlsx", 1000)]);
  assert.ok(lastReply().text.includes("แค่รูปกับ PDF"));
  post([fmsg("pdf2", "ใหญ่.pdf", 30 * 1024 * 1024)]);
  assert.ok(lastReply().text.includes("ใหญ่เกิน 20MB"));
  assert.strictEqual(Object.keys(drive.files).length, n);
});

test("ไฟล์: ปุ่มลบ → ถังขยะ Drive + ลบเอกสาร Firestore", () => {
  ageRecent();
  post([img("m4")]);
  const f = files().find((x) => !x.link);
  post([pb(qdata("ลบ"))]);
  assert.ok(!fstore[f.id]);
  assert.strictEqual(drive.files[f.driveId].trashed, true);
  assert.ok(lastReply().text.includes("ถังขยะ Drive"));
  post([pb("a=ftrash&f=" + f.id)]);
  assert.ok(lastReply().text.includes("ไม่เจอไฟล์นี้"));
});

test("ไฟล์: ยกเลิกรายจ่ายที่มีรูปแนบ → รูปไม่หาย กลับไปรอผูก", () => {
  aiScript = once([{ name: "add_expense", args: { amount: 2000, category: "อื่นๆ", memo: "ผิดยอด" } }]);
  post([msg("ผิดยอด 2000")]);
  const tok = new URLSearchParams(lastReply().quickReply.items[1].action.data).get("r");
  post([img("m5")]);
  const f = files().find((x) => x.link && x.link.id === newestExp("ผิดยอด").id);
  assert.ok(f);
  post([pb("a=undo&r=" + tok)]);
  assert.strictEqual(fileById(f.id).link, null);
  assert.ok(JSON.parse(cacheMap.pendingFiles).some((p) => p.id === f.id));
  assert.ok(lastReply().text.includes("รูปที่แนบไว้ยังอยู่"), lastReply().text);
  aiScript = once([{ name: "add_expense", args: { amount: 200, category: "อื่นๆ", memo: "ยอดถูก" } }], "จดแล้วครับ");
  post([msg("ยอดถูก 200")]);
  assert.strictEqual(fileById(f.id).link.id, newestExp("ยอดถูก").id);
});

test("ไฟล์: ส่งรูปหลังยกเลิกรายการ → ไม่แนบกับรายการที่ยกเลิกไปแล้ว (ไปรอผูกแทน)", () => {
  ageRecent();
  aiScript = once([{ name: "add_expense", args: { amount: 77, category: "อื่นๆ", memo: "จะยกเลิก" } }]);
  post([msg("จะยกเลิก 77")]);
  const tok = new URLSearchParams(lastReply().quickReply.items[1].action.data).get("r");
  post([pb("a=undo&r=" + tok)]);
  post([img("m6")]);
  const f = files().find((x) => !x.link);
  assert.ok(f, "ต้องไม่ผูกกับรายการที่ยกเลิก");
  assert.ok(lastReply().text.includes("เก็บรูปไว้ใน Drive"), lastReply().text);
  assert.ok(!lastReply().quickReply.items.some((i) => i.action.label.includes("จะยกเลิก")), "ตัวเลือกต้องไม่มีรายการที่ยกเลิกแล้ว");
  post([pb("a=ftrash&f=" + f.id)]);
});

test("ขั้นที่ 1: สั่งลบรายการเงินผ่าน delete_entry → ถูกปฏิเสธ · รายการกับไฟล์ที่แนบยังอยู่", () => {
  aiScript = once([{ name: "add_expense", args: { amount: 555, category: "อื่นๆ", memo: "ลบทั้งรูป" } }]);
  post([msg("ลบทั้งรูป 555")]);
  post([img("m7")]);
  const e = newestExp("ลบทั้งรูป");
  const f = files().find((x) => x.link && x.link.id === e.id);
  aiScript = once([{ name: "delete_entry", args: { ref: "fg.expenses." + MONTH + "#" + e.id } }], "ลบไม่ได้ครับ");
  post([msg("ลบรายการลบทั้งรูปทิ้ง")]);
  assert.ok(newestExp("ลบทั้งรูป"), "รายการเงินต้องไม่ถูกลบโดย Jack");
  assert.ok(fstore[f.id] && !drive.files[f.driveId].trashed);
  canonical();
});

test("ไฟล์: preview ของ LINE ใหญ่เกิน → ใช้รูปย่อ 160px จาก Drive", () => {
  ageRecent();
  previewBytes = 20000;
  post([img("m8")]);
  previewBytes = 3000;
  const f = files().find((x) => !x.link);
  assert.ok(/^data:image\/png;base64,/.test(f.thumb), String(f.thumb).slice(0, 40));
  post([pb("a=fkeep&f=" + f.id)]);
});

test("ไฟล์: แอปแก้เอกสารไฟล์แทรกระหว่างผูก → อ่านใหม่แล้วผูกสำเร็จ", () => {
  const f = files().find((x) => !x.link);
  const c0 = conflictsSeen;
  injectConflict = () => { fstore[f.id].updateTime = ts(); };
  post([pb("a=flink&f=" + f.id + "&ref=fg.expenses." + MONTH + "#e_cur1")]);
  assert.ok(conflictsSeen > c0);
  assert.deepStrictEqual(fileById(f.id).link, { kind: "expense", id: "e_cur1" });
});

test("ไฟล์: รอบ 07:00 เก็บกวาดไฟล์ที่แอปกดลบ (trash:true) → ถังขยะ Drive + ลบเอกสาร", () => {
  const f = files().find((x) => x.link && x.link.id === "e_cur1");
  const m = Object.assign({}, f, { trash: true, trashedAt: new Date().toISOString() });
  fstore[f.id] = { json: JSON.stringify(m), by: "app", updateTime: ts() };
  propsMap.PUSHED_morning = TODAY;   // วันนี้ส่งสรุปไปแล้ว — เก็บกวาดก็ยังต้องทำ
  assert.strictEqual(ctx.morningPush(), "already");
  assert.ok(!fstore[f.id] && drive.files[f.driveId].trashed);
});

test("ไฟล์: setupFiles ใช้โฟลเดอร์เดิม ไม่สร้างซ้ำ", () => {
  const n = Object.values(drive.folders).filter((x) => x.name === "files-line").length;
  delete propsMap.DRIVE_FILES_FOLDER_ID;
  ctx.setupFiles();
  assert.strictEqual(Object.values(drive.folders).filter((x) => x.name === "files-line").length, n);
  assert.strictEqual(n, 1);
});


// =================== ข้อ 55 ขั้นที่ 9: อ่านสลิป/ใบเสร็จ (OCR) ===================
// ข้อ 56: โอมปิด OCR ใน Config จริง (OCR_ENABLED:false) — โค้ดส่วนนี้ยังเหลืออยู่จึงเปิดเฉพาะในเทสต์กลุ่มนี้ เพื่อกันโค้ดเน่า (ปิดคืนท้ายไฟล์)
vm.runInContext("CONFIG.OCR_ENABLED = true", ctx);
const slip = (o) => Object.assign({ kind: "expense", amount: null, currency: "THB", date: TODAY, memo: null, category: "อื่นๆ", confidence: "high" }, o);
const anyExp = (memo) => app().finance.expenses.find((x) => x.memo === memo);
const usageUsd = () => JSON.parse(propsMap["usage_" + MONTH]).usd;

test("OCR: ส่งสลิปโอน → จดรายจ่าย (ติดลบ) + แนบรูป + ปุ่ม แก้/ยกเลิก · ส่งรูปเข้า vision จริง · นับค่า AI", () => {
  ageRecent();
  ocrScript = () => slip({ amount: 1250.5, memo: "ค่าโทรศัพท์", category: "อื่นๆ" });
  const n0 = ocrLog.length, ai0 = aiLog.length, usd0 = usageUsd(), f0 = files().length;
  post([img("o1")]);
  assert.strictEqual(ocrLog.length, n0 + 1);
  assert.strictEqual(aiLog.length, ai0, "ไม่ผ่านแชท/เครื่องมือ");
  const b = ocrLog[ocrLog.length - 1];
  assert.strictEqual(b.model, "gpt-6-luna");
  const c = b.input[0].content;
  const im = c.find((x) => x.type === "input_image");
  assert.ok(/^data:image\/jpeg;base64,/.test(im.image_url) && im.detail === "high");
  assert.ok(b.instructions.includes("อาหาร") && b.instructions.includes("พ.ศ."), "ส่งรายการหมวด + วิธีแปลง พ.ศ.");
  const e = newestExp("ค่าโทรศัพท์");
  assert.ok(e && e.amount === -1250.5 && e.via === "line" && e.source === "manual" && e.date === TODAY, JSON.stringify(e));
  assert.strictEqual(files().length, f0 + 1);
  const f = files().pop();
  assert.deepStrictEqual(f.link, { kind: "expense", id: e.id });
  assert.ok(lastReply().text.includes("อ่านสลิปแล้ว") && lastReply().text.includes("1,250.5") && lastReply().text.includes("แนบรูปไว้แล้ว"), lastReply().text);
  assert.ok(!lastReply().text.includes("ไม่ค่อยมั่นใจ"));
  assert.deepStrictEqual(lastReply().quickReply.items.map((i) => i.action.label).slice(0, 2), ["แก้", "ยกเลิก"]);
  assert.ok(usageUsd() > usd0, "ต้องนับค่า AI ของ vision");
  assert.ok(app().activity[0].text.includes("LINE"));
  canonical();
});

test("OCR: ยกเลิกรายการที่อ่านจากสลิป → รายการหาย · รูปไม่หาย กลับไปรอผูก", () => {
  const e = newestExp("ค่าโทรศัพท์");
  const tok = new URLSearchParams(lastReply().quickReply.items[1].action.data).get("r");
  const f = files().find((x) => x.link && x.link.id === e.id);
  post([pb("a=undo&r=" + tok)]);
  assert.ok(!newestExp("ค่าโทรศัพท์"));
  assert.strictEqual(fileById(f.id).link, null);
  assert.ok(pendingHas(f.id));
  canonical();
});
function pendingHas(id) { return (JSON.parse(cacheMap.pendingFiles || "[]")).some((p) => p.id === id); }

test("OCR: สลิปยอดตรงกับรายการที่เพิ่งพิมพ์จดไว้ → แนบกับรายการนั้น ไม่จดซ้ำ", () => {
  aiScript = once([{ name: "add_expense", args: { amount: 320, category: "อาหาร", memo: "ชาบู" } }]);
  post([msg("ชาบู 320")]);
  const nExp = month(MONTH).length;
  ocrScript = () => slip({ amount: 320, memo: "ร้านชาบู", category: "อาหาร" });
  post([img("o2")]);
  assert.strictEqual(month(MONTH).length, nExp, "ต้องไม่จดซ้ำ");
  const f = files().pop();
  assert.deepStrictEqual(f.link, { kind: "expense", id: newestExp("ชาบู").id });
  assert.ok(lastReply().text.includes("แนบรูปกับ") && lastReply().text.includes("ไม่จดซ้ำ"), lastReply().text);
});

test("OCR: สลิปยอดไม่ตรงกับรายการล่าสุด → จดเป็นรายการใหม่ (ไม่แนบผิดรายการ)", () => {
  ocrScript = () => slip({ amount: 75, memo: "ชานมไข่มุก", category: "ชา กาแฟ" });
  const nExp = month(MONTH).length;
  post([img("o3")]);
  assert.strictEqual(month(MONTH).length, nExp + 1);
  const e = newestExp("ชานมไข่มุก");
  assert.strictEqual(e.category, "ชา กาแฟ");
  assert.deepStrictEqual(files().pop().link, { kind: "expense", id: e.id });
  canonical();
});

test("OCR: ปี พ.ศ. หลุดมา → แปลงเป็น ค.ศ. · วันที่อนาคต/อ่านไม่ได้ → ใช้วันนี้ + บอกโอม · หมวดที่ไม่มีในระบบ → อื่นๆ", () => {
  ageRecent();
  ocrScript = () => slip({ amount: 41, date: PREV + "-10", memo: "ทดสอบวัน1", category: "หมวดที่ไม่มี" });
  post([img("o4")]);
  let e = anyExp("ทดสอบวัน1");
  assert.strictEqual(e.date, PREV + "-10");
  assert.strictEqual(e.category, "อื่นๆ");
  ageRecent();
  ocrScript = () => slip({ amount: 42, date: (Number(PREV.slice(0, 4)) + 543) + PREV.slice(4) + "-11", memo: "ทดสอบวัน2" });
  post([img("o5")]);
  assert.strictEqual(anyExp("ทดสอบวัน2").date, PREV + "-11", "พ.ศ. ต้องถูกลบ 543");
  ageRecent();
  ocrScript = () => slip({ amount: 43, date: "2099-01-01", memo: "ทดสอบวัน3" });
  post([img("o6")]);
  assert.strictEqual(newestExp("ทดสอบวัน3").date, TODAY);
  assert.ok(lastReply().text.includes("อ่านวันที่ไม่ได้"), lastReply().text);
  ageRecent();
  ocrScript = () => slip({ amount: 44, date: null, memo: "ทดสอบวัน4" });
  post([img("o7")]);
  assert.strictEqual(newestExp("ทดสอบวัน4").date, TODAY);
  canonical();
});

test("OCR: confidence ต่ำ / ยอดใหญ่ → จดแต่ขอให้เช็กซ้ำ · มีงบใกล้เต็ม → เตือนงบ", () => {
  ageRecent();
  ocrScript = () => slip({ amount: 60000, memo: "ค่าเครื่อง", confidence: "high" });
  post([img("o8")]);
  assert.ok(newestExp("ค่าเครื่อง") && lastReply().text.includes("เช็กยอด/หมวดอีกทีนะครับ"), lastReply().text);
  ageRecent();
  ocrScript = () => slip({ amount: 90, memo: "เบลอๆ", confidence: "low" });
  post([img("o9")]);
  assert.ok(lastReply().text.includes("เช็กยอด/หมวดอีกทีนะครับ"));
  ageRecent();
  ocrScript = () => slip({ amount: 500, memo: "มื้อใหญ่", category: "อาหาร" });   // งบอาหาร 5000 ใช้ไปเกิน 80% แล้ว
  post([img("o10")]);
  assert.ok(lastReply().text.includes("⚠️ งบ อาหาร"), lastReply().text);
});

test("OCR: สลิปรับเงิน → รายรับ (บวก)", () => {
  ageRecent();
  ocrScript = () => slip({ kind: "income", amount: 2000, memo: "ลูกค้าโอนมัดจำ", category: "อื่นๆ" });
  post([img("o11")]);
  const i = app().finance.income.find((x) => x.note === "ลูกค้าโอนมัดจำ");
  assert.ok(i && i.amount === 2000 && i.via === "line" && i.month === MONTH, JSON.stringify(i));
  assert.deepStrictEqual(files().pop().link, { kind: "income", id: i.id });
  assert.ok(lastReply().text.includes("รายรับ"));
  canonical();
});

test("OCR: กบข. จากสลิป → เงินออม (ไม่ใช่รายจ่าย) · รูปเก็บรอผูก", () => {
  ageRecent();
  const nExp = app().finance.expenses.length, nInv = app().finance.investments.length;
  ocrScript = () => slip({ amount: 1500, memo: "สะสม กบข." });
  post([img("o12")]);
  assert.strictEqual(app().finance.expenses.length, nExp);
  assert.strictEqual(app().finance.investments.length, nInv + 1);
  assert.strictEqual(files().pop().link, null);
  canonical();
});

test("OCR: รูปที่ไม่ใช่สลิป / อ่านยอดไม่ได้ / JSON เพี้ยน → เก็บรูปเฉยๆ ไม่จดอะไร (เหมือนขั้นที่ 8)", () => {
  ageRecent();
  const nExp = month(MONTH).length;
  ocrScript = () => slip({ kind: "other" });
  post([img("o13")]);
  assert.ok(lastReply().text.includes("เก็บรูปไว้ใน Drive") && !lastReply().text.includes("อ่านยอด"), lastReply().text);
  ocrScript = () => slip({ amount: null });
  post([img("o14")]);
  assert.ok(lastReply().text.includes("อ่านยอดจากรูปนี้ไม่ได้"), lastReply().text);
  ocrScript = () => "garbage";
  post([img("o15")]);
  assert.ok(lastReply().text.includes("เก็บรูปไว้ใน Drive"));
  assert.strictEqual(month(MONTH).length, nExp);
  assert.strictEqual(files().filter((f) => !f.link).length >= 3, true);
});

test("OCR: สกุลเงินอื่น → ไม่จดอัตโนมัติ บอกโอม", () => {
  ageRecent();
  const nExp = month(MONTH).length;
  ocrScript = () => slip({ amount: 12.5, currency: "USD", memo: "OpenAI" });
  post([img("o16")]);
  assert.strictEqual(month(MONTH).length, nExp);
  assert.ok(lastReply().text.includes("USD"), lastReply().text);
});

test("OCR: OpenAI ล่ม → ไม่เสียรูป เก็บรูปเฉยๆ (ไม่พังทั้งข้อความ)", () => {
  ageRecent();
  const f0 = files().length;
  aiFail = { code: 500, msg: "boom" };
  post([img("o17")]);
  aiFail = null;
  assert.strictEqual(files().length, f0 + 1);
  assert.ok(lastReply().text.includes("เก็บรูปไว้ใน Drive"), lastReply().text);
});

test("OCR: เพดานค่า AI เต็ม → ไม่เรียก vision เก็บรูปเฉยๆ + บอกเหตุผล", () => {
  ageRecent();
  const saved = propsMap["usage_" + MONTH];
  propsMap["usage_" + MONTH] = JSON.stringify({ usd: CONFIG_CAP(), calls: 1, messages: 1, byModel: {} });
  const n0 = ocrLog.length;
  ocrScript = () => slip({ amount: 10, memo: "ไม่ควรถูกเรียก" });
  post([img("o18")]);
  assert.strictEqual(ocrLog.length, n0);
  assert.ok(lastReply().text.includes("เพดานค่า AI"), lastReply().text);
  assert.ok(!newestExp("ไม่ควรถูกเรียก"));
  propsMap["usage_" + MONTH] = saved;
});
function CONFIG_CAP() { return vm.runInContext("CONFIG.MONTHLY_CAP_USD", ctx); }

test("OCR: ปิดด้วย OCR_ENABLED=false → ไม่เรียก vision", () => {
  ageRecent();
  vm.runInContext("CONFIG.OCR_ENABLED = false", ctx);
  const n0 = ocrLog.length;
  ocrScript = () => slip({ amount: 10, memo: "ห้ามอ่าน" });
  post([img("o19")]);
  vm.runInContext("CONFIG.OCR_ENABLED = true", ctx);
  assert.strictEqual(ocrLog.length, n0);
  assert.ok(!newestExp("ห้ามอ่าน"));
});

test("OCR: PDF ยังไม่อ่าน (เก็บเฉยๆ) · ไม่เรียก vision", () => {
  ageRecent();
  const n0 = ocrLog.length;
  post([fmsg("pdf9", "ใบเสร็จ.pdf", 40000)]);
  assert.strictEqual(ocrLog.length, n0);
  assert.ok(files().some((f) => f.name === "ใบเสร็จ.pdf"));
});

test("OCR: ส่ง 3 สลิปพร้อมกัน (imageSet) → จดทีละใบ ตอบครั้งเดียว มีปุ่มยกเลิกทีละรายการ", () => {
  ageRecent();
  const r0 = replies(), nExp = month(MONTH).length;
  const amts = [111, 222, 333];
  let k = 0;
  ocrScript = () => slip({ amount: amts[k], memo: "ชุด" + amts[k++] });
  post([img("q1", { id: "SET9", index: 1, total: 3 })]);
  post([img("q2", { id: "SET9", index: 2, total: 3 })]);
  assert.strictEqual(replies(), r0, "ยังไม่ครบชุด");
  post([img("q3", { id: "SET9", index: 3, total: 3 })]);
  assert.strictEqual(replies(), r0 + 1);
  assert.strictEqual(month(MONTH).length, nExp + 3);
  const t = lastReply().text;
  assert.ok(t.includes("3 รูป") && t.includes("111") && t.includes("222") && t.includes("333"), t);
  const undo = lastReply().quickReply.items.filter((i) => i.action.label.startsWith("ยกเลิก"));
  assert.strictEqual(undo.length, 3);
  ["ชุด111", "ชุด222", "ชุด333"].forEach((m) => assert.ok(newestExp(m)));
  const ids = files().slice(-3);
  assert.ok(ids.every((f) => f.link && f.link.kind === "expense"));
  assert.ok(lastReply().quickReply.items.length <= 13);
  canonical();
});

test("OCR: บันทึกรูปลง Drive พังหลังจดรายการ → ถอยรายการกลับ ไม่เหลือรายการลอย", () => {
  ageRecent();
  const nExp = month(MONTH).length;
  const orig = ctx.DriveApp.getFoldersByName;
  ctx.DriveApp.getFoldersByName = () => { throw new Error("Drive ล่ม"); };
  delete propsMap.DRIVE_FILES_FOLDER_ID;
  ocrScript = () => slip({ amount: 999, memo: "ควรถูกถอย" });
  post([img("o20")]);
  ctx.DriveApp.getFoldersByName = orig;
  assert.strictEqual(month(MONTH).length, nExp);
  assert.ok(!newestExp("ควรถูกถอย"));
  assert.ok(lastReply().text.includes("สะดุด"), lastReply().text);
  ctx.setupFiles();
});

test("OCR: ค่า AI ของ vision เข้าเพดานรายเดือน · สถานะ jack ยังทำงาน", () => {
  post([msg("สถานะ jack")]);
  assert.ok(lastReply().text.includes("ค่า AI เดือนนี้"));
});


vm.runInContext("CONFIG.OCR_ENABLED = false", ctx);   // กลับเป็นค่าจริงใน Config.gs (โอมปิดไว้)

// =================== ข้อ 56 ขั้นที่ 1: Jack × การเงิน (อ่านอย่างเดียว) ===================
test("ขั้นที่ 1: AI มองไม่เห็นเครื่องมือจด/แก้เงิน · เรียกตรงๆ ก็ไม่รู้จัก · prompt บอกกติกาอ่านอย่างเดียว + dataAsOf", () => {
  aiScript = () => ({ text: "โอเคครับ" });
  post([msg("ทดสอบรายการเครื่องมือ")]);
  const b = aiLog[aiLog.length - 1];
  const names = b.tools.map((t) => t.name);
  assert.ok(!names.includes("add_expense") && !names.includes("add_income"), names.join(","));
  ["get_summary", "search_expenses", "add_task", "complete_task", "add_journal", "add_note", "update_entry", "delete_entry", "remember", "forget"].forEach((n) => assert.ok(names.includes(n), n));
  const upd = b.tools.find((t) => t.name === "update_entry").parameters.properties;
  assert.ok(!upd.amount && !upd.category && !upd.memo && !upd.source, "update_entry ไม่มีช่องของเงินแล้ว");
  assert.ok(b.instructions.includes("อ่านอย่างเดียว") && b.instructions.includes("import CSV KBank") && b.instructions.includes("ข้อมูลถึงวันที่") && b.instructions.includes("dataAsOf"));
  assert.ok(!b.instructions.includes("หมวดรายจ่ายที่มีอยู่") && !b.instructions.includes("ใช้ add_expense"));
  const r = withRealTools(() => ctx.runTool_("add_expense", { amount: 1, category: "อาหาร", memo: "x" }, ctx.newCtx_()));
  assert.strictEqual(r.ok, false);
  const r2 = withRealTools(() => ctx.runTool_("add_income", { amount: 1, source: "อื่นๆ" }, ctx.newCtx_()));
  assert.strictEqual(r2.ok, false);
});

test("ขั้นที่ 1: get_summary — dataAsOf = วันที่รายการล่าสุดที่ import (ไม่นับที่ Jack เคยจดเอง via:line) · เทียบเดือนก่อน · อัตราออม", () => {
  const d = app();
  const inMonths = (x) => [MONTH, PREV].includes(String(x.date).slice(0, 7));
  const dates = [].concat(d.finance.expenses.filter(inMonths), d.finance.income.filter(inMonths), d.finance.investments)
    .filter((x) => x.via !== "line" && x.date <= TODAY).map((x) => x.date).sort();
  const expected = dates[dates.length - 1];
  assert.ok(expected, "ข้อมูลตั้งต้นต้องมีรายการที่ import");
  const lineToday = d.finance.expenses.filter((x) => x.via === "line" && x.date === TODAY).length;
  assert.ok(lineToday > 0 && expected !== TODAY || lineToday === 0 || expected === TODAY, "มีรายการ via:line วันนี้ในข้อมูลเทสต์");
  let out = null;
  aiScript = (b, outs) => outs.length ? (out = outs[0], { text: "สรุปครับ" }) : { calls: [{ name: "get_summary", args: {} }] };
  post([msg("เดือนนี้ใช้ไปเท่าไหร่")]);
  assert.strictEqual(out.dataAsOf, expected);
  assert.ok(out.dataAsOfNote.includes("ไม่ใช่ถึงวันนี้"));
  const spend = (m) => d.finance.expenses.filter((e) => String(e.date).slice(0, 7) === m).reduce((a, e) => a - e.amount, 0);
  const r2 = (n) => Math.round(n * 100) / 100;
  assert.strictEqual(out.prevMonth.month, PREV);
  assert.strictEqual(out.prevMonth.expenses, r2(spend(PREV)));
  assert.strictEqual(out.prevMonth.expensesChangePct, spend(PREV) > 0 ? Math.round((spend(MONTH) - spend(PREV)) / spend(PREV) * 100) : null);
  const food = out.expenses.byCategory.find((c) => c.category === "อาหาร");
  const foodPrev = d.finance.expenses.filter((e) => String(e.date).slice(0, 7) === PREV && e.category === "อาหาร").reduce((a, e) => a - e.amount, 0);
  assert.strictEqual(food.prevMonthSpent, r2(foodPrev));
  assert.strictEqual(food.changeVsPrevPct, foodPrev > 0 ? Math.round((food.spent - foodPrev) / foodPrev * 100) : null);
  const inc = d.finance.income.filter((i) => (i.month || String(i.date).slice(0, 7)) === MONTH).reduce((a, i) => a + i.amount, 0);
  const saved = d.finance.investments.filter((v) => String(v.date).slice(0, 7) === MONTH).reduce((a, v) => a + v.amount, 0);
  const exp = spend(MONTH);
  const rate = inc > 0 ? Math.round((saved + Math.max(0, inc - exp - saved)) / inc * 1000) / 10 : null;
  assert.strictEqual(out.savingRatePct, rate);
  assert.ok(typeof out.debtCount === "number");
});

test("ขั้นที่ 1: dataAsOf ไม่ขยับเพราะรายการ via:line · ข้อมูลว่าง = null · ไม่นับวันอนาคต", () => {
  const f = ctx.financeDataAsOf_;
  assert.strictEqual(f([[{ date: "2026-09-10", via: "line" }, { date: "2026-09-05" }]], "2026-09-30"), "2026-09-05");
  assert.strictEqual(f([[{ date: "2026-09-10", via: "line" }]], "2026-09-30"), null);
  assert.strictEqual(f([[], null, [{ date: "bad" }, {}]], "2026-09-30"), null);
  assert.strictEqual(f([[{ date: "2026-10-05" }, { date: "2026-09-20" }]], "2026-09-30"), "2026-09-20");
  assert.strictEqual(ctx.addMonths_("2026-01", -1), "2025-12");
  assert.strictEqual(ctx.addMonths_("2026-03", -1), "2026-02");
});

test("ขั้นที่ 1: ปุ่มเมนู 'ยอดเดือนนี้' (ไม่ใช้ AI) บอก 'ข้อมูลถึงวันที่' · ตัดคำนวณงบเฉลี่ย/วันออก (ตัวเลขไม่สดพอ)", () => {
  const n = aiLog.length;
  post([pb("a=menu&m=month")]);
  const t = lastReply().text;
  assert.strictEqual(aiLog.length, n);
  assert.ok(/📅 ข้อมูลถึงวันที่ /.test(t) && !t.includes("งบที่เหลือเฉลี่ยวันละ"), t);
});

test("ขั้นที่ 1: หมดเพดาน/AI ล่ม → โหมดสำรองไม่จดเงิน · บอกให้ใช้ปุ่มเมนู", () => {
  const t = ctx.fallbackHandle_("ข้าว 60", ctx.newCtx_(), "AI ใช้ไม่ได้");
  assert.ok(t.includes("งานวันนี้") && t.includes("ยอดเดือนนี้") && !t.includes("จดแบบง่าย"), t);
});

test("ขั้นที่ 1: ปุ่ม แก้ ของรายการเงินเก่า → prompt ไม่สั่งให้ AI แก้เงิน (ไม่มี recent เงิน/โหมดแก้เงิน)", () => {
  aiScript = once([{ name: "add_expense", args: { amount: 25, category: "ขนม", memo: "ขนมทดสอบขั้น1" } }]);
  post([msg("ขนม 25")]);
  post([pb("a=edit&r=" + new URLSearchParams(lastReply().quickReply.items[0].action.data).get("r"))]);
  aiScript = () => ({ text: "ครับ" });
  post([msg("120")]);
  const ins = aiLog[aiLog.length - 1].instructions;
  assert.ok(!ins.includes("ขนมทดสอบขั้น1") && !ins.includes("กดปุ่ม \"แก้\""), ins.slice(-500));
});


// =================== ข้อ 56 ขั้นที่ 3: Target + วันนี้ + หลุดจังหวะ ===================
const setTasks = (arr) => { store["k.tasks"] = { json: JSON.stringify(arr), by: "app", updateTime: ts() }; };
const setProjects = (arr) => { store["k.projects"] = { json: JSON.stringify(arr), by: "app", updateTime: ts() }; };
const dAgo = (n) => ctx.addDays_(TODAY, -n);
test("ขั้นที่ 3: taskRhythm_ — นับรอบที่พลาดติดกัน (ไม่นับรอบนี้) · createdAt · ไม่เคยทำ+ไม่มี createdAt = ไม่เตือน", () => {
  const R = (t, d) => ctx.taskRhythm_(Object.assign({ id: "x", recurrence: "daily", completions: {} }, t), d || TODAY);
  const c = (...ds) => Object.fromEntries(ds.map((d) => [d, true]));
  assert.strictEqual(R({ completions: c(dAgo(1)) }).missed, 0);
  assert.strictEqual(R({ completions: c(dAgo(1)) }).off, false);
  assert.strictEqual(R({ completions: c(dAgo(2)) }).missed, 1);
  assert.strictEqual(R({ completions: c(dAgo(2)) }).off, false);            // พลาดเมื่อวานวันเดียว ยังไม่เตือน
  const r3 = R({ completions: c(dAgo(3), TODAY) });
  assert.deepStrictEqual([r3.missed, r3.off, r3.unit], [2, true, "วัน"]);     // ติ๊กวันนี้ไม่ลบความจริงว่าพลาด 2 วันก่อนหน้า
  assert.strictEqual(R({}).unknown, true); assert.strictEqual(R({}).off, false);
  assert.strictEqual(R({ createdAt: TODAY }).missed, 0);                     // เพิ่งสร้างวันนี้
  assert.strictEqual(R({ createdAt: dAgo(1) }).missed, 1);
  assert.strictEqual(R({ createdAt: dAgo(5) }).missed, 5);
  assert.strictEqual(R({ createdAt: dAgo(5) }).off, true);
  // ทุกสัปดาห์: สัปดาห์ก่อนไม่ได้ทำ = หลุด · ทุกเดือน: เดือนก่อนไม่ได้ทำ = หลุด
  const wk = ctx.mondayOf_(TODAY), lastWk = ctx.addDays_(wk, -7), wk2 = ctx.addDays_(wk, -14);
  assert.strictEqual(ctx.taskRhythm_({ recurrence: "weekly", completions: c(lastWk) }, TODAY).off, false);
  const rw = ctx.taskRhythm_({ recurrence: "weekly", completions: c(wk2) }, TODAY);
  assert.deepStrictEqual([rw.missed, rw.off, rw.unit, rw.score], [1, true, "สัปดาห์", 7]);
  const pm = ctx.addMonths_(MONTH, -1), pm2 = ctx.addMonths_(MONTH, -2);
  assert.strictEqual(ctx.taskRhythm_({ recurrence: "monthly", completions: c(pm) }, TODAY).off, false);
  assert.strictEqual(ctx.taskRhythm_({ recurrence: "monthly", completions: c(pm2) }, TODAY).missed, 1);
  assert.strictEqual(ctx.taskRhythm_({ recurrence: "none" }, TODAY), null);
  // ข้ามปี / ต้นเดือน
  assert.strictEqual(ctx.prevPeriodDate_("monthly", "2026-01-15"), "2025-12-01");
  assert.strictEqual(ctx.prevPeriodDate_("daily", "2026-03-01"), "2026-02-28");
  assert.strictEqual(ctx.prevPeriodDate_("weekly", "2026-09-30"), "2026-09-21");
});

test("ขั้นที่ 3: offRhythm_ — จัดกลุ่มตาม target · เรียงหลุดนานสุด · ข้าม archived/paused · งานไม่มีโปรเจกต์เป็น target เอง", () => {
  const c = (...ds) => Object.fromEntries(ds.map((d) => [d, true]));
  const tasks = [
    { id: "a1", projectId: "pH", title: "วิ่ง", recurrence: "daily", completions: c(dAgo(4)) },          // พลาด 3 วัน
    { id: "a2", projectId: "pH", title: "ยืดเหยียด", recurrence: "daily", completions: c(dAgo(10)) },   // พลาด 9 วัน → ตัวแทน target
    { id: "a3", projectId: "pE", title: "ฟังพอดแคสต์", recurrence: "weekly", completions: c(ctx.addDays_(ctx.mondayOf_(TODAY), -21)) }, // 2 สัปดาห์ = 14
    { id: "a4", projectId: "pP", title: "งานของโปรเจกต์ที่พัก", recurrence: "daily", completions: c(dAgo(30)) },
    { id: "a5", projectId: null, title: "นั่งสมาธิ", recurrence: "daily", createdAt: dAgo(3), completions: {} },  // 3
    { id: "a6", projectId: "pH", title: "งานปกติ", recurrence: "none", status: "pending", dueDate: dAgo(5) }
  ];
  const projects = [{ id: "pH", title: "สุขภาพดี", status: "active" }, { id: "pE", title: "อังกฤษ", status: "active" }, { id: "pP", title: "พักไว้", status: "paused" }];
  const out = ctx.offRhythm_(tasks, projects, TODAY);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(out.map((x) => [x.target, x.routine, x.why]))), [["อังกฤษ", "ฟังพอดแคสต์", "ไม่ได้ทำมา 2 สัปดาห์"], ["สุขภาพดี", "ยืดเหยียด", "ไม่ได้ทำมา 9 วัน"], ["นั่งสมาธิ", null, "ไม่ได้ทำมา 3 วัน"]]);
  assert.strictEqual(out[1].ref, "k.tasks#a2");
});

test("ขั้นที่ 3: สรุปเช้าเตือนหลุดจังหวะ 1–2 อัน · list_tasks คืน offRhythm · ปุ่มงานวันนี้บอกด้วย · งานใหม่จาก LINE มี createdAt", () => {
  const c = (...ds) => Object.fromEntries(ds.map((d) => [d, true]));
  setProjects([{ id: "pH", title: "สุขภาพดี", status: "active" }, { id: "pE", title: "อังกฤษ", status: "active" }, { id: "pX", title: "โปรเจกต์ที่สาม", status: "active" }]);
  setTasks([
    { id: "r1", projectId: "pH", title: "วิ่ง", status: "pending", recurrence: "daily", weight: 1, completions: c(dAgo(6)) },
    { id: "r2", projectId: "pE", title: "ท่องศัพท์", status: "pending", recurrence: "daily", weight: 1, completions: c(dAgo(3)) },
    { id: "r3", projectId: "pX", title: "งานสาม", status: "pending", recurrence: "daily", weight: 1, completions: c(dAgo(2)) },   // พลาด 1 วัน
    { id: "r4", projectId: "pX", title: "ตรงจังหวะ", status: "pending", recurrence: "daily", weight: 1, completions: c(dAgo(1)) }
  ]);
  const f = ctx.morningFacts_(ctx.newCtx_());
  assert.deepStrictEqual(JSON.parse(JSON.stringify(f.offRhythm)), ["สุขภาพดี · วิ่ง — ไม่ได้ทำมา 5 วัน", "อังกฤษ · ท่องศัพท์ — ไม่ได้ทำมา 2 วัน"]);
  const t = ctx.morningTemplate_(f);
  assert.ok(t.includes("\n\n⏸️ หลุดจังหวะ\n• สุขภาพดี · วิ่ง — ไม่ได้ทำมา 5 วัน\n• อังกฤษ · ท่องศัพท์ — ไม่ได้ทำมา 2 วัน"), t);
  assert.ok(!t.includes("งานสาม —"), "เตือนแค่ 2 อัน");
  aiScript = () => ({ text: "กลับมาวิ่งหน่อยนะครับ" });
  assert.strictEqual(ctx.testMorningPush(), "sent");
  const b = aiLog[aiLog.length - 1];
  assert.ok(JSON.parse(b.input[0].content).offRhythm.length === 2 && b.instructions.includes("หลุดจังหวะ"));
  const lt = ctx.toolListTasks_({ scope: "today" }, ctx.newCtx_());
  assert.strictEqual(lt.offRhythm.length, 2);                                     // งานสาม พลาดแค่เมื่อวาน = ยังไม่หลุด
  post([pb("a=menu&m=tasks")]);
  assert.ok(lastReply().text.includes("⏸️ หลุดจังหวะ\n• สุขภาพดี · วิ่ง — ไม่ได้ทำมา 5 วัน"), lastReply().text);
  aiScript = once([{ name: "add_task", args: { title: "ออกกำลังกาย", recurrence: "daily" } }]);
  post([msg("เพิ่มงานประจำ ออกกำลังกาย ทุกวัน")]);
  const nt = app().tasks.find((x) => x.title === "ออกกำลังกาย");
  assert.strictEqual(nt.createdAt, TODAY);
  canonical();
});

test("ขั้นที่ 3: 20:00 มีรายการ + ปุ่ม ✓ งานประจำที่ยังไม่ติ๊ก (สูงสุด 6) · กดแล้วติ๊กได้ + ขึ้นปุ่มอันที่เหลือ · ครบแล้วบอก", () => {
  setProjects([{ id: "pH", title: "สุขภาพดี", status: "active" }, { id: "pP", title: "พักไว้", status: "paused" }]);
  const arr = [];
  for (let i = 1; i <= 8; i++) arr.push({ id: "e" + i, projectId: "pH", title: "ประจำ" + i, status: "pending", recurrence: "daily", weight: 1, completions: {} });
  arr.push({ id: "eP", projectId: "pP", title: "ของโปรเจกต์ที่พัก", status: "pending", recurrence: "daily", weight: 1, completions: {} });
  arr.push({ id: "eD", projectId: "pH", title: "ทำแล้ว", status: "pending", recurrence: "daily", weight: 1, completions: { [TODAY]: true } });
  setTasks(arr);
  clearTodayJournal();
  assert.strictEqual(ctx.eveningJournalPush(), "sent");
  const m = lastPush().messages[0];
  assert.ok(m.text.includes("🔁 งานประจำที่ยังไม่ติ๊ก (8)") && m.text.includes("• ประจำ1") && m.text.includes("…อีก 2 อย่าง") && !m.text.includes("ของโปรเจกต์ที่พัก") && !m.text.includes("• ทำแล้ว"), m.text);
  const q = m.quickReply.items.map((i) => i.action);
  assert.ok(q.length <= 13);
  const ticks = q.filter((a) => /^a=done&src=eve/.test(a.data));
  assert.strictEqual(ticks.length, 6);
  assert.deepStrictEqual(q.slice(0, 5).map((a) => a.data.slice(0, 6)), Array(5).fill("a=mood"));
  assert.strictEqual(q[q.length - 1].data, "a=skipj");
  assert.ok(ticks[0].data.includes("&d=" + TODAY) && ticks[0].label.startsWith("✓ "));
  const n = aiLog.length;
  post([pb(ticks[0].data)]);
  assert.strictEqual(aiLog.length, n, "ไม่ใช้ AI");
  assert.strictEqual(app().tasks.find((x) => x.id === "e1").completions[TODAY], true);
  const r = lastReply();
  assert.ok(r.text.startsWith("เสร็จแล้ว ✓ ประจำ1"), r.text);
  const next = r.quickReply.items.map((i) => i.action).filter((a) => /^a=done&src=eve/.test(a.data));
  assert.strictEqual(next.length, 7);                                              // ปุ่มยกเลิก 1 + ที่เหลือ 7
  assert.ok(r.quickReply.items[0].action.data.startsWith("a=undo"));
  // ติ๊กที่เหลือทีละอัน → อันสุดท้ายบอกครบ
  for (let i = 2; i <= 8; i++) post([pb("a=done&src=eve&d=" + TODAY + "&ref=k.tasks#e" + i)]);
  assert.ok(lastReply().text.includes("งานประจำวันนี้ครบแล้ว"), lastReply().text);
  // ปุ่มเก่าข้ามวัน: ของเมื่อวานติ๊กได้ (ลงวันที่ในปุ่ม) · เกิน 1 วันไม่ได้
  post([pb("a=done&src=eve&d=" + dAgo(1) + "&ref=k.tasks#e1")]);
  assert.strictEqual(app().tasks.find((x) => x.id === "e1").completions[dAgo(1)], true);
  post([pb("a=done&src=eve&d=" + dAgo(2) + "&ref=k.tasks#e1")]);
  assert.ok(lastReply().text.includes("ไม่เกิน 1 วัน"), lastReply().text);
  assert.ok(!app().tasks.find((x) => x.id === "e1").completions[dAgo(2)]);
  canonical();
});


// =================== ข้อ 56 ขั้นที่ 5: แฟ้มตัวโอม + Jack อ่าน target ===================
const setDoc = (id, v) => { store[id] = { json: JSON.stringify(v), by: "app", updateTime: ts() }; };
const profNow = () => app().ohmProfile;
test("ขั้นที่ 5: แฟ้มตัวโอมเข้า prompt ทุกข้อความ (แก้ในแอป → Jack เห็นหลัง cache 5 นาทีหมด) · ว่าง = บอกว่ายังว่าง", () => {
  delete store["k.ohmProfile"]; delete cacheMap.prof;
  aiScript = () => ({ text: "ครับ" });
  post([msg("หวัดดี")]);
  assert.ok(aiLog[aiLog.length - 1].instructions.includes("แฟ้มตัวโอม: (ยังว่าง)"));
  setDoc("k.ohmProfile", { who: "เจ้าของร้านเสื้อผ้าแบรนด์เนม", goals: "• วิ่งมินิมาราธอนปีนี้\n• เก็บเงินดาวน์บ้าน", values: "ครอบครัวมาก่อน", focus: "" });
  post([msg("หวัดดีอีกที")]);
  assert.ok(aiLog[aiLog.length - 1].instructions.includes("แฟ้มตัวโอม: (ยังว่าง)"), "ยังใช้ cache เดิม");
  delete cacheMap.prof;
  post([msg("หวัดดีรอบสาม")]);
  const ins = aiLog[aiLog.length - 1].instructions;
  assert.ok(ins.includes("[เป้าหมายปีนี้]\n    • วิ่งมินิมาราธอนปีนี้\n    • เก็บเงินดาวน์บ้าน") && ins.includes("[ค่านิยม / หลักที่ยึด]\n    ครอบครัวมาก่อน") && !ins.includes("[โปรเจกต์ / เรื่องที่โฟกัส]"), ins.slice(-1500));
  assert.ok(ins.includes("propose_profile") && ins.includes("โอมต้องกดยืนยันเอง"));
});

test("ขั้นที่ 5: propose_profile → เป็นข้อเสนอรอยืนยัน (ยังไม่ลงแฟ้ม) + ปุ่ม ✅/ไม่ต้อง · กดยืนยัน = ต่อท้ายหัวข้อ · กดซ้ำ/ทิ้ง", () => {
  aiScript = once([{ name: "propose_profile", args: { section: "goals", text: "อ่านหนังสือเดือนละ 2 เล่ม" } }], "เสนอเพิ่มในแฟ้มไว้ให้แล้วครับ");
  post([msg("ปีนี้อยากอ่านหนังสือเดือนละ 2 เล่ม")]);
  let pf = profNow();
  assert.strictEqual(pf.pending.length, 1);
  assert.ok(!pf.goals.includes("อ่านหนังสือ"), "ยังไม่ลงแฟ้มจนกว่าจะกดยืนยัน");
  const q = lastReply().quickReply.items.map((i) => i.action);
  assert.ok(q[0].label.startsWith("✅ ลงแฟ้ม") && q[0].label.length <= 20 && q[1].label === "ไม่ต้อง", JSON.stringify(q));
  canonical();
  const n = aiLog.length;
  post([pb(q[0].data)]);
  assert.strictEqual(aiLog.length, n, "ไม่ใช้ AI");
  pf = profNow();
  assert.strictEqual(pf.goals, "• วิ่งมินิมาราธอนปีนี้\n• เก็บเงินดาวน์บ้าน\n• อ่านหนังสือเดือนละ 2 เล่ม");
  assert.strictEqual(pf.pending.length, 0);
  assert.ok(lastReply().text.includes("ลงแฟ้มตัวโอมแล้ว"));
  post([pb(q[0].data)]);
  assert.ok(lastReply().text.includes("จัดการไปแล้ว"));
  // ทิ้ง + หัวข้อที่ยังว่าง + ซ้ำกับที่มีในแฟ้ม
  aiScript = once([{ name: "propose_profile", args: { section: "focus", text: "ขยายร้านออนไลน์" } }, { name: "propose_profile", args: { section: "goals", text: "อ่านหนังสือเดือนละ 2 เล่ม" } }]);
  post([msg("ช่วงนี้โฟกัสขยายร้านออนไลน์")]);
  pf = profNow();
  assert.strictEqual(pf.pending.length, 1, "อันที่มีในแฟ้มแล้วไม่เสนอซ้ำ");
  post([pb("a=pf&v=0&id=" + pf.pending[0].id)]);
  assert.strictEqual(profNow().pending.length, 0); assert.strictEqual(profNow().focus, "");
  aiScript = once([{ name: "propose_profile", args: { section: "values", text: "รหัสผ่าน 1234" } }, { name: "propose_profile", args: { section: "xx", text: "a" } }]);
  post([msg("x")]);
  const outs = aiLog[aiLog.length - 1].input.filter((x) => x.type === "function_call_output").map((o) => JSON.parse(o.output));
  assert.ok(outs.every((o) => o.ok === false), JSON.stringify(outs));
  canonical();
});

test("ขั้นที่ 5: target — % ความคืบหน้า/ที่ควรถึง/สถานะ/หมุดถัดไป สูตรเดียวกับแอป · ไม่ขยับ ≥14 วัน · อยู่ใน prompt + list_targets", () => {
  const T = TODAY, d = (n) => ctx.addDays_(T, n);
  setProjects([
    { id: "pN", title: "เก็บเงินสำรอง", category: "finance", status: "active", measureType: "numeric", baselineValue: 0, targetValue: 100000, unit: "บาท", startDate: d(-50), targetDate: d(50),
      milestones: [{ id: "m1", pct: 25, reachedAt: d(-30) }, { id: "m2", pct: 50, label: "ครึ่งทาง", reachedAt: null }] },
    { id: "pT", title: "ทำเว็บร้าน", category: "career", status: "active", measureType: "tasks", startDate: d(-5), targetDate: d(25), milestones: [] },
    { id: "pM", title: "ภาษาอังกฤษ", category: "learning", status: "active", measureType: "manual", manualValue: 40, startDate: d(-100), milestones: [] },
    { id: "pP", title: "พักไว้", category: "other", status: "paused", measureType: "manual", manualValue: 10, startDate: d(-100) },
    { id: "pA", title: "เก็บถาวร", status: "archived", measureType: "manual", manualValue: 10 }]);
  setDoc("k.checkins", [{ id: "c1", projectId: "pN", date: d(-40), value: 20000 }, { id: "c2", projectId: "pN", date: d(-20), value: 30000 }]);
  setTasks([
    { id: "w1", projectId: "pT", title: "ออกแบบ", status: "done", recurrence: "none", weight: 2, completedAt: new Date(d(-1) + "T05:00:00Z").toISOString(), completions: {} },
    { id: "w2", projectId: "pT", title: "เขียนโค้ด", status: "pending", recurrence: "none", weight: 2, completions: {} }]);
  delete cacheMap.tgt;
  const out = ctx.toolListTargets_({}, ctx.newCtx_());
  const by = (t) => out.targets.find((x) => x.title === t);
  assert.ok(!by("เก็บถาวร"));
  const n = by("เก็บเงินสำรอง");
  assert.deepStrictEqual([n.progressPct, n.expectedPct, n.status, n.daysLeft, n.nextMilestone, n.lastMove, n.daysSinceMove, n.stalled], [30, 50, "ช้ากว่าแผน", 50, "ครึ่งทาง (50%)", d(-20), 20, true]);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(n.value)), { current: 30000, target: 100000, unit: "บาท" });
  const t = by("ทำเว็บร้าน");
  assert.deepStrictEqual([t.progressPct, t.expectedPct, t.status, t.openTasks, t.stalled], [50, 17, "เร็วกว่าแผน", 1, false]);
  const m = by("ภาษาอังกฤษ");
  assert.deepStrictEqual([m.progressPct, m.expectedPct, m.status, m.daysSinceMove, m.stalled], [40, null, "กำลังทำ", 100, true]);
  assert.strictEqual(by("พักไว้").stalled, false);
  aiScript = () => ({ text: "ครับ" });
  post([msg("โปรเจกต์ไปถึงไหนแล้ว")]);
  const ins = aiLog[aiLog.length - 1].instructions;
  assert.ok(ins.includes("• เก็บเงินสำรอง (การเงิน) 30% / ควรถึง 50% · ช้ากว่าแผน · เหลือ 50 วัน · ไม่ขยับ 20 วัน"), ins.slice(-1200));
  assert.ok(aiLog[aiLog.length - 1].tools.some((x) => x.name === "list_targets"));
  // morning: ไม่ขยับ 2 อัน เรียงนานสุด
  const f = ctx.morningFacts_(ctx.newCtx_());
  assert.deepStrictEqual(JSON.parse(JSON.stringify(f.stalled)), ["ภาษาอังกฤษ — ไม่ขยับ 100 วัน (40%)", "เก็บเงินสำรอง — ไม่ขยับ 20 วัน (30%)"]);
  assert.ok(ctx.morningTemplate_(f).includes("💤 โปรเจกต์ไม่ขยับ\n• ภาษาอังกฤษ"));
  // ติ๊กงานผ่าน Jack → cache สรุป target ถูกล้าง
  cacheMap.tgt = "[]";
  aiScript = once([{ name: "complete_task", args: { ref: "k.tasks#w2" } }]);
  post([msg("เขียนโค้ดเสร็จแล้ว")]);
  assert.ok(!cacheMap.tgt || cacheMap.tgt !== "[]");
});


// =================== ข้อ 56 ขั้นที่ 6: Journal หัวข้อนำ + สะท้อนสัปดาห์ ===================
const jDay = (d) => (app().journal || []).find((j) => j.date === d);
test("ขั้นที่ 6: add_journal แยกหัวข้อ (did/highlight/feel/lesson) + เก็บข้อความดิบ · ต่อท้ายรวมหัวข้อ · ยกเลิก = หัวข้อถอยกลับ · ไม่ส่งหัวข้อ = แบบเดิม", () => {
  const D = "2026-03-10";
  aiScript = once([{ name: "add_journal", args: { text: "วันนี้ไปร้านทั้งวัน ลูกค้าเยอะ เหนื่อยแต่ดีใจ ได้รู้ว่าต้องเตรียมของก่อน", did: "ไปร้านทั้งวัน", highlight: "ลูกค้าเยอะ", feel: "เหนื่อยแต่ดีใจ", lesson: "ต้องเตรียมของก่อน", date: D } }], "จดลง 4 หัวข้อแล้วครับ");
  post([msg("journal วันนี้ไปร้านทั้งวัน…")]);
  let j = jDay(D);
  assert.strictEqual(j.entry, "วันนี้ไปร้านทั้งวัน ลูกค้าเยอะ เหนื่อยแต่ดีใจ ได้รู้ว่าต้องเตรียมของก่อน");
  assert.deepStrictEqual(JSON.parse(JSON.stringify(j.parts)), { did: "ไปร้านทั้งวัน", highlight: "ลูกค้าเยอะ", feel: "เหนื่อยแต่ดีใจ", lesson: "ต้องเตรียมของก่อน" });
  aiScript = once([{ name: "add_journal", args: { text: "ตอนเย็นไปวิ่ง", did: "ไปวิ่ง", lesson: "", date: D } }]);
  post([msg("เพิ่ม journal ตอนเย็นไปวิ่ง")]);
  j = jDay(D);
  assert.strictEqual(j.parts.did, "ไปร้านทั้งวัน\nไปวิ่ง"); assert.strictEqual(j.parts.lesson, "ต้องเตรียมของก่อน");
  post([pb(lastReply().quickReply.items[1].action.data)]);                          // ยกเลิกอันที่ต่อ
  j = jDay(D);
  assert.strictEqual(j.parts.did, "ไปร้านทั้งวัน"); assert.ok(!j.entry.includes("ตอนเย็น"));
  const D2 = "2026-03-11";
  aiScript = once([{ name: "add_journal", args: { text: "บันทึกสั้นๆ", date: D2 } }]);
  post([msg("journal บันทึกสั้นๆ")]);
  assert.ok(!("parts" in jDay(D2)), "ไม่ส่งหัวข้อ = ไม่สร้าง parts (รูปเดิมใช้ต่อได้)");
  const tool = aiLog[aiLog.length - 1].tools.find((t) => t.name === "add_journal").parameters.properties;
  assert.ok(tool.did && tool.highlight && tool.feel && tool.lesson);
  assert.ok(aiLog[aiLog.length - 1].instructions.includes("ห้ามเดาอารมณ์/บทเรียนแทนโอม"));
  canonical();
});

test("ขั้นที่ 6: 20:00 ชวน Journal บอกหัวข้อนำ 4 ข้อ", () => {
  clearTodayJournal();
  assert.strictEqual(ctx.testEveningPush(), "sent");
  const t = lastPush().messages[0].text;
  assert.ok(t.includes("เล่ารวดเดียวได้เลย Jack แยกให้: 📍 วันนี้ทำอะไร · ✨ เจออะไร/เรื่องเด่น · 💭 รู้สึกยังไง · 💡 บทเรียนวันนี้"), t);
});

test("ขั้นที่ 6: สะท้อนสัปดาห์ — ข้อเท็จจริงจากโค้ด · AI ตอบ JSON → ข้อความ + เก็บ k.journalReflections + เสนอแฟ้ม (ปุ่มยืนยัน) · ไม่มี Journal = ไม่ทัก", () => {
  const mon = ctx.mondayOf_(TODAY), sun = ctx.addDays_(mon, 6), dd = (i) => ctx.addDays_(mon, i);
  const c = { today: sun, time: "21:30", hour: 21, weekday: 0, records: [] };
  const yr = mon.slice(0, 4), id = "g.journal." + yr;
  const keep = JSON.parse(store[id] ? store[id].json : "[]").filter((j) => j.date < mon || j.date > sun);
  setDoc(id, keep);
  if (sun.slice(0, 4) !== yr) setDoc("g.journal." + sun.slice(0, 4), []);
  assert.strictEqual(ctx.buildReflection_(c, false), null, "สัปดาห์ว่าง = ไม่ทัก");
  setDoc(id, keep.concat([
    { id: "w1", date: dd(0), entry: "งานเยอะ", mood: 2, parts: { feel: "เครียด" } },
    { id: "w2", date: dd(2), entry: "ขายดี", mood: 5, parts: { lesson: "โพสต์ตอนเย็นได้ผล" } },
    { id: "w3", date: dd(4), entry: "", mood: 4 }]));
  const f = ctx.reflectionFacts_(c);
  assert.deepStrictEqual([f.weekStart, f.weekEnd, f.daysWritten, f.moodDays, f.moodAvg], [mon, sun, 2, 3, 3.7]);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(f.lessons)), ["โพสต์ตอนเย็นได้ผล"]);
  assert.strictEqual(f.days[0].weekday, "วันจันทร์"); assert.strictEqual(f.days[6].weekday, "วันอาทิตย์");
  // dry = ไม่เขียนอะไร
  delete store["k.journalReflections"];
  aiScript = () => ({ text: JSON.stringify({ reflection: "ต้นสัปดาห์เครียด แต่กลางสัปดาห์ขายดีมาก", proposals: [{ section: "focus", text: "ทำคอนเทนต์โพสต์ตอนเย็น" }] }) });
  const dryMsg = ctx.buildReflection_(c, true);
  assert.ok(dryMsg.text.includes("ต้นสัปดาห์เครียด") && !store["k.journalReflections"]);
  // จริง
  delete cacheMap.prof; setDoc("k.ohmProfile", { who: "", goals: "", values: "", focus: "", pending: [] });
  const n = aiLog.length;
  const m = ctx.buildReflection_(c, false);
  assert.strictEqual(aiLog.length - n, 1);
  const b = aiLog[aiLog.length - 1];
  assert.strictEqual(b.model, "gpt-6-sol"); assert.ok(!b.tools);
  assert.strictEqual(JSON.parse(b.input[0].content).moodAvg, 3.7);
  assert.ok(m.text.startsWith("🪞 สะท้อนสัปดาห์ ·") && m.text.includes("อารมณ์ จ.–อา.: 😕 · 🤩 · 🙂 · ·") && m.text.includes("(เฉลี่ย 3.7/5) · เขียน 2 วัน") && m.text.includes("ต้นสัปดาห์เครียด"), m.text);
  assert.ok(m.text.includes("🗂️ Jack เสนอเพิ่มแฟ้มตัวโอม:\n• ทำคอนเทนต์โพสต์ตอนเย็น"));
  assert.ok(m.quickReply.items[0].action.data.startsWith("a=pf&v=1&id="));
  const refl = app().journalReflections;
  assert.strictEqual(refl.length, 1); assert.strictEqual(refl[0].week, mon); assert.strictEqual(refl[0].text, "ต้นสัปดาห์เครียด แต่กลางสัปดาห์ขายดีมาก");
  assert.strictEqual(profNow().pending.length, 1);
  // รันซ้ำสัปดาห์เดิม = แทนที่ ไม่ซ้อน · AI ตอบไม่ใช่ JSON = ใช้ข้อความดิบ
  aiScript = () => ({ text: "สรุปแบบไม่ใช่ JSON" });
  ctx.buildReflection_(c, false);
  assert.strictEqual(app().journalReflections.length, 1); assert.strictEqual(app().journalReflections[0].text, "สรุปแบบไม่ใช่ JSON");
  // เพดานเต็ม → แม่แบบไม่ใช้ AI
  const key = Object.keys(propsMap).find((k) => k.startsWith("usage_"));
  const u = JSON.parse(propsMap[key]); const was = u.usd; u.usd = 5; propsMap[key] = JSON.stringify(u);
  try {
    const n2 = aiLog.length;
    const t = ctx.buildReflection_(c, true).text;
    assert.strictEqual(aiLog.length, n2);
    assert.ok(t.includes("สัปดาห์นี้เขียน Journal 2 วัน · อารมณ์เฉลี่ย 3.7/5") && t.includes("บทเรียนที่จดไว้: โพสต์ตอนเย็นได้ผล"), t);
  } finally { u.usd = was; propsMap[key] = JSON.stringify(u); }
  canonical();
});

test("ขั้นที่ 6: ทริกเกอร์วันอาทิตย์ส่ง push ได้จริง + วันละครั้ง", () => {
  delete propsMap.PUSHED_reflection;
  aiScript = () => ({ text: JSON.stringify({ reflection: "สัปดาห์นี้ดีครับ", proposals: [] }) });
  const mon = ctx.mondayOf_(TODAY), id = "g.journal." + TODAY.slice(0, 4);
  const arr = JSON.parse(store[id] ? store[id].json : "[]"); arr.push({ id: "wx", date: TODAY, entry: "วันนี้โอเค", mood: 4 }); setDoc(id, arr);
  const p0 = pushCount();
  assert.strictEqual(ctx.weeklyReflectionPush(), "sent");
  assert.strictEqual(ctx.weeklyReflectionPush(), "already");
  assert.strictEqual(pushCount() - p0, 1);
  assert.ok(lastPush().messages[0].text.includes("สัปดาห์นี้ดีครับ"));
  assert.ok(app().journalReflections.some((r) => r.week === mon));
});


// =================== ข้อ 56 ขั้นที่ 7A: Health ===================
const hDay = (d) => (app().healthDaily || []).find((h) => h.date === d);
test("ขั้นที่ 7A: log_health — นอน/น้ำ (ตั้งยอด/บวกเพิ่ม)/ออกกำลังกาย (ต่อท้าย)/น้ำหนัก · เทียบเป้า · ล่วงหน้าไม่ได้ · ค่าเพี้ยนไม่รับ", () => {
  delete store["k.healthDaily"]; setDoc("k.healthSettings", { sleepGoalMin: 420, waterGoalL: 2 });
  aiScript = once([{ name: "log_health", args: { sleepHours: 7.5, waterL: 1.5, exerciseType: "วิ่ง", exerciseMin: 30 } }], "จดแล้วครับ");
  post([msg("เมื่อคืนนอน 7 ชั่วโมงครึ่ง ดื่มน้ำไป 1.5 ลิตร วิ่ง 30 นาที")]);
  let h = hDay(TODAY);
  assert.deepStrictEqual([h.sleepMin, h.waterL, h.exercise.length, h.exercise[0].type, h.exercise[0].min, h.exercise[0].src], [450, 1.5, 1, "วิ่ง", 30, "line"]);
  const out = JSON.parse(aiLog[aiLog.length - 1].input.find((x) => x.type === "function_call_output").output);
  assert.deepStrictEqual([out.goals.sleepHit, out.goals.waterHit], [true, false]);
  aiScript = once([{ name: "log_health", args: { waterAddL: 0.5, exerciseType: "เวทเทรนนิ่ง", exerciseMin: 45, weight: 72.4 } }]);
  post([msg("ดื่มน้ำเพิ่มอีกครึ่งลิตร เล่นเวท 45 นาที หนัก 72.4")]);
  h = hDay(TODAY);
  assert.deepStrictEqual([h.waterL, h.exercise.length, h.weight], [2, 2, 72.4]);
  const bad = ctx.toolLogHealth_({ date: ctx.addDays_(TODAY, 1), waterL: 1 }, ctx.newCtx_());
  assert.strictEqual(bad.ok, false);
  assert.strictEqual(ctx.toolLogHealth_({ sleepHours: 40 }, ctx.newCtx_()).ok, false);
  assert.ok(aiLog[aiLog.length - 1].instructions.includes("ห้ามแปลผล/วินิจฉัยทางการแพทย์"));
  canonical();
});

test("ขั้นที่ 7A: get_health สรุปย้อนหลังเทียบเป้า + สถานะทดสอบสมรรถนะ", () => {
  const d = (n) => ctx.addDays_(TODAY, n);
  setDoc("k.healthDaily", [{ id: "a", date: d(-1), sleepMin: 480, waterL: 2.5 }, { id: "b", date: d(-2), sleepMin: 300, exercise: [{ id: "x", type: "เดิน", min: 20 }] }, { id: "c", date: d(-20), sleepMin: 480 }]);
  setDoc("k.fitnessTests", [{ id: "t1", date: d(-100), values: { pushup: 20 } }]);
  const g = ctx.toolGetHealth_({ days: 7 }, ctx.newCtx_());
  assert.strictEqual(g.rows.length, 2);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(g.summary)), { sleepHitDays: 1, waterHitDays: 1, exerciseDays: 1 });
  assert.strictEqual(g.rows[0].exercise[0], "เดิน 20 นาที");
  assert.deepStrictEqual([g.fitnessTest.last, g.fitnessTest.due, g.fitnessTest.nextDue], [d(-100), true, d(-10)]);
});

test("ขั้นที่ 7A: กดอารมณ์ → ถามน้ำต่อด้วยปุ่ม 4 ระดับ · กดน้ำ = ตั้งยอดวันนั้น + บอกถึงเป้า · บันทึกน้ำแล้วไม่ถามซ้ำ · ปุ่มเก่าเกิน 1 วันไม่รับ", () => {
  setDoc("k.healthDaily", []);
  clearTodayJournal();
  post([pb("a=mood&v=4&d=" + TODAY)]);
  let r = lastReply();
  assert.ok(r.text.includes("💧 วันนี้ดื่มน้ำประมาณเท่าไหร่ครับ?"), r.text);
  const w = r.quickReply.items.filter((i) => /^a=water/.test(i.action.data));
  assert.deepStrictEqual(w.map((i) => i.action.label), ["💧 ไม่ถึง 1L", "💧 1.5L", "💧 2L", "💧 2.5L ขึ้นไป"]);
  assert.ok(r.quickReply.items.some((i) => i.action.fillInText === "journal วันนี้ "));
  const n = aiLog.length;
  post([pb(w[2].action.data)]);
  assert.strictEqual(aiLog.length, n);
  assert.strictEqual(hDay(TODAY).waterL, 2);
  assert.ok(lastReply().text.includes("บันทึกน้ำ 2 ลิตรแล้วครับ ✓ ถึงเป้า"), lastReply().text);
  post([pb("a=mood&v=5&d=" + TODAY)]);
  assert.ok(!lastReply().text.includes("ดื่มน้ำ"), "บันทึกน้ำแล้วไม่ถามซ้ำ");
  post([pb("a=water&v=2&d=" + ctx.addDays_(TODAY, -3))]);
  assert.ok(lastReply().text.includes("เก่าเกิน 1 วัน"));
  canonical();
});

test("ขั้นที่ 7A: สรุปเช้าวันเสาร์เตือนครบรอบทดสอบสมรรถนะ (วันอื่นไม่เตือน · ยังไม่ครบไม่เตือน)", () => {
  const d = (n) => ctx.addDays_(TODAY, n);
  setDoc("k.fitnessTests", [{ id: "t1", date: d(-95), values: { pushup: 20 } }]);
  const sat = { today: TODAY, time: "07:00", hour: 7, weekday: 6, records: [] };
  const f = ctx.morningFacts_(sat);
  assert.ok(/^ครบรอบทดสอบสมรรถนะแล้ว \(ล่าสุด /.test(f.fitnessDue), f.fitnessDue);
  assert.ok(ctx.morningTemplate_(f).includes("\n\n🏋️ ครบรอบทดสอบสมรรถนะแล้ว"));
  assert.strictEqual(ctx.morningFacts_({ ...sat, weekday: 3 }).fitnessDue, null);
  setDoc("k.fitnessTests", [{ id: "t1", date: d(-10), values: {} }]);
  assert.strictEqual(ctx.morningFacts_(sat).fitnessDue, null);
  setDoc("k.fitnessTests", []);
  assert.ok(/ยังไม่เคยทดสอบ/.test(ctx.morningFacts_(sat).fitnessDue));
});

console.log("\n" + passed + " passed" + (process.exitCode ? " (มีบางข้อพัง)" : ""));
