// ============================================================
// Jack — ไฟล์แนบ (ข้อ 55 ขั้นที่ 8)
// รูป / PDF ที่โอมส่งใน LINE → Google Drive (SecretaryOhmApp/files-line) + เอกสารอ้างอิงใน Firestore
//
// ที่เก็บ (ใช้ร่วมกับแอป): users/{uid}/files/{fileId}  field json = สตริง JSON ของ
//   {id, name, mime, size, driveId, url, thumb, link:{kind,id}|null, from:"line"|"app", createdAt, trash, trashedAt}
//   kind = expense | income | document · id = id ของรายการ (ไม่ใช่ ref) → ย้ายเดือนแล้วยังผูกอยู่
//   ไม่ได้เก็บในตัวรายการ → แนบ/ย้ายไฟล์ไม่ต้องเขียนเอกสารรายจ่ายชนกับแอป
//   ไฟล์ที่ link = null หรือชี้ไปรายการที่ไม่มีแล้ว = "ไฟล์รอจัด" ในหน้า Documents ของแอป
//
// การผูกอัตโนมัติ (โอมเลือก 2026-09-28):
//   ส่งรูปภายใน 10 นาทีหลังจดรายจ่าย/รายรับ → แนบกับรายการนั้นเลย (มีปุ่มเปลี่ยน/เก็บเป็นเอกสาร/ลบ)
//   ส่งรูปก่อน → เก็บรอ 10 นาที ถ้าพิมพ์รายการตามมาจะแนบให้เอง (หรือกดเลือกรายการจากปุ่ม)
// ลบ: แอปตั้ง trash:true (แอปมีสิทธิ์ drive.file ลบไฟล์ของ Jack ไม่ได้) → Jack ย้ายลงถังขยะ Drive ตอนรอบ 07:00
//      ถ้าลบจาก LINE (ปุ่ม/ลบรายการ) Jack ย้ายลงถังขยะทันที
// ============================================================
var FILES_ROOT = "SecretaryOhmApp";      // โฟลเดอร์เดียวกับที่แอปใช้เก็บไฟล์สำรอง
var FILES_FOLDER_LINE = "files-line";    // แอปใช้ files-app (แอปมองไม่เห็นโฟลเดอร์ที่ Jack สร้าง เลยแยกกัน)
var THUMB_MAX_BYTES = 11000;             // รูปย่อใน Firestore ≤ ~15KB หลังแปลง base64

// ---------- Firestore: users/{uid}/files ----------
function fileDocName_(id) { return fsBase_() + "/users/" + firebaseUid_() + "/files/" + id; }
function parseFileDoc_(x) {
  try { var m = JSON.parse(x.fields.json.stringValue); return m && m.id ? m : null; } catch (e) { return null; }
}
function filesGet_(ids) {
  var out = {};
  if (!ids.length) return out;
  var r = fsFetch_("POST", fsUrl_(":batchGet"), { documents: ids.map(fileDocName_) });
  if (r.code !== 200) throw new Error("อ่านไฟล์แนบไม่ได้ (" + r.code + "): " + fsErr_(r));
  (r.json || []).forEach(function (x) {
    if (!x.found) return;
    var m = parseFileDoc_(x.found);
    if (m) out[m.id] = { meta: m, updateTime: x.found.updateTime };
  });
  return out;
}
function filesListAll_() {
  var out = {}, token = "";
  do {
    var r = fsFetch_("GET", fsUrl_("/users/" + firebaseUid_() + "/files?pageSize=300" + (token ? "&pageToken=" + encodeURIComponent(token) : "")));
    if (r.code !== 200) throw new Error("อ่านรายการไฟล์แนบไม่ได้ (" + r.code + "): " + fsErr_(r));
    ((r.json && r.json.documents) || []).forEach(function (d) { var m = parseFileDoc_(d); if (m) out[m.id] = { meta: m, updateTime: d.updateTime }; });
    token = r.json && r.json.nextPageToken;
  } while (token);
  return out;
}
function fileWriteOp_(meta, cur) {
  return {
    update: { name: fileDocName_(meta.id), fields: { json: { stringValue: JSON.stringify(meta) }, by: { stringValue: BOT_BY } } },
    updateTransforms: [{ fieldPath: "at", setToServerValue: "REQUEST_TIME" }],
    currentDocument: cur ? { updateTime: cur.updateTime } : { exists: false }
  };
}
function filesCommit_(writes) {
  if (!writes.length) return { ok: true };
  var r = fsFetch_("POST", fsUrl_(":commit"), { writes: writes });
  if (r.code === 200) return { ok: true };
  var status = r.json && r.json.error && r.json.error.status;
  var conflict = status === "FAILED_PRECONDITION" || status === "ALREADY_EXISTS" || status === "ABORTED" || r.code === 409;
  if (!conflict) throw new Error("บันทึกไฟล์แนบลง Firestore ไม่สำเร็จ (" + r.code + "): " + fsErr_(r));
  return { ok: false };
}
function fileCreate_(meta) {
  if (!filesCommit_([fileWriteOp_(meta, null)]).ok) throw new Error("สร้างเอกสารไฟล์ไม่สำเร็จ (id ซ้ำ)");
  return meta;
}
// แก้หลายไฟล์พร้อมกัน: fn(metas) แก้ใน metas แล้วคืน [id ที่แก้] — ชนกับแอป → อ่านใหม่ทำซ้ำ ≤4 รอบ
function filesMutate_(ids, fn) {
  for (var attempt = 1; ; attempt++) {
    var cur = filesGet_(ids);
    var metas = {};
    Object.keys(cur).forEach(function (id) { metas[id] = JSON.parse(JSON.stringify(cur[id].meta)); });
    var changed = fn(metas) || [];
    var writes = changed.filter(function (id) { return metas[id]; }).map(function (id) { return fileWriteOp_(metas[id], cur[id]); });
    if (filesCommit_(writes).ok) return { found: Object.keys(cur).length, changed: writes.length, metas: metas };
    if (attempt >= 4) throw new Error("บันทึกไฟล์แนบไม่สำเร็จ (แอปแก้ชนหลายรอบ)");
    Utilities.sleep(200 * attempt);
  }
}
function filesSetLink_(ids, link) {
  return filesMutate_(ids, function (metas) {
    return Object.keys(metas).filter(function (id) { return !metas[id].trash; }).map(function (id) { metas[id].link = link || null; return id; });
  });
}
function filesLinkedTo_(kind, entryId) {
  var all = filesListAll_();
  return Object.keys(all).map(function (k) { return all[k].meta; }).filter(function (m) { return !m.trash && m.link && m.link.kind === kind && m.link.id === entryId; });
}

// ---------- Google Drive ----------
function filesFolder_() {
  var id = prop_("DRIVE_FILES_FOLDER_ID");
  if (id) { try { var f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (e) {} }
  var roots = DriveApp.getFoldersByName(FILES_ROOT);
  var root = roots.hasNext() ? roots.next() : DriveApp.createFolder(FILES_ROOT);
  var subs = root.getFoldersByName(FILES_FOLDER_LINE);
  var sub = subs.hasNext() ? subs.next() : root.createFolder(FILES_FOLDER_LINE);
  props_().setProperty("DRIVE_FILES_FOLDER_ID", sub.getId());
  return sub;
}
// ย้ายลงถังขยะ Drive + ลบเอกสาร Firestore (ไฟล์หายไปแล้ว/ไม่มีสิทธิ์ = ถือว่าลบแล้ว)
function trashFilesNow_(metas) {
  var writes = [];
  metas.forEach(function (m) {
    if (m.driveId) { try { DriveApp.getFileById(m.driveId).setTrashed(true); } catch (e) { console.log("ข้ามไฟล์ Drive " + m.driveId + ": " + shortErr_(e)); } }
    writes.push({ "delete": fileDocName_(m.id) });
  });
  if (writes.length) {
    var r = fsFetch_("POST", fsUrl_(":commit"), { writes: writes });
    if (r.code !== 200) throw new Error("ลบเอกสารไฟล์ไม่สำเร็จ (" + r.code + "): " + fsErr_(r));
  }
  return writes.length;
}
// รอบ 07:00 (เรียกจาก morningPush) + รันเองได้: เก็บกวาดไฟล์ที่แอปกดลบ (trash:true)
function sweepTrash() {
  var all = filesListAll_();
  var todo = Object.keys(all).map(function (k) { return all[k].meta; }).filter(function (m) { return m.trash; });
  var n = trashFilesNow_(todo);
  console.log(n ? "🗑️ ย้ายลงถังขยะ Drive แล้ว " + n + " ไฟล์" : "ไม่มีไฟล์รอลบ");
  return n;
}

// ---------- LINE → Drive ----------
function lineContent_(messageId, preview) {
  var res = UrlFetchApp.fetch("https://api-data.line.me/v2/bot/message/" + messageId + "/content" + (preview ? "/preview" : ""), {
    method: "get", muteHttpExceptions: true, headers: { Authorization: "Bearer " + prop_("LINE_CHANNEL_ACCESS_TOKEN") }
  });
  if (res.getResponseCode() !== 200) throw new Error("ดึงไฟล์จาก LINE ไม่ได้ (" + res.getResponseCode() + ")");
  return res.getBlob();
}
function dataUri_(blob) {
  var bytes = blob.getBytes();
  if (!bytes.length || bytes.length > THUMB_MAX_BYTES) return null;
  return "data:" + (blob.getContentType() || "image/jpeg") + ";base64," + Utilities.base64Encode(bytes);
}
// รูปย่อ: ภาพ preview ของ LINE ก่อน → ไม่งั้นขอรูปย่อขนาด 160px จาก Drive → ไม่ได้ก็ไม่มี (แอปโชว์ไอคอนแทน)
function thumbFor_(msg, driveId) {
  if (msg.type !== "image") return null;
  try { var t = dataUri_(lineContent_(msg.id, true)); if (t) return t; } catch (e) {}
  try {
    var r = UrlFetchApp.fetch("https://www.googleapis.com/drive/v3/files/" + driveId + "?fields=thumbnailLink", { muteHttpExceptions: true, headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() } });
    var link = r.getResponseCode() === 200 && JSON.parse(r.getContentText()).thumbnailLink;
    if (link) {
      var t2 = UrlFetchApp.fetch(link.replace(/=s\d+$/, "") + "=s160", { muteHttpExceptions: true, headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() } });
      if (t2.getResponseCode() === 200) return dataUri_(t2.getBlob());
    }
  } catch (e) {}
  return null;
}
function newFileId_() { return "f" + Date.now().toString(36) + uid_().slice(0, 4); }
function saveLineFile_(msg, link) {
  var blob;
  if (msg.type === "image" && msg.contentProvider && msg.contentProvider.type === "external" && msg.contentProvider.originalContentUrl) {
    blob = UrlFetchApp.fetch(msg.contentProvider.originalContentUrl).getBlob();
  } else {
    blob = lineContent_(msg.id, false);
  }
  var mime = msg.type === "file" ? "application/pdf" : (blob.getContentType() || "image/jpeg");
  var name = msg.type === "file" ? String(msg.fileName || "file.pdf").replace(/[\\\/:*?"<>|]+/g, "_")
    : "LINE_" + Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd_HHmmss") + (msg.imageSet ? "_" + msg.imageSet.index : "") + (/png/.test(mime) ? ".png" : ".jpg");
  blob.setName(name);
  var file = filesFolder_().createFile(blob);
  var meta = {
    id: newFileId_(), name: name, mime: mime, size: blob.getBytes().length, driveId: file.getId(), url: file.getUrl(),
    thumb: thumbFor_(msg, file.getId()), link: link || null, from: "line", createdAt: new Date().toISOString(), trash: false
  };
  return fileCreate_(meta);
}

// ---------- เลือกรายการที่จะผูก ----------
// รายการที่ Jack เพิ่งจด (ภายใน 10 นาที ยังไม่ถูกยกเลิก) → ผูกอัตโนมัติ
function autoLinkTarget_() {
  var recent = cacheGetJson_("recent") || [];
  var win = CONFIG.ATTACH_WINDOW_MIN * 60000;
  for (var i = 0; i < recent.length; i++) {
    var r = recent[i];
    if (r.kind !== "expense" && r.kind !== "income") continue;
    if (!r.at || Date.now() - r.at > win) return null;                  // recent เรียงใหม่→เก่า
    var rec = r.token ? cacheGetJson_("rec_" + r.token) : null;
    if (rec && rec.undone) continue;
    return r;
  }
  return null;
}
function shortEntryLabel_(kind, it) {
  if (kind === "expense") return (it.memo || it.category || "รายจ่าย") + " " + fmt_(expOut_(it));
  return (it.note || it.source || "รายรับ") + " +" + fmt_(it.amount);
}
// ตัวเลือกสำหรับปุ่ม: ที่ Jack เพิ่งจด (6 ชม.) + รายการล่าสุดของเดือนนี้
function linkCandidates_(ctx, n) {
  var out = [], seen = {};
  var add = function (ref, label) { if (!seen[ref] && out.length < n) { seen[ref] = 1; out.push({ ref: ref, label: label }); } };
  (cacheGetJson_("recent") || []).forEach(function (r) {
    if (r.kind !== "expense" && r.kind !== "income") return;
    var rec = r.token ? cacheGetJson_("rec_" + r.token) : null;
    if (rec && rec.undone) return;
    add(r.ref, r.short || r.label);
  });
  if (out.length < n) {
    var month = ctx.today.slice(0, 7), de = "fg.expenses." + month, di = "fg.income." + month;
    var G = readGroups_([{ id: de, def: [] }, { id: di, def: [] }]);
    var items = arrAll_(G[de]).map(function (x) { return { kind: "expense", doc: de, it: x }; }).slice(-n)
      .concat(arrAll_(G[di]).map(function (x) { return { kind: "income", doc: di, it: x }; }).slice(-2));
    items.sort(function (a, b) { return String(b.it.date || "").localeCompare(String(a.it.date || "")); });
    items.forEach(function (x) { add(x.doc + "#" + x.it.id, shortEntryLabel_(x.kind, x.it)); });
  }
  return out;
}
function fileQuick_(ids, ctx, withCandidates) {
  var f = ids.slice(0, 20).join(",");
  var items = [];
  if (withCandidates) {
    linkCandidates_(ctx, 4).forEach(function (c) {
      items.push({ type: "action", action: { type: "postback", label: ("📎 " + c.label).slice(0, 20), data: "a=flink&f=" + f + "&ref=" + c.ref, displayText: "แนบกับ " + c.label } });
    });
  } else {
    items.push({ type: "action", action: { type: "postback", label: "เปลี่ยนรายการ", data: "a=frelink&f=" + f, displayText: "เปลี่ยนรายการที่แนบ" } });
  }
  items.push({ type: "action", action: { type: "postback", label: "📄 เก็บเป็นเอกสาร", data: "a=fdoc&f=" + f, displayText: "เก็บเป็นเอกสาร" } });
  if (withCandidates) items.push({ type: "action", action: { type: "postback", label: "เก็บไว้ก่อน", data: "a=fkeep&f=" + f, displayText: "เก็บไว้ก่อน" } });
  items.push({ type: "action", action: { type: "postback", label: "🗑️ ลบ", data: "a=ftrash&f=" + f, displayText: "ลบไฟล์นี้" } });
  return items;
}

// ---------- รูปที่รอผูก (ส่งรูปก่อนพิมพ์รายการ) ----------
function pendingFiles_() {
  var win = CONFIG.ATTACH_WINDOW_MIN * 60000;
  return (cacheGetJson_("pendingFiles") || []).filter(function (p) { return Date.now() - p.at <= win; });
}
function setPendingFiles_(list) {
  if (list.length) CacheService.getScriptCache().put("pendingFiles", JSON.stringify(list.slice(-20)), CONFIG.ATTACH_WINDOW_MIN * 60 + 60);
  else CacheService.getScriptCache().remove("pendingFiles");
}
function dropPending_(ids) {
  var set = {}; ids.forEach(function (x) { set[x] = 1; });
  setPendingFiles_(pendingFiles_().filter(function (p) { return !set[p.id]; }));
}
// เรียกหลังประมวลผลข้อความ: ถ้ามีรูปรออยู่และข้อความนี้จดรายจ่าย/รายรับ → แนบกับรายการแรก
function attachPendingTo_(records) {
  var pend = pendingFiles_();
  if (!pend.length) return null;
  var target = (records || []).filter(function (r) { return r.kind === "expense" || r.kind === "income"; })[0];
  if (!target) return null;
  var ids = pend.map(function (p) { return p.id; });
  var r = parseRef_(target.ref);
  var res = filesSetLink_(ids, { kind: target.kind, id: r.id });
  setPendingFiles_([]);
  return res.changed ? res.changed : null;
}

// ---------- ข้อความรูป/ไฟล์จาก LINE ----------
function handleFileMessage_(ev, userId) {
  var msg = ev.message;
  if (msg.type === "file" && !/\.pdf$/i.test(msg.fileName || "")) {
    lineReply_(ev.replyToken, [textMsg_("Jack รับไฟล์ได้แค่รูปกับ PDF ครับ (" + (msg.fileName || "ไฟล์นี้") + " ยังไม่รับ)")]);
    return;
  }
  if (msg.type === "file" && Number(msg.fileSize) > CONFIG.FILE_MAX_MB * 1024 * 1024) {
    lineReply_(ev.replyToken, [textMsg_("ไฟล์ใหญ่เกิน " + CONFIG.FILE_MAX_MB + "MB ครับ อัปขึ้น Drive เองแล้ววางลิงก์ในหน้า Documents แทนนะ")]);
    return;
  }
  if (userId) lineLoading_(userId, 20);
  var ctx = newCtx_();
  var target = autoLinkTarget_();
  var link = target ? { kind: target.kind, id: parseRef_(target.ref).id } : null;
  var meta = saveLineFile_(msg, link);
  if (!link) setPendingFiles_(pendingFiles_().concat([{ id: meta.id, at: Date.now() }]));

  // ส่งหลายรูปพร้อมกัน (imageSet) → ตอบครั้งเดียวเมื่อครบชุด
  var ids = [meta.id], set = msg.imageSet;
  if (set && set.id && Number(set.total) > 1) {
    var key = "iset_" + set.id, st = cacheGetJson_(key) || { ids: [], replied: false };
    st.ids.push(meta.id);
    var done = !st.replied && (st.ids.length >= Number(set.total) || Number(set.index) === Number(set.total));
    if (done) st.replied = true;
    CacheService.getScriptCache().put(key, JSON.stringify(st), 3600);
    if (!done) return;
    ids = st.ids;
  }
  var what = ids.length > 1 ? ids.length + " รูป" : (msg.type === "file" ? "ไฟล์ " + meta.name : "รูป");
  var text;
  if (link) {
    text = "📎 แนบ" + what + "กับ" + target.label + " แล้วครับ";
    saveHistory_("[ส่ง" + what + "]", text);
    lineReply_(ev.replyToken, [textMsg_(text, fileQuick_(ids, ctx, false))]);
  } else {
    text = "📎 เก็บ" + what + "ไว้ใน Drive แล้วครับ\nพิมพ์รายการตามมาภายใน " + CONFIG.ATTACH_WINDOW_MIN + " นาที (เช่น \"ข้าว 120\") Jack จะแนบให้เอง หรือเลือกด้านล่าง";
    saveHistory_("[ส่ง" + what + "]", text);
    lineReply_(ev.replyToken, [textMsg_(text, fileQuick_(ids, ctx, true))]);
  }
}

// ---------- ปุ่มใต้ข้อความไฟล์ (postback a=flink/frelink/fdoc/fkeep/ftrash) ----------
function handleFilePostback_(ev, data) {
  var ids = String(data.f || "").split(",").filter(function (x) { return /^f[a-z0-9]+$/.test(x); });
  if (!ids.length) { lineReply_(ev.replyToken, [textMsg_("ปุ่มนี้ใช้ไม่ได้แล้วครับ")]); return; }
  var ctx = newCtx_();
  var gone = "ไม่เจอไฟล์นี้แล้วครับ (อาจถูกลบในแอป)";
  if (data.a === "frelink") {
    lineReply_(ev.replyToken, [textMsg_("จะแนบกับรายการไหนครับ (หรือพิมพ์รายการใหม่ภายใน " + CONFIG.ATTACH_WINDOW_MIN + " นาที)", fileQuick_(ids, ctx, true))]);
    setPendingFiles_(pendingFiles_().filter(function (p) { return ids.indexOf(p.id) < 0; }).concat(ids.map(function (id) { return { id: id, at: Date.now() }; })));
    return;
  }
  if (data.a === "flink") {
    var r = parseRef_(data.ref), kind = r && kindOfDoc_(r.doc);
    if (kind !== "expense" && kind !== "income") { lineReply_(ev.replyToken, [textMsg_("รายการนี้ใช้ไม่ได้ครับ")]); return; }
    var G = readGroups_([{ id: r.doc, def: [] }]);
    var f = arrFind_(G[r.doc], r.id);
    if (!f) { lineReply_(ev.replyToken, [textMsg_("ไม่เจอรายการนี้แล้วครับ (อาจถูกลบ)")]); return; }
    var res = filesSetLink_(ids, { kind: kind, id: r.id });
    dropPending_(ids);
    lineReply_(ev.replyToken, [textMsg_(res.changed ? "📎 แนบกับ" + labelFor_(kind, f.chunk.value[f.index]) + " แล้วครับ" : gone)]);
    return;
  }
  if (data.a === "fkeep") {
    var rk = filesSetLink_(ids, null);
    dropPending_(ids);
    lineReply_(ev.replyToken, [textMsg_(rk.changed ? "โอเคครับ เก็บไว้ใน \"ไฟล์รอจัด\" หน้า Documents ของแอป ไปผูกทีหลังได้" : gone)]);
    return;
  }
  if (data.a === "fdoc") {
    var cur = filesGet_(ids);
    var metas = Object.keys(cur).map(function (k) { return cur[k].meta; }).filter(function (m) { return !m.trash; });
    if (!metas.length) { lineReply_(ev.replyToken, [textMsg_(gone)]); return; }
    var pdf = metas.length === 1 && /pdf/.test(metas[0].mime) ? metas[0].name.replace(/\.pdf$/i, "") : "";
    var title = pdf || "เอกสารจาก LINE " + thDate_(ctx.today);
    var docId = uid_();
    mutate_([{ id: "k.documents", def: [] }], function (G2) {
      if (!arrFind_(G2["k.documents"], docId)) arrPush_(G2["k.documents"], { id: docId, title: title, category: "อื่นๆ", description: "ส่งมาจาก LINE", link: "" });
    });
    filesSetLink_(metas.map(function (m) { return m.id; }), { kind: "document", id: docId });
    dropPending_(ids);
    var t = "📄 เก็บเป็นเอกสาร \"" + title + "\" แล้วครับ — ไปตั้งชื่อ/หมวดได้ในหน้า Documents";
    saveHistory_("เก็บเป็นเอกสาร", t);
    lineReply_(ev.replyToken, [textMsg_(t)]);
    return;
  }
  if (data.a === "ftrash") {
    var cur2 = filesGet_(ids);
    var n = trashFilesNow_(Object.keys(cur2).map(function (k) { return cur2[k].meta; }));
    dropPending_(ids);
    lineReply_(ev.replyToken, [textMsg_(n ? "🗑️ ลบแล้วครับ (อยู่ในถังขยะ Drive กู้คืนได้ 30 วัน)" : gone)]);
  }
}

// ---------- ตั้งค่าครั้งแรก (รันจาก editor เพื่ออนุญาตสิทธิ์ Google Drive) ----------
function setupFiles() {
  var folder = filesFolder_();
  console.log("✅ Drive: โฟลเดอร์ไฟล์จาก LINE = " + FILES_ROOT + "/" + FILES_FOLDER_LINE + "\n   " + folder.getUrl());
  try {
    var all = filesListAll_();
    var list = Object.keys(all).map(function (k) { return all[k].meta; });
    console.log("✅ Firestore: ไฟล์แนบในระบบ " + list.filter(function (m) { return !m.trash; }).length + " ไฟล์ · รอลบ " + list.filter(function (m) { return m.trash; }).length);
  } catch (e) { console.log("❌ Firestore: " + e.message); }
}
