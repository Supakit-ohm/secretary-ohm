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
function openai(url, opt) {
  const body = JSON.parse(opt.payload);
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
    getProjectTriggers: () => triggers.slice(),
    deleteTrigger: (t) => { const i = triggers.indexOf(t); if (i >= 0) triggers.splice(i, 1); },
    newTrigger: (fn) => { const spec = { fn }; const b = {
      timeBased: () => b, atHour: (h) => { spec.hour = h; return b; }, nearMinute: (m) => { spec.minute = m; return b; },
      everyDays: (d) => { spec.everyDays = d; return b; }, inTimezone: (tz) => { spec.tz = tz; return b; },
      create: () => { const t = { spec, getHandlerFunction: () => fn }; triggers.push(t); return t; } }; return b; },
  },
};
vm.createContext(ctx);
for (const f of ["Config.gs", "Persona.gs", "Bot.gs", "Files.gs"]) vm.runInContext(fs.readFileSync(path.join(DIR, f), "utf8"), ctx, { filename: f });

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

test("จดรายจ่าย: ติดลบ + source manual + via line + activity + ปุ่มแก้/ยกเลิก + รูปแบบมาตรฐาน", () => {
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
  assert.ok(b.instructions.includes("อาหาร") && b.instructions.includes(TODAY) && b.instructions.includes("Jack"));
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

test("ปุ่มแก้ → ข้อความถัดไปแก้ยอด + ย้ายเดือนเมื่อเปลี่ยนวันที่", () => {
  aiScript = once([{ name: "add_expense", args: { amount: 99, category: "อาหาร", memo: "ชาบู" } }]);
  post([msg("ชาบู 99")]);
  const editTok = new URLSearchParams(lastReply().quickReply.items[0].action.data).get("r");
  post([pb("a=edit&r=" + editTok)]);
  assert.ok(lastReply().text.includes("จะแก้อะไร"));
  let seenRef = null;
  aiScript = (body, outs) => {
    if (outs.length) return { text: "แก้แล้วครับ" };
    assert.ok(body.instructions.includes("กดปุ่ม \"แก้\""), "ต้องบอก AI ว่ากำลังแก้");
    seenRef = body.instructions.match(/ref=(fg\.expenses\.[^)]+)\)/)[1];
    return { calls: [{ name: "update_entry", args: { ref: seenRef, amount: 459, date: PREV + "-28" } }] };
  };
  post([msg("459 เป็นของเดือนก่อน")]);
  assert.strictEqual(month(MONTH).filter((x) => x.memo === "ชาบู").length, 0);
  const moved = month(PREV).filter((x) => x.memo === "ชาบู");
  assert.strictEqual(moved.length, 1);
  assert.strictEqual(moved[0].amount, -459);
  assert.ok(!cacheMap.editing, "โหมดแก้ต้องหมดหลังใช้ 1 ข้อความ");
  canonical();
  // recent ถูกอัปเดตเป็น ref ใหม่
  assert.ok(JSON.parse(cacheMap.recent).some((r) => r.ref.startsWith("fg.expenses." + PREV)));
});

test("แก้รายการคืนเงิน (บวก) → คงเป็นบวก", () => {
  aiScript = once([{ name: "update_entry", args: { ref: "fg.expenses." + MONTH + "#e_ref1", amount: 150 } }]);
  post([msg("คืนเงินจริงๆ 150")]);
  assert.strictEqual(month(MONTH).find((x) => x.id === "e_ref1").amount, 150);
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

test("ค้นรายจ่าย แล้วลบตาม ref", () => {
  let found = null;
  aiScript = (b, outs) => {
    if (outs.length === 0) return { calls: [{ name: "search_expenses", args: { keyword: "ลาเต้" } }] };
    if (!found) { found = outs[0]; return { calls: [{ name: "delete_entry", args: { ref: found.items[0].ref } }] }; }
    return { text: "ลบแล้วครับ" };
  };
  // สคริปต์นี้เรียก 2 รอบ: นับ output ทั้งหมดใน input
  aiScript = ((orig) => (b) => {
    const outs = b.input.filter((x) => x.type === "function_call_output").map((o) => JSON.parse(o.output));
    if (outs.length === 0) return { calls: [{ name: "search_expenses", args: { keyword: "ลาเต้" } }] };
    if (outs.length === 1) { found = outs[0]; return { calls: [{ name: "delete_entry", args: { ref: found.items[0].ref } }] }; }
    return { text: "ลบแล้วครับ" };
  })();
  post([msg("ลบลาเต้เมื่อกี้")]);
  assert.strictEqual(found.matched, 1);
  assert.strictEqual(month(MONTH).filter((x) => x.memo === "ลาเต้").length, 0);
  assert.strictEqual(lastReply().text, "ลบแล้วครับ");
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

test("เพดานเต็ม → ไม่เรียก AI แต่ยังจด \"ข้าว 50\" ได้ · เรื่องอื่นบอกให้เปิดแอป", () => {
  const key = Object.keys(propsMap).find((k) => k.startsWith("usage_"));
  const u = JSON.parse(propsMap[key]); u.usd = 5.0; propsMap[key] = JSON.stringify(u);
  const n = aiLog.length;
  post([msg("ข้าวผัดกะเพรา 50")]);
  assert.strictEqual(aiLog.length, n);
  const e = month(MONTH).find((x) => x.memo === "ข้าวผัดกะเพรา");
  assert.strictEqual(e.amount, -50);
  assert.strictEqual(e.category, "อาหาร");
  assert.ok(lastReply().text.includes("เพดาน"));
  assert.ok(lastReply().quickReply, "โหมดสำรองก็มีปุ่มยกเลิก");
  post([msg("สรุปงานให้หน่อย")]);
  assert.ok(lastReply().text.includes("เปิดแอป"));
  assert.strictEqual(aiLog.length, n);
  u.usd = 0.5; propsMap[key] = JSON.stringify(u);
});

test("OpenAI 401 → ถอยไปโหมดสำรอง + เก็บ LAST_ERROR", () => {
  aiFail = { code: 401, msg: "Incorrect API key" };
  post([msg("ลาเต้ 55")]);
  aiFail = null;
  assert.ok(lastReply().text.includes("API key ไม่ถูกต้อง"));
  assert.ok(month(MONTH).find((x) => x.memo === "ลาเต้" && x.amount === -55));
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
  assert.deepStrictEqual(sp, [{ fn: "morningPush", hour: 7, minute: 0, everyDays: 1, tz: "Asia/Bangkok" }, { fn: "eveningJournalPush", hour: 20, minute: 0, everyDays: 1, tz: "Asia/Bangkok" }]);
  triggers.push({ spec: { fn: "other" }, getHandlerFunction: () => "other" });
  ctx.removeSchedules();
  assert.deepStrictEqual(triggers.map((t) => t.getHandlerFunction()), ["other"]);
  triggers.length = 0;
  ctx.setupSchedules();
  assert.strictEqual(triggers.length, 2);
});

test("สรุปเช้า (AI): ส่ง push หาโอม + ข้อมูลที่ส่งให้ AI ครบ/ถูก + ความจำ + ปุ่มลัด + วันเดียวส่งครั้งเดียว", () => {
  aiScript = (body) => ({ text: "☀️ อรุณสวัสดิ์ครับโอม (AI)" });
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
  const spent = month(MONTH).reduce((s, e) => s - e.amount, 0);
  assert.strictEqual(f.month.budget, 6500);
  assert.ok(Math.abs(f.month.spent - spent) < 0.01);
  assert.ok(Math.abs(f.month.budgetLeft - (6500 - spent)) < 0.01);
  const p = lastPush();
  assert.strictEqual(pushCount() - p0, 1);
  assert.strictEqual(p.to, "U_OHM");
  assert.strictEqual(p.messages[0].text, "☀️ อรุณสวัสดิ์ครับโอม (AI)");
  assert.deepStrictEqual(p.messages[0].quickReply.items.map((i) => i.action.data), ["a=menu&m=tasks", "a=menu&m=month"]);
  assert.strictEqual(ctx.morningPush(), "already");
  assert.strictEqual(pushCount() - p0, 1);
  const hist = JSON.parse(cacheMap.hist);
  assert.ok(hist[hist.length - 1].u.includes("Jack ทักเอง") && hist[hist.length - 1].a.includes("(AI)"));
});

test("สรุปเช้า: เพดานเต็ม → แม่แบบไม่ใช้ AI · ตัวเลขตรง ไม่มี NaN", () => {
  const key = Object.keys(propsMap).find((k) => k.startsWith("usage_"));
  const u = JSON.parse(propsMap[key]); const was = u.usd; u.usd = 5; propsMap[key] = JSON.stringify(u);
  const n = aiLog.length;
  assert.strictEqual(ctx.testMorningPush(), "sent");
  assert.strictEqual(aiLog.length, n);
  const t = lastPush().messages[0].text;
  if (process.env.SHOW) console.log(t + "\n---");
  const spent = month(MONTH).reduce((s, e) => s - e.amount, 0);
  const fmt = (x) => { x = Math.round(x * 100) / 100; const [a, b] = String(Math.abs(x)).split("."); return (x < 0 ? "-" : "") + a.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (b ? "." + b : ""); };
  assert.ok(t.includes("อรุณสวัสดิ์") && t.includes("งานเลยกำหนด") && t.includes("14:00 นัดลูกค้า"), t);
  assert.ok(t.includes("งบเดือนนี้เหลือ " + fmt(6500 - spent)), t);
  assert.ok(!/NaN|undefined|null/.test(t), t);
  u.usd = was; propsMap[key] = JSON.stringify(u);
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

test("สรุปเช้า: ต้นเดือน (เมื่อวาน = เดือนก่อน) อ่านรายจ่ายเมื่อวานจากเอกสารเดือนก่อน", () => {
  const c = { today: MONTH + "-01", time: "07:00", hour: 7, weekday: 1, records: [] };
  const y = ctx.addDays_(c.today, -1);
  const yDoc = "fg.expenses." + y.slice(0, 7);
  const arr = JSON.parse(store[yDoc] ? store[yDoc].json : "[]");
  arr.push({ id: "y1", date: y, amount: -123, category: "อาหาร", memo: "เมื่อวาน", source: "manual" });
  store[yDoc] = { json: JSON.stringify(arr), by: "app", updateTime: ts() };
  const f = ctx.morningFacts_(c);
  const exp = arr.filter((e) => e.date === y).reduce((s, e) => s - e.amount, 0);
  assert.strictEqual(f.yesterdaySpent, Math.round(exp * 100) / 100);
  assert.ok(f.yesterdaySpent >= 123);
});

function clearTodayJournal() {
  const id = "g.journal." + TODAY.slice(0, 4);
  if (store[id]) store[id] = { json: JSON.stringify(JSON.parse(store[id].json).filter((j) => j.date !== TODAY)), by: "app", updateTime: ts() };
  delete propsMap.PUSHED_journal;
}
test("ชวน Journal: ยังไม่เขียน → ส่ง พร้อมยอดวันนี้ + ปุ่มเขียนเลย/ข้าม · ปุ่มข้ามตอบไม่ใช้ AI", () => {
  aiScript = once([{ name: "add_expense", args: { amount: 80, category: "อาหาร", memo: "ข้าวเย็น journal" } }]);
  post([msg("ข้าวเย็น 80")]);
  clearTodayJournal();
  const n = aiLog.length;
  assert.strictEqual(ctx.eveningJournalPush(), "sent");
  assert.strictEqual(aiLog.length, n);
  const m = lastPush().messages[0];
  const todaySpent = month(MONTH).filter((e) => e.date === TODAY).reduce((s, e) => s - e.amount, 0);
  const fmt = (x) => String(Math.round(x * 100) / 100).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  assert.ok(m.text.includes("Journal") && m.text.includes("ใช้ไป " + fmt(todaySpent) + " บาท"), m.text);
  const q = m.quickReply.items.map((i) => i.action);
  assert.strictEqual(q[0].inputOption, "openKeyboard"); assert.strictEqual(q[0].fillInText, "journal วันนี้ ");
  assert.strictEqual(q[1].data, "a=skipj");
  post([pb("a=skipj")]);
  assert.ok(lastReply().text.includes("พรุ่งนี้"));
  assert.strictEqual(aiLog.length, n);
  assert.strictEqual(ctx.eveningJournalPush(), "already");
});

test("ชวน Journal: วันนี้เขียนแล้ว → ไม่ทัก (ไม่เสียโควตา) · ถ้า Journal วันนี้ว่างเปล่ายังทัก", () => {
  clearTodayJournal();
  const yr = TODAY.slice(0, 4), id = "g.journal." + yr;
  const arr = JSON.parse(store[id] ? store[id].json : "[]");
  arr.push({ id: "jt", date: TODAY, entry: "  " });
  store[id] = { json: JSON.stringify(arr), by: "app", updateTime: ts() };
  delete propsMap.PUSHED_journal;
  assert.strictEqual(ctx.eveningJournalPush(), "sent");
  aiScript = once([{ name: "add_journal", args: { text: "วันนี้ขายดี" } }]);
  post([msg("วันนี้ขายดี")]);
  delete propsMap.PUSHED_journal;
  const p0 = pushCount();
  assert.strictEqual(ctx.eveningJournalPush(), "skipped");
  assert.strictEqual(pushCount(), p0);
  assert.strictEqual(propsMap.PUSHED_journal, TODAY);
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
  assert.ok(t.includes("ความจำระยะยาว: 1/60") && t.includes("สรุปเช้า 07:00") && t.includes("Journal 20:00") && /ส่งไป \d+ ครั้ง/.test(t), t);
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

test("ไฟล์: สั่งลบรายการ (delete_entry) → ไฟล์ที่แนบลงถังขยะ Drive", () => {
  aiScript = once([{ name: "add_expense", args: { amount: 555, category: "อื่นๆ", memo: "ลบทั้งรูป" } }]);
  post([msg("ลบทั้งรูป 555")]);
  post([img("m7")]);
  const e = newestExp("ลบทั้งรูป");
  const f = files().find((x) => x.link && x.link.id === e.id);
  aiScript = once([{ name: "delete_entry", args: { ref: "fg.expenses." + MONTH + "#" + e.id } }], "ลบแล้วครับ");
  post([msg("ลบรายการลบทั้งรูปทิ้ง")]);
  assert.ok(!newestExp("ลบทั้งรูป"));
  assert.ok(!fstore[f.id] && drive.files[f.driveId].trashed);
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

console.log("\n" + passed + " passed" + (process.exitCode ? " (มีบางข้อพัง)" : ""));
