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
  if (u === BASE + ":batchGet") {
    const body = JSON.parse(opt.payload);
    return res(200, body.documents.map((n) => {
      const id = n.replace(PFX, "");
      const d = store[id];
      return d ? { found: { name: n, fields: { json: { stringValue: d.json } }, updateTime: d.updateTime } } : { missing: n };
    }));
  }
  if (u === BASE + ":commit") {
    if (injectConflict) { const f = injectConflict; injectConflict = null; f(); }
    const body = JSON.parse(opt.payload);
    for (const w of body.writes) {
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
function line(url, opt) {
  if (url.endsWith("/v2/bot/info")) return res(200, { displayName: "Jack", basicId: "@jack" });
  lineLog.push({ path: url.replace("https://api.line.me", ""), body: JSON.parse(opt.payload || "{}") });
  return res(200, {});
}

function res(code, obj) { const t = JSON.stringify(obj); return { getResponseCode: () => code, getContentText: () => t }; }

// ---------- Fake GAS ----------
const propsMap = { LINE_CHANNEL_ACCESS_TOKEN: "L", OPENAI_API_KEY: "sk-x", WEBHOOK_KEY: "SECRET" };
const cacheMap = {};
function fmtDate(d, tz, p) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" }).formatToParts(d).map((x) => [x.type, x.value]));
  const wd = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[parts.weekday];
  return p.replace("yyyy", parts.year).replace("MM", parts.month).replace("dd", parts.day).replace("HH", parts.hour).replace("mm", parts.minute)
    .replace(/^H$/, String(Number(parts.hour))).replace(/^u$/, String(wd)).replace("d/M", Number(parts.day) + "/" + Number(parts.month));
}
const ctx = {
  console: { log: () => {}, error: (e) => { if (process.env.DEBUG) console.error("GAS error:", e); } },
  JSON, Math, Date, String, Number, Object, Array, isFinite, isNaN, Error, encodeURIComponent, decodeURIComponent, RegExp,
  UrlFetchApp: { fetch: (url, opt) => {
    opt = opt || {};
    if (url.startsWith("https://firestore.googleapis.com/")) return firestore(url, opt);
    if (url.startsWith("https://api.openai.com/")) return openai(url, opt);
    if (url.startsWith("https://api.line.me/")) return line(url, opt);
    throw new Error("unexpected fetch " + url);
  } },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in propsMap ? propsMap[k] : null), setProperty: (k, v) => { propsMap[k] = String(v); }, deleteProperty: (k) => { delete propsMap[k]; } }) },
  CacheService: { getScriptCache: () => ({ get: (k) => (k in cacheMap ? cacheMap[k] : null), put: (k, v) => { assert.ok(String(v).length < 100000, "cache value too big"); cacheMap[k] = String(v); }, remove: (k) => { delete cacheMap[k]; }, removeAll: (ks) => ks.forEach((k) => delete cacheMap[k]) }) },
  LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
  Utilities: {
    formatDate: fmtDate, getUuid: () => require("crypto").randomUUID(), sleep: () => {},
    newBlob: (s) => ({ getBytes: () => [...Buffer.from(s, "utf8")] }),
    base64EncodeWebSafe: (x) => Buffer.from(x).toString("base64url"),
  },
  ContentService: { createTextOutput: (t) => ({ t }) },
  ScriptApp: { getOAuthToken: () => "tok" },
};
vm.createContext(ctx);
for (const f of ["Config.gs", "Persona.gs", "Bot.gs"]) vm.runInContext(fs.readFileSync(path.join(DIR, f), "utf8"), ctx, { filename: f });

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

test("ข้อความที่ไม่ใช่ตัวอักษร (รูป) → ตอบว่ายังอ่านไม่ได้", () => {
  post([{ type: "message", webhookEventId: "img1", replyToken: "rti", source: { type: "user", userId: "U_OHM" }, message: { type: "image", id: "1" } }]);
  assert.ok(lastReply().text.includes("รูป"));
});

test("checkAll ผ่านทุกข้อกับของปลอม", () => { assert.strictEqual(ctx.checkAll(), true); });

console.log("\n" + passed + " passed" + (process.exitCode ? " (มีบางข้อพัง)" : ""));
