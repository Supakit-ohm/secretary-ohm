/* firesync-test.js — ทดสอบตรรกะซิงก์ Firestore ของข้อ 55 (ขั้นที่ 4: หลายเอกสารใต้ users/{uid}/parts) ด้วย Firebase ปลอม (จำลอง 2 เครื่อง: คอม + iPhone)
   ใช้ test-dashboard.html ที่ smoke-test.js สร้างไว้ (รัน smoke-test.js ก่อน) · วิธีรัน: node firesync-test.js */
const fs=require('fs'),{chromium}=require('playwright');
const results=[]; const check=(n,ok,d)=>{results.push(ok);console.log(`${ok?"  ok ":"  FAIL"} ${n}${d?"  — "+d:""}`);};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SERVER={docs:{},commits:0,docWrites:0,backups:[]};
const pages=[];
async function serverCommit(ops,external){
  SERVER.commits++; SERVER.docWrites+=ops.filter(o=>o.path.includes('/parts/')).length;
  if(!external) SERVER.lastOps=ops.map(o=>o.path);
  for(const x of ops){ if(x.op==='delete') delete SERVER.docs[x.path]; else if(x.op==='set') SERVER.docs[x.path]=x.data; else SERVER.docs[x.path]=Object.assign({},SERVER.docs[x.path]||{},x.data); }
  const all=SERVER.docs, changed=ops.map(o=>o.path);
  for(const q of pages) q.evaluate(([a,c])=>window.__fsDeliver&&window.__fsDeliver(a,false,c),[all,changed]).catch(()=>{});
}
const DRIVE_DATA=JSON.stringify({projects:[{id:"dp",title:"ข้อมูลจากไดรฟ์",status:"active",measureType:"manual",milestones:[]}],tasks:[],finance:{income:[],expenses:[]}});
// ใช้ SEED ชุดเดียวกับ smoke-test.js
const LOCAL=(()=>{const t=fs.readFileSync('smoke-test.js','utf8');const a=t.indexOf('const SEED=')+11,e=t.indexOf('\nconst CDN=');return eval('('+t.slice(a,e).trim().replace(/;$/,'')+')');})();

const FAKE_APP=`export function initializeApp(c){return {c};}`;
const FAKE_AUTH=`
let cb=null,user=null;
try{user=JSON.parse(localStorage.getItem("fake-user")||"null");}catch(e){}
export const indexedDBLocalPersistence={},browserLocalPersistence={};
export function initializeAuth(){return {};}
export const GoogleAuthProvider={credential:(i,a)=>({a})};
export function onAuthStateChanged(a,f){cb=f;setTimeout(()=>f(user),0);return()=>{};}
export async function signInWithCredential(a,c){user={uid:"u1",email:window.__fakeEmail||"supakit6906@gmail.com"};localStorage.setItem("fake-user",JSON.stringify(user));cb&&cb(user);return {user};}
export async function signOut(){user=null;localStorage.removeItem("fake-user");cb&&cb(null);}
`;
const FAKE_FS=`
const subs={};
function snapDoc(path,data,pending){return {id:path.split("/").pop(),exists:()=>!!data,data:()=>data,metadata:{hasPendingWrites:!!pending,fromCache:false}};}
function snapCol(path,all,pending){const docs=Object.keys(all).filter(p=>p.startsWith(path+"/")&&p.slice(path.length+1).indexOf("/")<0).sort().map(p=>snapDoc(p,all[p],false));return {empty:!docs.length,docs,size:docs.length,forEach:f=>docs.forEach(f),metadata:{hasPendingWrites:!!pending,fromCache:false}};}
window.__fsDeliver=(all,pending,changed)=>{for(const path in subs) subs[path].forEach(s=>{ if(s.kind==="doc"){ if(changed.includes(path)) s.next(snapDoc(path,all[path]||null,pending)); } else if(changed.some(c=>c.startsWith(path+"/"))) s.next(snapCol(path,all,pending)); });};
function applyOps(all,ops){const o=Object.assign({},all);ops.forEach(x=>{ if(x.op==="delete") delete o[x.path]; else if(x.op==="set") o[x.path]=x.data; else o[x.path]=Object.assign({},o[x.path]||{},x.data); });return o;}
async function commit(ops){ const all=await window.__srvAll(); window.__fsDeliver(applyOps(all,ops),true,ops.map(x=>x.path)); await window.__srvCommit(ops); }
export function initializeFirestore(){return {};}
export async function disableNetwork(){} export async function enableNetwork(){}
export function persistentLocalCache(){return {};} export function persistentMultipleTabManager(){return {};}
export function collection(db,...p){return {__col:p.join("/")};}
export function doc(a,...p){ if(a&&a.__col) return [a.__col,...p].join("/"); return p.join("/"); }
export function serverTimestamp(){return "TS";}
export function onSnapshot(ref,opts,next,err){ if(typeof opts==="function"){err=next;next=opts;} const isCol=!!(ref&&ref.__col); const path=isCol?ref.__col:ref; const s={kind:isCol?"col":"doc",next}; (subs[path]=subs[path]||[]).push(s); window.__srvAll().then(all=>next(isCol?snapCol(path,all,false):snapDoc(path,all[path]||null,false))); return()=>{subs[path]=subs[path].filter(x=>x!==s);}; }
export async function getDocFromServer(ref){ const all=await window.__srvAll(); return snapDoc(ref,all[ref]||null,false); }
export async function setDoc(ref,payload,opt){ await commit([{path:ref,op:opt&&opt.merge?"merge":"set",data:payload}]); }
export function writeBatch(){ const ops=[]; return {set:(ref,d)=>ops.push({path:ref,op:"set",data:d}),delete:ref=>ops.push({path:ref,op:"delete"}),commit:()=>commit(ops)}; }
`;
async function device(browser,name,{local,user,failFire}={}){
  const ctx=await browser.newContext({viewport:{width:1280,height:900}});
  await ctx.addInitScript(({local,user})=>{
    if(!sessionStorage.getItem("__init")){ sessionStorage.setItem("__init","1");
      if(local) localStorage.setItem("secretary-dashboard-v1",local);
      if(user) localStorage.setItem("fake-user",JSON.stringify(user));
      localStorage.setItem("secretary-drive-file-id","legacy"); }
    window.google={accounts:{oauth2:{initTokenClient:(o)=>({requestAccessToken:()=>setTimeout(()=>o.callback({access_token:"tok",expires_in:3600}),10)})}}};
  },{local:local?JSON.stringify(local):null,user});
  await ctx.route(/gstatic\.com\/firebasejs\/.*firebase-app\.js/,r=>r.fulfill({contentType:"text/javascript",body:FAKE_APP}));
  await ctx.route(/gstatic\.com\/firebasejs\/.*firebase-auth\.js/,r=>r.fulfill({contentType:"text/javascript",body:FAKE_AUTH}));
  await ctx.route(/gstatic\.com\/firebasejs\/.*firebase-firestore\.js/,r=>r.fulfill({contentType:"text/javascript",body:FAKE_FS}));
  if(failFire) await ctx.route(/gstatic\.com\/firebasejs\//,r=>r.abort());   // route ที่ลงทะเบียนทีหลังชนะ
  await ctx.route(/accounts\.google\.com/,r=>r.fulfill({contentType:"text/javascript",body:""}));
  await ctx.route(/googleapis\.com\/(upload\/)?drive/,async r=>{
    const u=r.request().url();
    if(u.includes("upload/drive")){ SERVER.backups.push(u); return r.fulfill({contentType:"application/json",body:'{"id":"bk"}'}); }
    if(u.includes("alt=media")) return r.fulfill({contentType:"application/json",body:DRIVE_DATA});
    if(u.includes("folder")) return r.fulfill({contentType:"application/json",body:'{"files":[{"id":"fold"}]}'});
    return r.fulfill({contentType:"application/json",body:'{"files":[{"id":"datafile"}]}'});
  });
  await ctx.route(/fonts\.googleapis|cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome/,r=>r.fulfill({body:""}));
  const p=await ctx.newPage(); p.__name=name; p.errs=[]; p.dialogs=0; p.on('dialog',()=>p.dialogs++);
  p.on('pageerror',e=>p.errs.push(e.message));
  p.on('console',m=>{ if(m.type()==='error'&&!/Failed to load resource/.test(m.text())) p.errs.push(m.text()); });
  await p.exposeFunction('__srvAll',()=>SERVER.docs);
  await p.exposeFunction('__srvCommit',async ops=>serverCommit(ops));
  pages.push(p);
  await p.goto('file://'+process.cwd()+'/test-dashboard.html');
  await p.waitForSelector('.topbar',{timeout:30000});
  await sleep(800);
  return p;
}
const status=p=>p.evaluate(()=>window.__syncStatus);
const LEGACY="users/u1/app/data", META="users/u1/app/meta", PARTS="users/u1/parts/";
const serverParts=()=>{const o={};for(const k in SERVER.docs) if(k.startsWith(PARTS)) o[k.slice(PARTS.length)]=SERVER.docs[k].json;return o;};
const serverData=p=>p.evaluate(x=>SecretaryParts.assemble(x),serverParts());
// เทียบข้อมูลในเครื่องกับบนเซิร์ฟเวอร์ในรูปแบบเอกสาร (ลำดับรายการข้ามเดือนอาจต่างจากต้นฉบับได้ตามที่ออกแบบ)
const eqServer=(p,text)=>p.evaluate(([x,t])=>SecretaryParts.same(SecretaryParts.split(JSON.parse(t)),x),[serverParts(),text]);
const localOf=p=>p.evaluate(()=>localStorage.getItem("secretary-dashboard-v1"));
const edit=(p,fn,arg)=>p.evaluate(([f,a])=>{const d=JSON.parse(localStorage.getItem("secretary-dashboard-v1"));(new Function("d","a",f))(d,a);return window.storage.set("secretary-dashboard-v1",JSON.stringify(d));},[fn,arg]);
async function logout(p){ p.once('dialog',d=>d.accept()); await p.click('.acct-btn'); await sleep(200);
  if(!(await p.locator('.acct-item:has-text("ออกจากระบบ")').count())) await p.click('.acct-btn');
  await p.click('.acct-item:has-text("ออกจากระบบ")'); await sleep(500); }
(async()=>{
  const b=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{});
  console.log("\n[1] คอม: ยังไม่ล็อกอิน");
  const pc=await device(b,"pc",{local:LOCAL});
  let s=await status(pc);
  check("FireSync โหลดขึ้น + สถานะ signedOut",s&&s.phase==="signedOut",s&&s.phase);
  check("มี SecretaryParts",await pc.evaluate(()=>!!window.SecretaryParts));
  await pc.click('.acct-btn');
  check("เมนูโชว์ปุ่มเข้าสู่ระบบ Google",await pc.locator('.acct-item:has-text("เข้าสู่ระบบ Google")').count()===1);
  check("หัวเมนูเรียก 'คุณโอม'",(await pc.textContent('.acct-pop')).includes("คุณโอม"));
  const c0=SERVER.commits;
  await pc.evaluate(()=>window.storage.set("secretary-dashboard-v1",localStorage.getItem("secretary-dashboard-v1")));
  await sleep(1200);
  check("ยังไม่ล็อกอิน → ไม่เขียนขึ้น Firestore",SERVER.commits===c0);
  await pc.evaluate(()=>localStorage.removeItem("secretary-unsynced-since"));   // จำลองว่าคอมเครื่องนี้ซิงก์กับเอกสารเดิมอยู่แล้ว

  console.log("\n[2] คอม: ล็อกอิน (มีเอกสารเดียวแบบเดิม app/data ตรงกับเครื่อง) → ย้ายเป็นหลายเอกสาร ไม่ถามอะไร");
  const pcBefore=await localOf(pc);
  SERVER.docs[LEGACY]={json:pcBefore,by:"old",at:"TS",size:pcBefore.length};
  let dlg=null; const onDlg=async d=>{dlg=d.message(); await d.dismiss();}; pc.once('dialog',onDlg);
  await pc.click('.acct-item:has-text("เข้าสู่ระบบ Google")');
  await sleep(1500);
  pc.off('dialog',onDlg);
  check("ไม่ถามอะไร",!dlg,dlg&&dlg.split("\n")[0]);
  const ids=Object.keys(serverParts());
  check("แยกเป็นหลายเอกสาร",ids.length>=15,ids.length+" เอกสาร");
  check("รายจ่ายแยกตามเดือน (fg.expenses.2026-07 / 2026-06)",ids.includes("fg.expenses.2026-07")&&ids.includes("fg.expenses.2026-06"));
  check("มี k.finance / k.tasks / k.projects / f.cryptoHoldings",["k.finance","k.tasks","k.projects","f.cryptoHoldings"].every(i=>ids.includes(i)));
  check("ข้อมูลบนเซิร์ฟเวอร์ = ข้อมูลในเครื่อง",await eqServer(pc,await localOf(pc)));
  check("ข้อมูลในเครื่องไม่ถูกเปลี่ยน",(await localOf(pc))===pcBefore);
  check("เอกสารเดิม app/data ไม่ถูกแตะ (เก็บเป็นสำรอง)",SERVER.docs[LEGACY].json===pcBefore&&SERVER.docs[LEGACY].by==="old");
  check("meta: layout=parts-v1",SERVER.docs[META]&&SERVER.docs[META].layout==="parts-v1");
  s=await status(pc);
  check("สถานะ synced + อีเมลถูก",s.phase==="synced"&&s.user.email==="supakit6906@gmail.com",s.phase+" / "+s.text);
  check("สำรองขึ้น Drive อัตโนมัติรอบแรก (ยังไม่เคยสำรอง) → เก็บวันที่ใน meta",SERVER.backups.length===1&&!!SERVER.docs[META].lastDriveBackupAt);
  check("ไม่มี DriveSync/#driveConnectBtn/#driveStatus",await pc.evaluate(()=>!window.DriveSync&&!document.getElementById("driveConnectBtn")&&!document.getElementById("driveStatus")));
  check("ปุ่ม Export/Import ยังอยู่ (ซ่อน ให้เมนู O เรียก)",await pc.evaluate(()=>!!document.getElementById("exportJsonBtn")&&!!document.getElementById("importJsonBtn")));
  check("ล้าง key secretary-drive-file-id เดิม",await pc.evaluate(()=>!localStorage.getItem("secretary-drive-file-id")));

  console.log("\n[3] iPhone: ล็อกอินค้างไว้แล้ว ข้อมูลในเครื่องเป็นค่าตั้งต้น → ต้องได้ข้อมูลจริงจากหลายเอกสาร");
  const ph=await device(b,"iphone",{user:{uid:"u1",email:"supakit6906@gmail.com"}});
  await sleep(800);
  check("iPhone ได้ข้อมูลเดียวกับเซิร์ฟเวอร์",await eqServer(ph,await localOf(ph)));
  check("iPhone ไม่ถามอะไร และไม่เอาข้อมูลตั้งต้นทับคลาวด์",await eqServer(pc,await localOf(pc))&&ph.dialogs===0,"dialogs="+ph.dialogs);
  check("iPhone ไม่ย้ายซ้ำ (ไม่อ่าน app/data)",SERVER.docs[META].migratedBy===(await pc.evaluate(()=>sessionStorage.getItem("secretary-client-id"))));
  check("เก็บสำเนาข้อมูลเดิมของ iPhone ไว้ก่อนทับ",await ph.evaluate(()=>!!localStorage.getItem("secretary-pre-firestore-backup")));
  check("รายจ่ายครบทุกรายการ",(await ph.evaluate(()=>JSON.parse(localStorage.getItem("secretary-dashboard-v1")).finance.expenses.length))===LOCAL.finance.expenses.length);
  check("เมนู iPhone ไม่ขึ้นวันสำรองซ้ำ (อ่านจาก meta)",SERVER.backups.length===1);
  await ph.click('.nav-pill-btn:has-text("Tracker")').catch(()=>{});
  await sleep(500);
  check("หน้าจอ iPhone แสดงโปรเจกต์ของจริง",(await ph.textContent('body')).includes("โปรเจกต์กำหนดเอง"));

  console.log("\n[4] iPhone แก้โปรเจกต์ → เขียนแค่เอกสาร k.projects · คอมเห็นเองทันที · ไม่มี echo loop");
  await pc.click('.nav-pill-btn:has-text("Tracker")').catch(()=>{});
  await sleep(300);
  let w0=SERVER.commits, d0=SERVER.docWrites;
  await edit(ph,'d.projects[0].title="ชื่อใหม่จากมือถือ"');
  await sleep(2000);
  check("iPhone commit 1 ครั้ง",SERVER.commits===w0+1,`commits +${SERVER.commits-w0}`);
  check("เขียนแค่ 1 เอกสาร (k.projects)",SERVER.docWrites===d0+1&&SERVER.lastOps.join()===PARTS+"k.projects",SERVER.lastOps&&SERVER.lastOps.join());
  check("คอม re-render เป็นชื่อใหม่",(await pc.textContent('body')).includes("ชื่อใหม่จากมือถือ"));
  await sleep(2000);
  check("ไม่มีการเขียนวนกลับ (echo loop)",SERVER.commits===w0+1,`commits +${SERVER.commits-w0}`);

  console.log("\n[5] แก้ถี่ๆ → รวมเป็นการเขียนครั้งเดียว (debounce)");
  w0=SERVER.commits;
  for(let i=0;i<5;i++){ await edit(pc,'d.projects[0].title="แก้ครั้งที่ "+a',i); await sleep(100); }
  await sleep(2000);
  check("5 การแก้ → 1 การเขียน",SERVER.commits===w0+1,`commits +${SERVER.commits-w0}`);
  check("iPhone ได้ค่าล่าสุด",(await ph.evaluate(()=>JSON.parse(localStorage.getItem("secretary-dashboard-v1")).projects[0].title))==="แก้ครั้งที่ 4");

  console.log("\n[5b] เพิ่มรายจ่ายเดือน 2026-07 → เขียนแค่เอกสารเดือนนั้น");
  d0=SERVER.docWrites;
  await edit(ph,'d.finance.expenses.push({id:"eNew",date:"2026-07-20",amount:-99,category:"อาหาร",memo:"ทดสอบแยกเดือน",source:"manual"})');
  await sleep(2000);
  check("เขียนแค่ fg.expenses.2026-07",SERVER.docWrites===d0+1&&SERVER.lastOps.join()===PARTS+"fg.expenses.2026-07",SERVER.lastOps.join());
  check("คอมได้รายจ่ายใหม่",(await localOf(pc)).includes("ทดสอบแยกเดือน"));
  d0=SERVER.docWrites;
  await edit(pc,'d.finance.expenses.push({id:"eOct",date:"2026-10-01",amount:-50,category:"อาหาร",memo:"เดือนใหม่",source:"manual"})');
  await sleep(2000);
  check("เดือนใหม่ → สร้างเอกสาร fg.expenses.2026-10",!!SERVER.docs[PARTS+"fg.expenses.2026-10"]&&SERVER.docWrites===d0+1);
  await edit(pc,'d.finance.expenses=d.finance.expenses.filter(e=>e.id!=="eOct")');
  await sleep(2000);
  check("ลบรายการสุดท้ายของเดือน → ลบเอกสารเดือนนั้นทิ้ง",!SERVER.docs[PARTS+"fg.expenses.2026-10"]);
  check("iPhone ไม่มีรายการที่ลบแล้ว",!(await localOf(ph)).includes("เดือนใหม่"));

  console.log("\n[5c] แก้คนละส่วนพร้อมกัน 2 เครื่อง → รวมกันได้ ไม่ทับกัน");
  await Promise.all([edit(pc,'d.projects[0].title="คอมแก้ชื่อโปรเจกต์"'),edit(ph,'d.tasks[0].title="มือถือแก้ชื่องาน"')]);
  await sleep(3000);
  const both=t=>t.includes("คอมแก้ชื่อโปรเจกต์")&&t.includes("มือถือแก้ชื่องาน");
  check("เซิร์ฟเวอร์มีทั้ง 2 อย่าง",both(JSON.stringify(await serverData(pc))));
  check("คอมมีทั้ง 2 อย่าง",both(await localOf(pc)));
  check("iPhone มีทั้ง 2 อย่าง",both(await localOf(ph)));

  console.log("\n[5d] มีคนอื่นเขียนเอกสารเข้ามาตรงๆ (แบบที่บอต LINE จะทำ) → 2 เครื่องเห็น + ไม่วนเขียนไม่จบ");
  await serverCommit([{path:PARTS+"fg.expenses.2026-09",op:"set",data:{json:JSON.stringify([{id:"bot1",date:"2026-09-28",amount:-120,category:"อาหาร",memo:"ข้าวมันไก่จากบอต",source:"line"}],null,1)}}],true);
  await sleep(2500);
  check("คอมเห็นรายการจากบอต",(await localOf(pc)).includes("ข้าวมันไก่จากบอต"));
  check("iPhone เห็นรายการจากบอต",(await localOf(ph)).includes("ข้าวมันไก่จากบอต"));
  w0=SERVER.commits; await sleep(2500);
  check("นิ่งแล้ว ไม่มีการเขียนต่อเนื่อง",SERVER.commits===w0,`commits +${SERVER.commits-w0}`);
  check("คอม = iPhone = เซิร์ฟเวอร์",await eqServer(pc,await localOf(pc))&&await eqServer(ph,await localOf(ph)));

  console.log("\n[5e] ข้อมูลใหญ่ (ปกหนังสือ data URI) → ตัดเป็นหลายท่อน ไม่มีเอกสารเกินเพดาน");
  await edit(pc,'for(let i=0;i<30;i++) d.bookQueue.push({id:"big"+i,title:"เล่มใหญ่ "+i,status:"queue",coverUrl:"data:image/jpeg;base64,"+"A".repeat(30000)})');
  await sleep(2500);
  const bigIds=Object.keys(serverParts()).filter(i=>i.startsWith("k.bookQueue"));
  check("bookQueue ถูกตัดเป็นหลายท่อน",bigIds.length>=2,bigIds.join(","));
  check("ทุกเอกสาร ≤ 400KB",Object.values(serverParts()).every(j=>Buffer.byteLength(j)<=400*1024));
  check("iPhone ได้ครบ 30 เล่ม",(await ph.evaluate(()=>JSON.parse(localStorage.getItem("secretary-dashboard-v1")).bookQueue.filter(b=>b.id.startsWith("big")).length))===30);
  await edit(pc,'d.bookQueue=d.bookQueue.filter(b=>!b.id.startsWith("big"))');
  await sleep(2500);
  check("ลบออก → ท่อนที่เกินถูกลบทิ้ง",Object.keys(serverParts()).filter(i=>i.startsWith("k.bookQueue")).length===1);

  console.log("\n[6] Import JSON ตอนล็อกอินอยู่ → flush ขึ้น Firestore ก่อน reload");
  w0=SERVER.commits;
  await pc.evaluate(async()=>{const d=JSON.parse(localStorage.getItem("secretary-dashboard-v1"));d.projects[0].title="นำเข้าแล้ว";await window.storage.set("secretary-dashboard-v1",JSON.stringify(d));await window.FireSync.flush(3000);});
  check("flush เขียนทันทีไม่รอ debounce",SERVER.commits===w0+1&&(await serverData(pc)).projects[0].title==="นำเข้าแล้ว");

  console.log("\n[7] สำรอง Drive ด้วยมือจากเมนู");
  const bk0=SERVER.backups.length;
  await pc.click('.acct-btn').catch(()=>{}); await sleep(200);
  if(!(await pc.locator('.acct-pop').count())) await pc.click('.acct-btn');
  check("เมนูโชว์อีเมล + วันสำรองล่าสุด",(await pc.textContent('.acct-pop')).includes("supakit6906@gmail.com")&&(await pc.textContent('.acct-pop')).includes("สำรองล่าสุดวันนี้"));
  await pc.click('.acct-item:has-text("สำรองขึ้น Google Drive")');
  await sleep(800);
  check("อัปโหลด backup เพิ่ม 1 ไฟล์",SERVER.backups.length===bk0+1);

  console.log("\n[8] ออกจากระบบ");
  pc.once('dialog',d=>d.accept());
  await pc.click('.acct-item:has-text("ออกจากระบบ")');
  await sleep(500);
  s=await status(pc);
  check("สถานะกลับเป็น signedOut",s.phase==="signedOut");
  w0=SERVER.commits;
  await edit(pc,'d.projects[0].title="เพิ่มตอนยังไม่ล็อกอิน"');
  await sleep(1200);
  check("ออกแล้วไม่เขียนขึ้น Firestore",SERVER.commits===w0);
  check("ตั้ง flag ว่ามีของยังไม่ซิงก์",await pc.evaluate(()=>!!localStorage.getItem("secretary-unsynced-since")));
  check("ขึ้นแถบเตือน 'ยังไม่ได้ล็อกอิน — ข้อมูลไม่ซิงก์'",await pc.locator('.sync-warn').count()===1);

  console.log("\n[8b] ล็อกอินกลับหลังแก้ตอนหลุด → ต้องถาม ไม่ทับเงียบ · เลือก Cancel = ใช้ของเครื่องนี้");
  let dlg2=null; pc.once('dialog',async d=>{dlg2=d.message(); await d.dismiss();});
  await pc.click('.sync-warn');
  await sleep(1500);
  check("ถามก่อนทับ",dlg2&&dlg2.includes("ยังไม่เคยขึ้นคลาวด์"));
  check("ของที่เพิ่มตอนหลุดขึ้น Firestore",(await serverData(pc)).projects[0].title==="เพิ่มตอนยังไม่ล็อกอิน");
  check("iPhone ได้ของนั้นด้วย",(await ph.evaluate(()=>JSON.parse(localStorage.getItem("secretary-dashboard-v1")).projects[0].title))==="เพิ่มตอนยังไม่ล็อกอิน");
  check("แถบเตือนหายหลังล็อกอิน",await pc.locator('.sync-warn').count()===0);
  check("flag ถูกล้าง",await pc.evaluate(()=>!localStorage.getItem("secretary-unsynced-since")));

  console.log("\n[8c] เลือก OK = ใช้คลาวด์ → ของเครื่องนี้ถูกเก็บสำรอง");
  await logout(pc);
  await edit(pc,'d.projects[0].title="ของเครื่องที่จะทิ้ง"');
  let dlg3=null; pc.once('dialog',async d=>{dlg3=d.message(); await d.accept();});
  await pc.click('.sync-warn'); await sleep(1500);
  check("ถามอีกครั้ง",!!dlg3);
  check("ใช้ของคลาวด์",(await pc.evaluate(()=>JSON.parse(localStorage.getItem("secretary-dashboard-v1")).projects[0].title))==="เพิ่มตอนยังไม่ล็อกอิน");
  check("ของเครื่องเก็บไว้ใน pre-firestore-backup",await pc.evaluate(()=>(localStorage.getItem("secretary-pre-firestore-backup")||"").includes("ของเครื่องที่จะทิ้ง")));
  await logout(pc);

  console.log("\n[9] บัญชีอื่นล็อกอิน → ถูกปฏิเสธ");
  const other=await device(b,"other",{});
  await other.evaluate(()=>{window.__fakeEmail="someone@gmail.com";});
  await other.click('.acct-btn'); await other.click('.acct-item:has-text("เข้าสู่ระบบ Google")');
  await sleep(800);
  s=await status(other);
  check("บัญชีอื่น → ถูกออกจากระบบ + บอกว่าไม่มีสิทธิ์",s.phase==="signedOut"&&!(s.user)&&s.text.includes("ไม่มีสิทธิ์"),s.phase+" "+s.text);

  console.log("\n[10] โหลด Firebase ไม่ขึ้น (ออฟไลน์ครั้งแรก) → แอปยังใช้ได้ + เมนูมีปุ่มโหลดใหม่");
  const off=await device(b,"offline",{local:LOCAL,failFire:true});
  await off.click('.acct-btn'); await sleep(200);
  const offTxt=await off.textContent('.acct-pop');
  check("ไม่มี FireSync + สถานะบอกว่าข้อมูลอยู่ในเครื่อง",await off.evaluate(()=>!window.FireSync)&&offTxt.includes("ข้อมูลอยู่ในเครื่องนี้"));
  check("มีปุ่มโหลดหน้าใหม่ · ไม่มีปุ่มเชื่อมต่อ Drive",offTxt.includes("โหลดหน้าใหม่")&&!offTxt.includes("เชื่อมต่อ Google Drive"));
  off.errs=off.errs.filter(e=>!/firebasejs|Failed to fetch dynamically imported module|ERR_FAILED/.test(e));

  console.log("\n[11] เครื่องใหม่ย้ายจากเอกสารเดิมที่ต่างจากในเครื่อง (ไม่มีของค้าง) → ใช้ของคลาวด์ ไม่ถาม · ไม่สำรองซ้ำถ้าเพิ่งสำรอง");
  for(const p of [pc,ph,other,off]){ pages.splice(pages.indexOf(p),1); await p.context().close(); }
  const LEG=JSON.parse(JSON.stringify(LOCAL)); LEG.projects[0].title="ข้อมูลจากเอกสารเดิม"; LEG.journal=[{id:"j1",date:"2025-12-31",entry:"ปีเก่า"},{id:"j2",date:"2026-01-01",entry:"ปีใหม่"}];
  const recent=new Date(Date.now()-86400000).toISOString();
  SERVER.docs={[LEGACY]:{json:JSON.stringify(LEG),lastDriveBackupAt:recent,lastDriveBackupFile:"backup-old.json"}};
  const bk1=SERVER.backups.length;
  const tab=await device(b,"tablet",{user:{uid:"u1",email:"supakit6906@gmail.com"}});
  await sleep(1500);
  check("ไม่ถามอะไร",tab.dialogs===0);
  check("ใช้ข้อมูลจากเอกสารเดิม",(await tab.evaluate(()=>JSON.parse(localStorage.getItem("secretary-dashboard-v1")).projects[0].title))==="ข้อมูลจากเอกสารเดิม");
  check("Journal แยกตามปี (g.journal.2025 / g.journal.2026)",!!SERVER.docs[PARTS+"g.journal.2025"]&&!!SERVER.docs[PARTS+"g.journal.2026"]);
  check("ส่งต่อวันสำรองล่าสุดไป meta",SERVER.docs[META]&&SERVER.docs[META].lastDriveBackupAt===recent);
  check("ไม่สำรองซ้ำ (เพิ่งสำรองเมื่อวาน)",SERVER.backups.length===bk1);
  check("เซิร์ฟเวอร์ = เครื่อง",await eqServer(tab,await localOf(tab)));

  for(const p of pages) if(p.errs.length) console.log("ERR",p.__name,p.errs.slice(0,5));
  const errCount=pages.reduce((a,p)=>a+p.errs.length,0)+[pc,ph,other,off].reduce((a,p)=>a+p.errs.length,0);
  console.log(`\n════ ผ่าน ${results.filter(Boolean).length}/${results.length} ${errCount?"· RUNTIME ERRORS "+errCount:"· NO RUNTIME ERRORS"}`);
  await b.close();
})();
