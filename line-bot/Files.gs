// ============================================================
// Jack — ไฟล์แนบ (ข้อ 55 ขั้นที่ 8)
// รูป / PDF ที่โอมส่งใน LINE → Google Drive (SecretaryOhmApp/files-line) + เอกสารอ้างอิงใน Firestore
//
// ที่เก็บ (ใช้ร่วมกับแอป): users/{uid}/files/{fileId}  field json = สตริง JSON ของ
//   {id, name, mime, size, driveId, url, thumb, link:{kind,id}|null, from:"line"|"app", createdAt, trash, trashedAt}
//   kind = document (ไฟล์เก่าอาจเป็น expense | income) · id = id ของรายการ (ไม่ใช่ ref) → ย้ายเดือนแล้วยังผูกอยู่
//   ไม่ได้เก็บในตัวรายการ → แนบ/ย้ายไฟล์ไม่ต้องเขียนเอกสารรายจ่ายชนกับแอป
//   ไฟล์ที่ link = null หรือชี้ไปรายการที่ไม่มีแล้ว = "ไฟล์รอจัด" ในหน้า Documents ของแอป
//
// ขั้นที่ 9 (ข้อ 56): ทุกไฟล์ที่ส่งมา = เอกสาร — Jack ถามหมวด → สร้างใน k.documents + ผูกไฟล์ (kind "document") → ถามชื่อ/วันหมดอายุ
//   ไม่ผูกกับรายจ่าย/รายรับอีกแล้ว และไม่อ่านสลิป (OCR ถูกลบ) · ไฟล์เก่าที่ผูกกับรายจ่ายไว้ยังเปิดดูในแอปได้เหมือนเดิม
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
function fetchLineBlob_(msg) {
  if (msg.type === "image" && msg.contentProvider && msg.contentProvider.type === "external" && msg.contentProvider.originalContentUrl) {
    return UrlFetchApp.fetch(msg.contentProvider.originalContentUrl).getBlob();
  }
  return lineContent_(msg.id, false);
}
function saveLineFile_(msg, link, blob) {
  blob = blob || fetchLineBlob_(msg);
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

// ---------- ขั้นที่ 9 (ข้อ 56): เอกสาร ----------
// ไฟล์ที่ส่งเข้ามา → Jack ถามหมวด (Quick Reply) → สร้างเอกสารใน k.documents + ผูกไฟล์ → ให้พิมพ์ชื่อ (+วันหมดอายุ) ได้เลย
// หมวด "งาน/ราชการ" = โหมดจำกัด: ไม่มีในปุ่มของ Jack · Jack ไม่อ่าน/ไม่แก้ (ยกเว้นโอมติ๊ก "ไม่ลับ" ในแอป → d.open)
// ต้องตรงกับ DOC_CATS ใน preview-dashboard.html
var DOC_CATS = [
  { k: "ประจำตัว", icon: "🪪" },
  { k: "งาน/ราชการ", icon: "🎖️", restricted: true },
  { k: "ประวัติ/ใบรับรอง", icon: "👤" },
  { k: "ยานพาหนะ", icon: "🚗" },
  { k: "ทั่วไป", icon: "📁" }
];
var DOC_CAT_LEGACY = { "ประชาชน": "ประจำตัว", "สัญญา": "ทั่วไป", "การเงิน": "ทั่วไป", "ประกัน": "ทั่วไป", "อื่นๆ": "ทั่วไป", "": "ทั่วไป" };
var DOC_AWAIT_SEC = 600;                  // รอโอมพิมพ์ชื่อ/วันหมดอายุหลังเลือกหมวด (10 นาที)
function docCatKey_(c) {
  for (var i = 0; i < DOC_CATS.length; i++) if (DOC_CATS[i].k === c) return c;
  return DOC_CAT_LEGACY[c] || "ทั่วไป";
}
function docCatDef_(c) { var k = docCatKey_(c); for (var i = 0; i < DOC_CATS.length; i++) if (DOC_CATS[i].k === k) return DOC_CATS[i]; return DOC_CATS[4]; }
function docRestricted_(d) { return !!(docCatDef_(d.category).restricted && !d.open); }
function docsAll_() { return arrAll_(readGroups_([{ id: "k.documents", def: [] }])["k.documents"]).filter(function (d) { return d && d.id; }); }
function thDateY_(iso) { return thDate_(iso) + " " + (Number(iso.slice(0, 4)) + 543); }
// หาวันที่ในข้อความ: 31/12/2027 · 31-12-2570 (พ.ศ. แปลงให้) · 2027-12-31 → {date, rest} หรือ null
function parseDocDate_(text) {
  var s = String(text || ""), m, y, d, mo;
  if ((m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else if ((m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/))) { d = +m[1]; mo = +m[2]; y = +m[3]; if (y < 100) y += 2000; }
  else return null;
  if (y > 2400) y -= 543;
  var iso = y + "-" + (mo < 10 ? "0" : "") + mo + "-" + (d < 10 ? "0" : "") + d;
  if (!validDate_(iso)) return null;
  return { date: iso, rest: s.replace(m[0], " ") };
}

// ---------- ส่งไฟล์เข้ามา ----------
function fileQuick_(ids) {
  var f = ids.slice(0, 20).join(",");
  var items = [];
  DOC_CATS.forEach(function (c, i) {
    if (c.restricted) return;                                            // งาน/ราชการ ไม่มีในปุ่มของ Jack
    items.push({ type: "action", action: { type: "postback", label: (c.icon + " " + c.k).slice(0, 20), data: "a=fcat&f=" + f + "&c=" + i, displayText: "เก็บเป็นเอกสาร: " + c.k } });
  });
  items.push({ type: "action", action: { type: "postback", label: "เก็บไว้ก่อน", data: "a=fkeep&f=" + f, displayText: "เก็บไว้ก่อน" } });
  items.push({ type: "action", action: { type: "postback", label: "🗑️ ลบ", data: "a=ftrash&f=" + f, displayText: "ลบไฟล์นี้" } });
  return items;
}

function handleFileMessage_(ev, userId) {
  var msg = ev.message;
  if (msg.type === "file" && !/\.pdf$/i.test(msg.fileName || "")) {
    lineReply_(ev.replyToken, [textMsg_("Jack รับไฟล์ได้แค่รูปกับ PDF ครับ (" + (msg.fileName || "ไฟล์นี้") + " ยังไม่รับ)")]);
    return;
  }
  if (msg.type === "file" && Number(msg.fileSize) > CONFIG.FILE_MAX_MB * 1024 * 1024) {
    lineReply_(ev.replyToken, [textMsg_("ไฟล์ใหญ่เกิน " + CONFIG.FILE_MAX_MB + "MB ครับ อัปขึ้น Drive เองแล้ววางลิงก์ในหน้า Documents แทนได้")]);
    return;
  }
  if (userId) lineLoading_(userId, 30);
  var meta = saveLineFile_(msg, null, fetchLineBlob_(msg));

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
  var many = ids.length > 1;
  var what = many ? ids.length + " รูป" : (msg.type === "file" ? "ไฟล์ " + meta.name : "รูป");
  var text = "📎 เก็บ" + what + "ไว้ใน Drive แล้วครับ\nจะจัดเป็นเอกสารหมวดไหนดี?";
  saveHistory_("[ส่ง" + what + "]", text);
  lineReply_(ev.replyToken, [textMsg_(text, fileQuick_(ids))]);
}

// ---------- ปุ่มใต้ข้อความไฟล์ (postback a=fcat/fskip/fkeep/ftrash) ----------
function handleFilePostback_(ev, data) {
  if (data.a === "fskip") {
    CacheService.getScriptCache().remove("docAwait");
    lineReply_(ev.replyToken, [textMsg_("โอเคครับ ตั้งชื่อ/วันหมดอายุทีหลังได้ในหน้า Documents ของแอป หรือบอก Jack ก็ได้")]);
    return;
  }
  var ids = String(data.f || "").split(",").filter(function (x) { return /^f[a-z0-9]+$/.test(x); });
  if (!ids.length) { lineReply_(ev.replyToken, [textMsg_("ปุ่มนี้ใช้ไม่ได้แล้วครับ")]); return; }
  var ctx = newCtx_();
  var gone = "ไม่เจอไฟล์นี้แล้วครับ (อาจถูกลบในแอป)";
  if (data.a === "fkeep") {
    var rk = filesSetLink_(ids, null);
    lineReply_(ev.replyToken, [textMsg_(rk.changed ? "โอเคครับ เก็บไว้ใน \"ไฟล์รอจัด\" หน้า Documents ของแอป จัดหมวดทีหลังได้" : gone)]);
    return;
  }
  if (data.a === "fcat") {
    var cat = DOC_CATS[Number(data.c)];
    if (!cat || cat.restricted) { lineReply_(ev.replyToken, [textMsg_("หมวดนี้เลือกผ่าน Jack ไม่ได้ครับ")]); return; }
    var cur = filesGet_(ids);
    var metas = Object.keys(cur).map(function (k) { return cur[k].meta; }).filter(function (m) { return !m.trash; });
    if (!metas.length) { lineReply_(ev.replyToken, [textMsg_(gone)]); return; }
    var pdf = metas.length === 1 && /pdf/.test(metas[0].mime) ? metas[0].name.replace(/\.pdf$/i, "") : "";
    var title = pdf || "เอกสารจาก LINE " + thDate_(ctx.today);
    var docId = uid_();
    mutate_([{ id: "k.documents", def: [] }], function (G2) {
      if (!arrFind_(G2["k.documents"], docId)) arrPush_(G2["k.documents"], { id: docId, title: title, category: cat.k, description: "ส่งมาจาก LINE", link: "", expiry: "", info: {} });
    });
    filesSetLink_(metas.map(function (m) { return m.id; }), { kind: "document", id: docId });
    CacheService.getScriptCache().put("docAwait", JSON.stringify({ docId: docId, at: Date.now() }), DOC_AWAIT_SEC);
    var t = "📄 เก็บเป็นเอกสารหมวด " + cat.icon + " " + cat.k + " แล้วครับ\nพิมพ์ชื่อเอกสารได้เลย ต่อด้วยวันหมดอายุก็ได้ เช่น \"ประกันรถ 31/12/2027\" (Jack จะเตือน 30 วันกับ 7 วันก่อนหมด) หรือกดข้าม";
    saveHistory_("เก็บเป็นเอกสาร " + cat.k, t);
    lineReply_(ev.replyToken, [textMsg_(t, [{ type: "action", action: { type: "postback", label: "ข้าม", data: "a=fskip", displayText: "ข้าม" } }])]);
    return;
  }
  if (data.a === "ftrash") {
    var cur2 = filesGet_(ids);
    var n = trashFilesNow_(Object.keys(cur2).map(function (k) { return cur2[k].meta; }));
    lineReply_(ev.replyToken, [textMsg_(n ? "🗑️ ลบแล้วครับ (อยู่ในถังขยะ Drive กู้คืนได้ 30 วัน)" : gone)]);
  }
}

// หลังเลือกหมวด: ข้อความสั้นถัดไป = ชื่อเอกสาร (+วันหมดอายุ) — ไม่ใช้ AI · ยาว/หลายบรรทัด = ปล่อยให้ Jack ตอบตามปกติ
function docAwaitHandle_(text) {
  var st = cacheGetJson_("docAwait");
  if (!st) return null;
  var s = String(text || "").trim();
  if (!s || s.length > 60 || /\n/.test(s) || s.charAt(0) === "/") { CacheService.getScriptCache().remove("docAwait"); return null; }
  CacheService.getScriptCache().remove("docAwait");
  if (/^(ไม่มี|ไม่|ข้าม|ไม่ต้อง|ไม่มีวันหมดอายุ)$/.test(s)) return simple_("โอเคครับ ตั้งชื่อ/วันหมดอายุทีหลังได้ในหน้า Documents หรือบอก Jack ก็ได้");
  var pd = parseDocDate_(s);
  var title = clean_((pd ? pd.rest : s).replace(/(วันหมดอายุ|หมดอายุ|exp(ire)?s?)\s*[:วันที่]*/ig, " ").replace(/[\s,:;–—-]+$/g, "").replace(/^[\s,:;–—-]+/g, "").replace(/\s+/g, " "), 80);
  if (!title && !pd) return null;
  var found = mutate_([{ id: "k.documents", def: [] }], function (G) {
    var f = arrFind_(G["k.documents"], st.docId);
    if (!f) return null;
    var it = JSON.parse(JSON.stringify(f.chunk.value[f.index]));
    if (title) it.title = title;
    if (pd) it.expiry = pd.date;
    f.chunk.value[f.index] = it; f.chunk.dirty = true;
    return it;
  });
  if (!found) return null;
  var out = "✅ ตั้งชื่อเอกสาร \"" + found.title + "\"" + (pd ? " · หมดอายุ " + thDateY_(pd.date) + " (เตือน 30 วันกับ 7 วันก่อนหมด)" : "");
  saveHistory_(s, out);
  return simple_(out);
}

// ---------- เครื่องมือของ Jack: find_documents / update_document ----------
function toolFindDocuments_(a, ctx) {
  var words = String(a.query || "").toLowerCase().split(/\s+/).filter(function (w) { return w; });
  var cat = a.category ? docCatKey_(a.category) : "";
  var all = docsAll_().filter(function (d) { return !docRestricted_(d); });          // งาน/ราชการ (ไม่ลับ=false) Jack มองไม่เห็นเลย
  var hit = all.filter(function (d) {
    if (cat && docCatKey_(d.category) !== cat) return false;
    var hay = [d.title, docCatKey_(d.category), d.description || ""].concat(Object.keys(d.info || {}).map(function (k) { return k + " " + d.info[k]; })).join(" ").toLowerCase();
    return words.every(function (w) { return hay.indexOf(w) >= 0; });
  });
  hit.sort(function (x, y) { return String(x.expiry || "9999").localeCompare(String(y.expiry || "9999")); });
  var top = hit.slice(0, 8);
  var files = top.length ? filesListAll_() : {};
  var docs = top.map(function (d) {
    var n = d.expiry && validDate_(d.expiry) ? daysBetween_(ctx.today, d.expiry) : null;
    var fl = Object.keys(files).map(function (k) { return files[k].meta; })
      .filter(function (m) { return !m.trash && m.link && m.link.kind === "document" && m.link.id === d.id; })
      .slice(0, 5).map(function (m) { return { name: m.name, url: m.url }; });
    return { ref: d.id, title: d.title, category: docCatKey_(d.category), expiry: d.expiry || null, daysLeft: n,
      info: d.info || {}, note: d.description || "", link: d.link || "", files: fl };
  });
  var res = { ok: true, matched: hit.length, docs: docs, note: "ส่งไฟล์เป็นลิงก์ Drive (files[].url) ห้ามส่งไฟล์ลงแชท · daysLeft ติดลบ = หมดอายุแล้ว" };
  if (!hit.length) res.allTitles = all.slice(0, 30).map(function (d) { return d.title; });
  return res;
}
function toolUpdateDocument_(a, ctx) {
  var id = String(a.ref || "");
  var newCat = a.category ? docCatKey_(a.category) : null;
  if (newCat && docCatDef_(newCat).restricted) return { ok: false, error: "หมวดงาน/ราชการ ตั้งผ่าน Jack ไม่ได้ — ให้โอมตั้งในแอป" };
  var expiry = null;
  if (a.expiry != null) {
    if (a.expiry === "none" || a.expiry === "") expiry = "";
    else { var pd = parseDocDate_(a.expiry) || (validDate_(a.expiry) ? { date: a.expiry } : null); if (!pd) return { ok: false, error: "วันหมดอายุไม่ถูกต้อง (ใช้ YYYY-MM-DD หรือ none เพื่อลบ)" }; expiry = pd.date; }
  }
  var res = mutate_([{ id: "k.documents", def: [] }], function (G) {
    var f = arrFind_(G["k.documents"], id);
    if (!f) return { ok: false, error: "ไม่พบเอกสารนี้ (ใช้ ref จาก find_documents)" };
    var it = JSON.parse(JSON.stringify(f.chunk.value[f.index]));
    if (docRestricted_(it)) return { ok: false, error: "เอกสารหมวดงาน/ราชการ Jack แก้ไม่ได้ — ให้โอมแก้ในแอป" };
    if (a.title) it.title = clean_(a.title, 80);
    if (newCat) { it.category = newCat; it.open = false; }
    if (expiry !== null) it.expiry = expiry;
    if (a.infoKey && a.infoValue != null) {
      it.info = it.info || {};
      var k = clean_(a.infoKey, 30), v = clean_(a.infoValue, 120);
      if (v) it.info[k] = v; else delete it.info[k];
    }
    f.chunk.value[f.index] = it; f.chunk.dirty = true;
    return { ok: true, doc: { ref: it.id, title: it.title, category: docCatKey_(it.category), expiry: it.expiry || null, info: it.info || {} } };
  });
  return res;
}

// สรุปเช้า: เอกสารที่หมดอายุในอีก 30 หรือ 7 วันพอดี · หมวดงาน/ราชการ (ไม่ลับ) แจ้งแค่จำนวน ไม่บอกชื่อ
function docsExpiringForMorning_(ctx) {
  try {
    var out = [], hidden = 0;
    docsAll_().forEach(function (d) {
      if (!d.expiry || !validDate_(d.expiry)) return;
      var n = daysBetween_(ctx.today, d.expiry);
      if (n !== 30 && n !== 7) return;
      if (docRestricted_(d)) { hidden++; return; }
      out.push(docCatDef_(d.category).icon + " " + d.title + " — อีก " + n + " วัน (หมด " + thDateY_(d.expiry) + ")");
    });
    if (hidden) out.push("🔒 มีเอกสารงาน/ราชการ " + hidden + " ฉบับใกล้หมดอายุ ดูในแอป");
    return out.slice(0, 8);
  } catch (err) { noteError_(err); return []; }
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
