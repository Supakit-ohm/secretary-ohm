/* firesync-test.js — ทดสอบตรรกะซิงก์ Firestore ของข้อ 55 ด้วย Firebase ปลอม (จำลอง 2 เครื่อง: คอม + iPhone)
   ใช้ test-dashboard.html ที่ smoke-test.js สร้างไว้ (รัน smoke-test.js ก่อน) · วิธีรัน: node firesync-test.js */
const fs=require('fs'),{chromium}=require('playwright');
const results=[]; const check=(n,ok,d)=>{results.push(ok);console.log(`${ok?"  ok ":"  FAIL"} ${n}${d?"  — "+d:""}`);};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SERVER={docs:{},writes:0,backups:[]};
const pages=[];
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
window.__fsDeliver=(path,data,pending)=>{(subs[path]||[]).forEach(f=>f({exists:()=>!!data,data:()=>data,metadata:{hasPendingWrites:!!pending,fromCache:false}}));};
export function initializeFirestore(){return {};}
export async function disableNetwork(){} export async function enableNetwork(){}
export function persistentLocalCache(){return {};} export function persistentMultipleTabManager(){return {};}
export function doc(db,...p){return p.join("/");}
export function serverTimestamp(){return "TS";}
export function onSnapshot(ref,opts,next,err){(subs[ref]=subs[ref]||[]).push(next);window.__srvGet(ref).then(d=>next({exists:()=>!!d,data:()=>d,metadata:{hasPendingWrites:false,fromCache:false}}));return()=>{subs[ref]=subs[ref].filter(f=>f!==next);};}
export async function setDoc(ref,payload,opt){const cur=await window.__srvGet(ref);const merged=Object.assign({},cur||{},payload);window.__fsDeliver(ref,merged,true);await window.__srvSet(ref,payload);}
`;
async function device(browser,name,{local,user}={}){
  const ctx=await browser.newContext({viewport:{width:1280,height:900}});
  await ctx.addInitScript(({local,user})=>{
    if(!sessionStorage.getItem("__init")){ sessionStorage.setItem("__init","1");
      if(local) localStorage.setItem("secretary-dashboard-v1",local);
      if(user) localStorage.setItem("fake-user",JSON.stringify(user)); }
    window.google={accounts:{oauth2:{initTokenClient:(o)=>({requestAccessToken:()=>setTimeout(()=>o.callback({access_token:"tok",expires_in:3600}),10)})}}};
  },{local:local?JSON.stringify(local):null,user});
  await ctx.route(/gstatic\.com\/firebasejs\/.*firebase-app\.js/,r=>r.fulfill({contentType:"text/javascript",body:FAKE_APP}));
  await ctx.route(/gstatic\.com\/firebasejs\/.*firebase-auth\.js/,r=>r.fulfill({contentType:"text/javascript",body:FAKE_AUTH}));
  await ctx.route(/gstatic\.com\/firebasejs\/.*firebase-firestore\.js/,r=>r.fulfill({contentType:"text/javascript",body:FAKE_FS}));
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
  await p.exposeFunction('__srvGet',path=>SERVER.docs[path]||null);
  await p.exposeFunction('__srvSet',async(path,payload)=>{
    SERVER.writes++; SERVER.docs[path]=Object.assign({},SERVER.docs[path]||{},payload);
    for(const q of pages) q.evaluate(([pa,d])=>window.__fsDeliver&&window.__fsDeliver(pa,d,false),[path,SERVER.docs[path]]).catch(()=>{});
  });
  pages.push(p);
  await p.goto('file://'+process.cwd()+'/test-dashboard.html');
  await p.waitForSelector('.topbar',{timeout:30000});
  await sleep(800);
  return p;
}
const status=p=>p.evaluate(()=>window.__syncStatus);
const DOC="users/u1/app/data";
(async()=>{
  const b=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{});
  console.log("\n[1] คอม: ยังไม่ล็อกอิน");
  const pc=await device(b,"pc",{local:LOCAL});
  let s=await status(pc);
  check("FireSync โหลดขึ้น + สถานะ signedOut",s&&s.phase==="signedOut",s&&s.phase);
  await pc.click('.acct-btn');
  check("เมนูโชว์ปุ่มเข้าสู่ระบบ Google",await pc.locator('.acct-item:has-text("เข้าสู่ระบบ Google")').count()===1);
  const writesBefore=SERVER.writes;
  await pc.evaluate(()=>window.storage.set("secretary-dashboard-v1",localStorage.getItem("secretary-dashboard-v1")));
  await sleep(1200);
  check("ยังไม่ล็อกอิน → ไม่เขียนขึ้น Firestore",SERVER.writes===writesBefore);

  console.log("\n[2] คอม: ล็อกอินครั้งแรก → ย้ายข้อมูล (มี data.json บน Drive ต่างจากในเครื่อง → เลือก Cancel = ใช้ในเครื่อง)");
  let dlg=null; pc.once('dialog',async d=>{dlg=d.message(); await d.dismiss();});
  await pc.click('.acct-item:has-text("เข้าสู่ระบบ Google")');
  await sleep(1500);
  check("ถามเลือกชุดข้อมูล Drive vs เครื่องนี้",dlg&&dlg.includes("ย้ายข้อมูลขึ้น Firestore"),dlg&&dlg.split("\n")[2]);
  const pcLocal=await pc.evaluate(()=>localStorage.getItem("secretary-dashboard-v1"));
  check("เอกสาร Firestore = ข้อมูลในเครื่อง",SERVER.docs[DOC]&&SERVER.docs[DOC].json===pcLocal);
  s=await status(pc);
  check("สถานะ synced + อีเมลถูก",s.phase==="synced"&&s.user.email==="supakit6906@gmail.com",s.phase+" / "+s.text);
  check("สำรองขึ้น Drive อัตโนมัติรอบแรก (ยังไม่เคยสำรอง)",SERVER.backups.length===1&&!!SERVER.docs[DOC].lastDriveBackupAt);
  check("__fireSignedIn → Drive แบบเดิมหยุด push",await pc.evaluate(()=>window.__fireSignedIn===true));

  console.log("\n[3] iPhone: ล็อกอินค้างไว้แล้ว ข้อมูลในเครื่องเป็นค่าตั้งต้น → ต้องได้ข้อมูลจริงจาก Firestore");
  const ph=await device(b,"iphone",{user:{uid:"u1",email:"supakit6906@gmail.com"}});
  await sleep(800);
  const phLocal=await ph.evaluate(()=>localStorage.getItem("secretary-dashboard-v1"));
  check("iPhone localStorage = Firestore",phLocal===SERVER.docs[DOC].json);
  check("iPhone ไม่ถามอะไร และไม่เอาข้อมูลตั้งต้นทับคลาวด์",SERVER.docs[DOC].json===pcLocal&&ph.dialogs===0,"dialogs="+ph.dialogs);
  check("เก็บสำเนาข้อมูลเดิมของ iPhone ไว้ก่อนทับ",await ph.evaluate(()=>!!localStorage.getItem("secretary-pre-firestore-backup")));
  await ph.click('.nav-pill-btn:has-text("Tracker")').catch(()=>{});
  await sleep(500);
  check("หน้าจอ iPhone แสดงโปรเจกต์ของจริง",(await ph.textContent('body')).includes("โปรเจกต์กำหนดเอง"));

  console.log("\n[4] iPhone แก้ข้อมูล → คอมเห็นเองทันที (ไม่ต้องรีเฟรช) + ไม่มี echo loop");
  await pc.click('.nav-pill-btn:has-text("Tracker")').catch(()=>{});
  await sleep(300);
  const w0=SERVER.writes;
  await ph.evaluate(()=>{const d=JSON.parse(localStorage.getItem("secretary-dashboard-v1"));d.projects[0].title="ชื่อใหม่จากมือถือ";return window.storage.set("secretary-dashboard-v1",JSON.stringify(d));});
  await sleep(2000);
  check("iPhone เขียนขึ้น Firestore 1 ครั้ง",SERVER.writes===w0+1,`writes +${SERVER.writes-w0}`);
  check("คอม re-render เป็นชื่อใหม่",(await pc.textContent('body')).includes("ชื่อใหม่จากมือถือ"));
  await sleep(2000);
  check("ไม่มีการเขียนวนกลับ (echo loop)",SERVER.writes===w0+1,`writes +${SERVER.writes-w0}`);

  console.log("\n[5] แก้ถี่ๆ → รวมเป็นการเขียนครั้งเดียว (debounce)");
  const w1=SERVER.writes;
  for(let i=0;i<5;i++){ await pc.evaluate(i=>{const d=JSON.parse(localStorage.getItem("secretary-dashboard-v1"));d.projects[0].title="แก้ครั้งที่ "+i;return window.storage.set("secretary-dashboard-v1",JSON.stringify(d));},i); await sleep(100); }
  await sleep(2000);
  check("5 การแก้ → 1 การเขียน",SERVER.writes===w1+1,`writes +${SERVER.writes-w1}`);
  check("iPhone ได้ค่าล่าสุด",(await ph.evaluate(()=>JSON.parse(localStorage.getItem("secretary-dashboard-v1")).projects[0].title))==="แก้ครั้งที่ 4");

  console.log("\n[6] Import JSON ตอนล็อกอินอยู่ → flush ขึ้น Firestore ก่อน reload");
  const w2=SERVER.writes;
  await pc.evaluate(async()=>{const d=JSON.parse(localStorage.getItem("secretary-dashboard-v1"));d.projects[0].title="นำเข้าแล้ว";await window.storage.set("secretary-dashboard-v1",JSON.stringify(d));await window.FireSync.flush(3000);});
  check("flush เขียนทันทีไม่รอ debounce",SERVER.writes===w2+1&&JSON.parse(SERVER.docs[DOC].json).projects[0].title==="นำเข้าแล้ว");

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
  const w3=SERVER.writes;
  await pc.evaluate(()=>{const d=JSON.parse(localStorage.getItem("secretary-dashboard-v1"));d.projects[0].title="เพิ่มตอนยังไม่ล็อกอิน";return window.storage.set("secretary-dashboard-v1",JSON.stringify(d));});
  await sleep(1200);
  check("ออกแล้วไม่เขียนขึ้น Firestore",SERVER.writes===w3);
  check("ตั้ง flag ว่ามีของยังไม่ซิงก์",await pc.evaluate(()=>!!localStorage.getItem("secretary-unsynced-since")));
  check("ขึ้นแถบเตือน 'ยังไม่ได้ล็อกอิน — ข้อมูลไม่ซิงก์'",await pc.locator('.sync-warn').count()===1);

  console.log("\n[8b] (บั๊กที่ ohm เจอ) ล็อกอินกลับหลังแก้ตอนหลุด → ต้องถาม ไม่ทับเงียบ · เลือก Cancel = ใช้ของเครื่องนี้");
  let dlg2=null; pc.once('dialog',async d=>{dlg2=d.message(); await d.dismiss();});
  await pc.click('.sync-warn');
  await sleep(1500);
  check("ถามก่อนทับ",dlg2&&dlg2.includes("ยังไม่เคยขึ้นคลาวด์"));
  check("ของที่เพิ่มตอนหลุดขึ้น Firestore",JSON.parse(SERVER.docs[DOC].json).projects[0].title==="เพิ่มตอนยังไม่ล็อกอิน");
  check("iPhone ได้ของนั้นด้วย",(await ph.evaluate(()=>JSON.parse(localStorage.getItem("secretary-dashboard-v1")).projects[0].title))==="เพิ่มตอนยังไม่ล็อกอิน");
  check("แถบเตือนหายหลังล็อกอิน",await pc.locator('.sync-warn').count()===0);
  check("flag ถูกล้าง",await pc.evaluate(()=>!localStorage.getItem("secretary-unsynced-since")));

  console.log("\n[8c] เลือก OK = ใช้คลาวด์ → ของเครื่องนี้ถูกเก็บสำรอง");
  pc.once('dialog',d=>d.accept()); await pc.click('.acct-btn'); await sleep(200);
  if(!(await pc.locator('.acct-item:has-text("ออกจากระบบ")').count())) await pc.click('.acct-btn');
  await pc.click('.acct-item:has-text("ออกจากระบบ")'); await sleep(500);
  await pc.evaluate(()=>{const d=JSON.parse(localStorage.getItem("secretary-dashboard-v1"));d.projects[0].title="ของเครื่องที่จะทิ้ง";return window.storage.set("secretary-dashboard-v1",JSON.stringify(d));});
  let dlg3=null; pc.once('dialog',async d=>{dlg3=d.message(); await d.accept();});
  await pc.click('.sync-warn'); await sleep(1500);
  check("ถามอีกครั้ง",!!dlg3);
  check("ใช้ของคลาวด์",(await pc.evaluate(()=>JSON.parse(localStorage.getItem("secretary-dashboard-v1")).projects[0].title))==="เพิ่มตอนยังไม่ล็อกอิน");
  check("ของเครื่องเก็บไว้ใน pre-firestore-backup",await pc.evaluate(()=>(localStorage.getItem("secretary-pre-firestore-backup")||"").includes("ของเครื่องที่จะทิ้ง")));
  pc.once('dialog',d=>d.accept()); await pc.click('.acct-btn'); await sleep(200);
  if(!(await pc.locator('.acct-item:has-text("ออกจากระบบ")').count())) await pc.click('.acct-btn');
  await pc.click('.acct-item:has-text("ออกจากระบบ")'); await sleep(500);

  console.log("\n[9] บัญชีอื่นล็อกอิน → ถูกปฏิเสธ");
  const other=await device(b,"other",{});
  await other.evaluate(()=>{window.__fakeEmail="someone@gmail.com";});
  await other.click('.acct-btn'); await other.click('.acct-item:has-text("เข้าสู่ระบบ Google")');
  await sleep(800);
  s=await status(other);
  check("บัญชีอื่น → ถูกออกจากระบบ + บอกว่าไม่มีสิทธิ์",s.phase==="signedOut"&&!(s.user)&&s.text.includes("ไม่มีสิทธิ์"),s.phase+" "+s.text);

  for(const p of pages) if(p.errs.length) console.log("ERR",p.__name,p.errs.slice(0,5));
  const errCount=pages.reduce((a,p)=>a+p.errs.length,0);
  console.log(`\n════ ผ่าน ${results.filter(Boolean).length}/${results.length} ${errCount?"· RUNTIME ERRORS "+errCount:"· NO RUNTIME ERRORS"}`);
  await b.close();
})();
