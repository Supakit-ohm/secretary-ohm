// ตัวช่วย "เฉพาะเทสต์": โค้ดจดรายจ่าย/รายรับ/กบข. ที่ถูกลบออกจาก Bot.gs ตอนขั้นที่ 9 (Jack ไม่จดเงินแล้ว)
// ใช้เป็นตัวสร้างข้อมูลเงินตั้งต้นให้เทสต์เท่านั้น — ไม่ได้ deploy
// ---------- รายจ่าย ----------
// ขั้นที่ 1: ไม่ได้อยู่ใน TOOLS แล้ว (Jack ไม่จดเงิน) — เหลือไว้ให้ Files.gs ส่วนอ่านสลิป (OCR_ENABLED:false) เรียกเท่านั้น
function toolAddExpense_(a, ctx) {
  var amt = money_(a.amount);
  if (!amt) return { ok: false, error: "จำนวนเงินไม่ถูกต้อง" };
  var date = validDate_(a.date) || ctx.today;
  var category = clean_(a.category, 40) || "อื่นๆ";
  var memo = clean_(a.memo, 120);
  if (isRetirementSaving_(category + " " + memo)) return addRetirement_(amt, date, memo, ctx);

  var month = date.slice(0, 7);
  var doc = "fg.expenses." + month;
  var id = uid_();
  var item = { id: id, date: date, amount: -amt, category: category, memo: memo, source: "manual", via: "line" };
  var actId = uid_();
  var budgetInfo = mutate_([{ id: doc, def: [] }, { id: "k.activity", def: [] }, { id: "k.budgets", def: null, readOnly: true }], function (G) {
    arrPush_(G[doc], item);
    pushActivity_(G, actId, "expense", "บันทึกรายจ่าย " + category + " -฿" + fmt_(amt) + " (LINE)");
    return budgetStatus_(G["k.budgets"], category, arrAll_(G[doc]));
  });
  var label = "รายจ่าย " + category + " " + fmt_(amt) + " บาท" + (memo ? " (" + memo + ")" : "") + (date !== ctx.today ? " วันที่ " + date : "");
  addRecord_(ctx, { kind: "expense", ref: doc + "#" + id, actId: actId, label: label });
  return { ok: true, ref: doc + "#" + id, saved: { date: date, amount: amt, category: category, memo: memo }, budget: budgetInfo };
}

function isRetirementSaving_(s) { return /กบข|กสจ/.test(s); }

function addRetirement_(amt, date, memo, ctx) {
  var id = uid_(), actId = uid_();
  var item = { id: id, date: date, amount: amt, name: "สะสม กบข./กสจ.", type: "retirement", source: "manual", via: "line" };
  mutate_([{ id: "f.investments", def: [] }, { id: "k.activity", def: [] }], function (G) {
    arrPush_(G["f.investments"], item);
    pushActivity_(G, actId, "income", "บันทึกเงินสะสม กบข./กสจ. +฿" + fmt_(amt) + " (LINE)");
  });
  var label = "เงินออม กบข./กสจ. " + fmt_(amt) + " บาท";
  addRecord_(ctx, { kind: "investment", ref: "f.investments#" + id, actId: actId, label: label });
  return { ok: true, ref: "f.investments#" + id, note: "บันทึกเป็นเงินออม (investments ประเภท กบข./กสจ.) ไม่ใช่รายจ่าย ตามกติกาของแอป", saved: { date: date, amount: amt } };
}

function budgetStatus_(budgetsGroup, category, monthItems) {
  var budgets = budgetsGroup && budgetsGroup.chunks[0].value;
  var b = budgets && budgets[category];
  var used = 0;
  monthItems.forEach(function (e) { if (e.category === category) used += expOut_(e); });
  if (!b || !(Number(b.amount) > 0)) return { category: category, usedThisMonth: round2_(used), budget: null };
  return { category: category, usedThisMonth: round2_(used), budget: Number(b.amount), pct: Math.round(used / Number(b.amount) * 100) };
}

// ---------- รายรับ ----------
function toolAddIncome_(a, ctx) {
  var amt = money_(a.amount);
  if (!amt) return { ok: false, error: "จำนวนเงินไม่ถูกต้อง" };
  var date = validDate_(a.date) || ctx.today;
  var source = clean_(a.source, 40) || "อื่นๆ";
  var note = clean_(a.note, 120);
  var month = date.slice(0, 7);
  var doc = "fg.income." + month;
  var id = uid_(), actId = uid_();
  var item = { id: id, date: date, month: month, amount: amt, source: source, note: note, via: "line" };
  mutate_([{ id: doc, def: [] }, { id: "k.activity", def: [] }], function (G) {
    arrPush_(G[doc], item);
    pushActivity_(G, actId, "income", "บันทึกรายรับ " + source + " +฿" + fmt_(amt) + " (LINE)");
  });
  var label = "รายรับ " + source + " " + fmt_(amt) + " บาท" + (note ? " (" + note + ")" : "");
  addRecord_(ctx, { kind: "income", ref: doc + "#" + id, actId: actId, label: label });
  return { ok: true, ref: doc + "#" + id, saved: { date: date, amount: amt, source: source, note: note } };
}

