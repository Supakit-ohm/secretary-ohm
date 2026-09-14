/* smoke-test.js — เทสต์ว่าแอปรันจริงได้ ไม่ใช่แค่ syntax ผ่าน
   วิธีใช้ (ครั้งแรกติดตั้งก่อน):
     npm i playwright react@18.2.0 react-dom@18.2.0 @babel/standalone@7.24.7 prop-types@15.8.1 recharts@2.15.0
     npx playwright install chromium
     node smoke-test.js
   ถ้ามี Chromium อยู่แล้วที่อื่น: CHROME_PATH=/path/to/chrome node smoke-test.js
   สคริปต์จะสร้าง test-dashboard.html (สำเนาที่ชี้ CDN ไป node_modules) แล้วเปิดด้วย Chromium
   *** สำคัญ: @babel/standalone ต้อง pin 7.24.7 รุ่นใหม่กว่านี้ throw "Cannot use import statement outside a module" ***
   หมายเหตุ: แก้ไฟล์ preview-dashboard.html เท่านั้น test-dashboard.html เป็นไฟล์ชั่วคราวที่ generate ใหม่ทุกครั้ง

   ครอบคลุม: ทุกแท็บ Finance · หน้า Investments ที่รื้อใหม่ (ข้อ 18) · การ์ดโมเมนตัม (ข้อ 19) · Dashboard bento (ข้อ 24/2)
             · หน้ายืนยัน Import JSON (ข้อ 20) · หมุดโปรเจกต์ + toast (ข้อ 21) · จอมือถือไม่ล้นแนวนอน */
const fs=require('fs'),path=require('path'),{chromium}=require('playwright');

const SEED={
 "todos":{"daily":[],"weekly":[],"monthly":[]},"events":[],"notes":[{"id":"n1","text":"โน้ตทดสอบ","color":"#8b5cf6"}],
 "finance":{
  "income":[{"id":"i1","date":"2026-07-25","month":"2026-07","amount":45000,"source":"เงินเดือน","note":"","importSource":"payslip"}],
  "expenses":[
   {"id":"e1","date":"2026-07-02","amount":-1200,"category":"อื่นๆ","memo":"7-ELEVEN สาขา 1","source":"kbank-csv"},
   {"id":"e2","date":"2026-07-05","amount":-3400,"category":"อื่นๆ","memo":"LOTUS","source":"kbank-csv"},
   {"id":"e3","date":"2026-07-09","amount":-2500,"category":"ผ่อนรถ","memo":"งวดเดือน ก.ค.","source":"manual"},
   {"id":"e4","date":"2026-06-09","amount":-2500,"category":"ผ่อนรถ","memo":"งวดเดือน มิ.ย.","source":"manual"},
   {"id":"e5","date":"2026-07-11","amount":500,"category":"อาหาร","memo":"คืนเงิน เพื่อน","source":"csv-refund"}],
  "investments":[
   {"id":"v1","date":"2026-07-25","amount":1500,"name":"กบข.","type":"retirement","source":"payslip"},
   {"id":"v2","date":"2026-06-25","amount":1500,"name":"กบข.","type":"retirement","source":"payslip"}],
  "investmentValues":{"retirement":{"value":"52000","updatedAt":"2026-03-01"},"crypto":{"value":"","updatedAt":""}},
  "cryptoHoldings":[
   {"id":"c1","coin":"BTC","quantity":"0.01","avgCost":"2000000","currentPrice":"3000000","currency":"THB","platform":"Binance Global","updatedAt":"2026-08-01","firstHeldDate":"2026-01-10","buys":[{"id":"b1","date":"2026-01-10","quantity":"0.01","price":"2000000"}]},
   {"id":"c2","coin":"ETH","quantity":"0.5","avgCost":"90","currentPrice":"75","currency":"USD","platform":"Binance TH","updatedAt":"2026-08-01","firstHeldDate":"2026-03-01","buys":[{"id":"b2","date":"2026-03-01","quantity":"0.5","price":"90"}]},
   {"id":"c3","coin":"SOL","quantity":"2","avgCost":"5000","currentPrice":"5200","currency":"THB","platform":"","updatedAt":"2026-08-01"}],
  "cashAccounts":[{"id":"a1","name":"KBank","balance":"80000","updatedAt":"2026-08-20"}],
  "debts":[
   {"id":"d1","kind":"external","name":"ผ่อนรถ Honda","type":"car-loan","principal":400000,"currentBalance":250000,"updatedAt":"2026-08-01","interestRate":3.5,"minPayment":2500,"dueDay":9,"linkedExpenseCategory":"ผ่อนรถ","note":"","startDate":"2024-01-01","source":"manual"},
   {"id":"d2","kind":"self","name":"ยืมเงินเก็บซ่อมบ้าน","type":"other","principal":null,"currentBalance":30000,"updatedAt":"2026-08-01","interestRate":null,"minPayment":null,"dueDay":null,"linkedExpenseCategory":null,"note":"","startDate":"2026-05-01","source":"manual"}]},
 "goals":[],"habits":[],"health":[],"documents":[],
 "bookQueue":[{"id":"bk1","title":"หนังสือทดสอบ","status":"reading"},{"id":"bk2","title":"อ่านจบแล้ว","status":"done"}],
 "journal":[],"activity":[],
 "projects":[
  {"id":"p1","title":"โปรเจกต์กำหนดเอง","description":"ทดสอบหมุด + toast","category":"personal","priority":"medium","color":"#8b5cf6","status":"active","measureType":"manual","targetValue":100,"baselineValue":0,"unit":"","manualValue":40,"startDate":"2026-06-01","targetDate":"2026-12-31",
   "milestones":[{"id":"m1","pct":25,"label":"","reachedAt":"2026-07-01"},{"id":"m2","pct":50,"label":"ครึ่งทาง","reachedAt":null},{"id":"m3","pct":75,"label":"","reachedAt":null},{"id":"m4","pct":100,"label":"","reachedAt":null}]},
  {"id":"p2","title":"เก็บเงินล้าน","description":"ทดสอบหมุดแบบตัวเลข","category":"finance","priority":"high","color":"#34d399","status":"active","measureType":"numeric","targetValue":1000000,"baselineValue":0,"unit":"บาท","manualValue":0,"startDate":"2026-01-01","targetDate":"2027-01-01",
   "milestones":[{"id":"m5","pct":25,"label":"","reachedAt":null},{"id":"m6","pct":50,"label":"","reachedAt":null}]},
  {"id":"p3","title":"โปรเจกต์แบบงาน","description":"ไม่มีหมุด","category":"career","priority":"low","color":"#60a5fa","status":"active","measureType":"tasks","targetValue":100,"baselineValue":0,"unit":"","manualValue":0,"startDate":"2026-08-01","targetDate":"2026-10-01","milestones":[]}],
 "tasks":[
  {"id":"t1","projectId":"p3","title":"งานเสร็จแล้ว","note":"","status":"done","dueDate":"2026-08-10","recurrence":"none","weight":1,"completions":{}},
  {"id":"t2","projectId":"p3","title":"งานยังไม่เสร็จ","note":"","status":"pending","dueDate":"2026-08-30","recurrence":"none","weight":1,"completions":{}},
  {"id":"t3","projectId":null,"title":"งานประจำวัน","note":"","status":"pending","dueDate":null,"recurrence":"daily","weight":1,"completions":{}}],
 "checkins":[
  {"id":"ck1","projectId":"p2","date":"2026-03-01","value":120000,"note":"ยกมา"},
  {"id":"ck2","projectId":"p2","date":"2026-08-01","value":180000,"note":""}],
 "budgets":{"อาหาร":{"amount":8000,"type":"variable"}},"reviews":{},
 "progressLog":{"2026-07-25":30.5,"2026-08-20":38.2}
};

const CDN={
 "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js":"node_modules/react/umd/react.production.min.js",
 "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js":"node_modules/react-dom/umd/react-dom.production.min.js",
 "https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.7/babel.min.js":"node_modules/@babel/standalone/babel.min.js",
 "https://unpkg.com/prop-types@15.8.1/prop-types.js":"node_modules/prop-types/prop-types.js",
 "https://unpkg.com/recharts@2.15.0/umd/Recharts.js":"node_modules/recharts/umd/Recharts.js",
};
let html=fs.readFileSync('preview-dashboard.html','utf8');
for(const [a,b] of Object.entries(CDN)) html=html.split(a).join(b);
fs.writeFileSync('test-dashboard.html',html);

const results=[];
function check(name,ok,detail){ results.push({name,ok:!!ok,detail:detail||""}); console.log(`${ok?"  ok ":"  FAIL"} ${name}${detail?"  — "+detail:""}`); }

(async()=>{
  const b=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{});
  const p=await b.newPage({viewport:{width:1440,height:950}});
  const errs=[];
  const dialogs=[];
  p.on('pageerror',e=>errs.push('PAGEERROR: '+String(e).slice(0,300)));
  p.on('console',m=>{ if(m.type()==='error'&&!/favicon|manifest|sw\.js|Failed to load resource|net::/i.test(m.text())) errs.push('CONSOLE: '+m.text().slice(0,300)); });
  p.on('dialog',async d=>{ dialogs.push(d.message()); await d.dismiss().catch(()=>d.accept()); });
  await p.addInitScript(d=>localStorage.setItem('secretary-dashboard-v1',JSON.stringify(d)),SEED);
  await p.goto('file://'+path.resolve('test-dashboard.html'));
  await p.waitForTimeout(7000);

  /* ───────── รอบ 19: การ์ดโมเมนตัมในแผงม่วง ───────── */
  console.log('\n[ข้อ 24/2] Dashboard bento + การ์ดโมเมนตัม');
  const bento=await p.evaluate(()=>{
    const g=document.querySelector('.db-bento');
    if(!g) return null;
    const cards=[...g.children];
    const mom=g.querySelector('.db-mom');
    const q=(sel)=>!!g.querySelector(sel);
    return {
      cards:cards.length,
      cols:getComputedStyle(g).gridTemplateColumns.split(' ').length,
      hero:!!document.querySelector('.db-hero'),
      heroNums:document.querySelectorAll('.db-bignum').length,
      mom:!!mom,
      ringDash:(g.querySelector('.db-ring-wrap circle[stroke-dasharray]')||{}).getAttribute?.('stroke-dasharray')||"",
      spark:!!g.querySelector('.db-mom-side polyline'),
      bars:g.querySelectorAll('.db-bar').length,
      feature:!!g.querySelector('.db-feature'),
      tasks:g.querySelectorAll('.db-feature .db-trow').length,
      monthRows:g.querySelectorAll('.db-row').length,
      donut:g.querySelectorAll('.db-donut circle').length,
      quick:g.querySelectorAll('.db-acc-row').length,
      week:q('.db-tl')||q('.db-empty'),
      notes:g.querySelectorAll('.note-card').length,
      history:g.innerText.includes('History'),
      historyOpens:(()=>{const h=[...g.querySelectorAll('.db-head')].find(x=>x.innerText.includes('History'));if(!h)return false;h.click();return true;})(),
      leftovers:document.querySelectorAll('.hero-panel, .sidebar').length,
    };
  });
  check('กริด bento แสดงผล',bento&&bento.cards>=9,bento?`${bento.cards} การ์ด · ${bento.cols} คอลัมน์`:'ไม่พบ .db-bento');
  check('แถบฮีโร่ + ตัวเลขใหญ่ 3 ช่อง',bento&&bento.hero&&bento.heroNums>=3,bento?`bignum ${bento.heroNums}`:"");
  check('การ์ดโมเมนตัมอยู่ในกริด',bento&&bento.mom);
  check('วงแหวนโมเมนตัมวาดจริง (มี stroke-dasharray)',bento&&bento.ringDash!=="",bento&&bento.ringDash?`dasharray="${bento.ringDash}"`:"");
  check('sparkline วาดจริง',bento&&bento.spark);
  check('กราฟแท่ง 7 วัน',bento&&bento.bars===7,bento?`${bento.bars} แท่ง`:"");
  check('การ์ดเด่น "งานวันนี้" มีรายการงาน',bento&&bento.feature&&bento.tasks>0,bento?`${bento.tasks} งาน`:"");
  check('การ์ดเดือนนี้ครบ 4 แถว',bento&&bento.monthRows>=4,bento?`${bento.monthRows} แถว`:"");
  check('โดนัทสัดส่วนพอร์ตวาดจริง',bento&&bento.donut>=2,bento?`${bento.donut} วง (0 = ยังไม่กรอกมูลค่า)`:"");
  check('การ์ดดูเร็ว 4 แถว',bento&&bento.quick>=4,bento?`${bento.quick} แถว`:"");
  check('ตารางสัปดาห์แสดงผล',bento&&bento.week);
  check('การ์ดโน้ตยังอยู่ในกริด',bento&&bento.notes>0,bento?`${bento.notes} โน้ต`:"");
  check('การ์ด History (พับได้) ยังอยู่ในกริด',bento&&bento.history);
  check('กดหัวการ์ด History แล้วกางออก',await p.evaluate(()=>{const g=document.querySelector('.db-bento');return !!g&&(g.innerText.includes('Event')||g.innerText.includes('ยังไม่มีประวัติ'));}));
  check('แผ่นมุมโค้ง (.main-wrap) มีไล่สีตาม mockup',await p.evaluate(()=>{const w=document.querySelector('.main-wrap');if(!w)return false;const cs=getComputedStyle(w);return cs.borderRadius.startsWith('34')&&cs.backgroundImage.includes('radial-gradient');}));
  check('ไม่มีซาก .hero-panel/.sidebar หลงเหลือ',bento&&bento.leftovers===0,bento?`เจอ ${bento.leftovers}`:"");

  /* ───────── ทุกแท็บ Finance + รอบ 18: Investments ───────── */
  console.log('\n[แท็บ Finance ทั้งหมด]');
  await p.locator('button:has-text("Finance")').first().click(); await p.waitForTimeout(1500);
  const nw=(await p.evaluate(()=>document.body.innerText)).match(/Net Worth[\s\S]{0,60}/);
  check('Net Worth คำนวณได้',!!nw,nw?nw[0].replace(/\n/g,' | '):"");
  for(const t of ['Overview','Income','Expenses','Investments','Debts','Review']){
    await p.locator(`button:has-text("${t}")`).first().click().catch(()=>{});
    await p.waitForTimeout(1600);
    const len=(await p.evaluate(()=>document.querySelector('.fin-section')?.innerText.length))||0;
    check(`แท็บ ${t}`,len>50,`${len} ตัวอักษร`);
  }

  console.log('\n[ข้อ 24/4] หน้า Finance Overview รีดีไซน์ตามธรรมนูญข้อ 32');
  await p.locator('button:has-text("Overview")').first().click(); await p.waitForTimeout(2000);
  const ovw=await p.evaluate(()=>{
    const sec=document.querySelector('.fin-section');
    const inlineFs=[...(sec?sec.querySelectorAll('[style]'):[])]
      .filter(e=>e.style.fontSize&&!(e.tagName==='I'&&/\bfa-/.test(e.className)))
      .map(e=>`${e.className}:${e.style.fontSize}`);
    const h=document.querySelector('.fin-page .db-hero-title');
    return {
      page:!!document.querySelector('.fin-section.fin-page'),
      heroFs:h?getComputedStyle(h).fontSize:'',
      heroMargin:h?getComputedStyle(h).marginTop:'',
      cards:document.querySelectorAll('.fin-page .db-bento > .db-card').length,
      bignums:document.querySelectorAll('.fin-page .db-bignum .n').length,
      nwBars:document.querySelectorAll('.fin-page .nw-bar i').length,
      nwRows:document.querySelectorAll('.fin-page .nw-row-link').length,
      donuts:document.querySelectorAll('.fin-page .db-donut').length,
      legendBtns:document.querySelectorAll('.fin-page .fin-lg-btn').length,
      rangeBtns:document.querySelectorAll('.fin-page .fin-range-btn').length,
      rangeSelect:!!document.querySelector('.fin-page .fin-range-select'),
      addBtns:[...document.querySelectorAll('.fin-page button')].filter(b=>/เพิ่มข้อมูล|เพิ่มบัญชี/.test(b.textContent||'')).map(b=>b.textContent.trim()),
      legacy:document.querySelectorAll('.fin-page .card, .fin-page .empty, .fin-page .fin-stat-card, .fin-page .fin-pie-split, .fin-page table').length,
      recharts:document.querySelectorAll('.fin-page .recharts-wrapper').length,
      inlineFs,
    };
  });
  check('หน้าใช้โครง .fin-page + db-bento',ovw.page&&ovw.cards>=4,`การ์ด ${ovw.cards} ใบ`);
  check('ฮีโร่ 38px และมี margin:0 (ข้อ 31)',ovw.heroFs==='38px'&&ovw.heroMargin==='0px',`${ovw.heroFs} / margin-top ${ovw.heroMargin}`);
  check('ตัวเลขใหญ่สรุป 3 ตัว (รับ/จ่าย/คงเหลือ)',ovw.bignums===3,`${ovw.bignums} ตัว`);
  check('แถบสัดส่วน Net Worth + แถวกดไปหน้าอื่น',ovw.nwBars>=2&&ovw.nwRows===2,`${ovw.nwBars} แถบ · ${ovw.nwRows} แถวลิงก์`);
  check('โดนัทรายรับ/รายจ่าย (DashDonut ไม่ใช่ Recharts)',ovw.donuts>=1&&ovw.recharts===0,`${ovw.donuts} วง · recharts ${ovw.recharts}`);
  check('ตัวกรองช่วงเวลาเป็นแคปซูล',ovw.rangeBtns===2&&ovw.rangeSelect,`${ovw.rangeBtns} ปุ่ม · select=${ovw.rangeSelect}`);
  check('ปุ่มเพิ่มข้อมูลเหลือปุ่มเดียว (ข้อ 32/2)',ovw.addBtns.length===1,ovw.addBtns.join(' | ')||'ไม่เจอปุ่มเลย');
  check('ไม่เหลือคลาสธีมเก่า/ตารางในหน้านี้',ovw.legacy===0,`เจอ ${ovw.legacy}`);
  check('ไม่เหลือ fontSize inline ในหน้านี้ (ข้อ 32/4)',ovw.inlineFs.length===0,ovw.inlineFs.slice(0,5).join(' | '));
  // กด legend หมวดหนึ่ง แล้วต้องกางรายการออกมา
  const lg=p.locator('.fin-lg-btn').first();
  if(await lg.count()){
    await lg.click(); await p.waitForTimeout(700);
    const det=await p.evaluate(()=>document.querySelectorAll('.fin-detail-item').length);
    check('กดหมวดใน legend แล้วกางรายการ',det>0,`${det} รายการ`);
    await lg.click(); await p.waitForTimeout(400);
  } else check('กดหมวดใน legend แล้วกางรายการ',false,'ไม่เจอ legend');
  // ปุ่มเดียว → โมดัลเพิ่มบัญชีเงินสด
  const ovAdd=p.locator('.fin-page .inv-add-btn').first();
  if(await ovAdd.count()){
    await ovAdd.click(); await p.waitForTimeout(800);
    const m=await p.evaluate(()=>{const x=document.querySelector('.modal-backdrop .modal');return x?{head:x.querySelector('.modal-head')?.innerText.trim(),inputs:x.querySelectorAll('input').length}:null;});
    check('โมดัลเพิ่มบัญชีเงินสดเปิดได้',!!m&&m.inputs===2,m?`${m.head} · ${m.inputs} ช่อง`:'');
    await p.locator('.modal-close').first().click().catch(()=>{}); await p.waitForTimeout(500);
  } else check('โมดัลเพิ่มบัญชีเงินสดเปิดได้',false,'ไม่เจอปุ่ม');

  console.log('\n[ข้อ 24/5] หน้า Debts รีดีไซน์ตามธรรมนูญข้อ 32');
  await p.locator('button:has-text("Debts")').first().click(); await p.waitForTimeout(2000);
  const dbt=await p.evaluate(()=>{
    const sec=document.querySelector('.fin-section');
    const inlineFs=[...(sec?sec.querySelectorAll('[style]'):[])]
      .filter(e=>e.style.fontSize&&!(e.tagName==='I'&&/\bfa-/.test(e.className)))
      .map(e=>`${e.className}:${e.style.fontSize}`);
    const h=document.querySelector('.fin-page .db-hero-title');
    return {
      page:!!document.querySelector('.fin-section.fin-page'),
      heroFs:h?getComputedStyle(h).fontSize:'',
      heroMargin:h?getComputedStyle(h).marginTop:'',
      cards:document.querySelectorAll('.fin-page .db-bento > .db-card').length,
      bignums:document.querySelectorAll('.fin-page .db-bignum .n').length,
      donuts:document.querySelectorAll('.fin-page .db-donut').length,
      recharts:document.querySelectorAll('.fin-page .recharts-wrapper').length,
      items:document.querySelectorAll('.fin-page .debt-item').length,
      bals:[...document.querySelectorAll('.fin-page .debt-bal')].map(e=>e.textContent.trim()),
      addBtns:[...document.querySelectorAll('.fin-page button')].filter(b=>/เพิ่มข้อมูล|เพิ่มหนี้/.test(b.textContent||'')).map(b=>b.textContent.trim()),
      legacy:document.querySelectorAll('.fin-page .card, .fin-page .empty, .fin-page .fin-stat-card, .fin-page table, .fin-page .exp-table-wrap').length,
      // ปุ่มมีข้อความห้ามใช้ .icon-btn (บั๊กข้อ 35 — ข้อความล้นทับแถวบน)
      iconBtnWithText:[...document.querySelectorAll('.fin-page .icon-btn')].filter(b=>(b.textContent||'').trim().length>0).length,
      confirmBtn:!!document.querySelector('.fin-page .debt-match-act .pill-btn'),
      collapses:document.querySelectorAll('.fin-page .db-bento > .db-card .db-head[role="button"]').length,
      inlineFs,
    };
  });
  check('หน้าใช้โครง .fin-page + db-bento',dbt.page&&dbt.cards>=5,`การ์ด ${dbt.cards} ใบ`);
  check('ฮีโร่ 38px และมี margin:0 (ข้อ 31)',dbt.heroFs==='38px'&&dbt.heroMargin==='0px',`${dbt.heroFs} / margin-top ${dbt.heroMargin}`);
  check('ตัวเลขใหญ่สรุป 3 ตัว (คงเหลือ/ผ่อน/ชำระแล้ว)',dbt.bignums===3,`${dbt.bignums} ตัว`);
  check('โดนัทสัดส่วนหนี้ (DashDonut ไม่ใช่ Recharts)',dbt.donuts===1&&dbt.recharts===0,`${dbt.donuts} วง · recharts ${dbt.recharts}`);
  check('หนี้แสดงเป็นการ์ดต่อก้อน ไม่ใช่ตาราง (ข้อ 32/1)',dbt.items===2,`${dbt.items} การ์ด · ยอด ${dbt.bals.join(' | ')}`);
  check('การ์ดพับได้อย่างน้อย 3 ใบ (ข้อ 32/3)',dbt.collapses>=3,`${dbt.collapses} ใบ`);
  check('ปุ่มเพิ่มข้อมูลเหลือปุ่มเดียว (ข้อ 32/2)',dbt.addBtns.length===1,dbt.addBtns.join(' | ')||'ไม่เจอปุ่มเลย');
  check('ไม่เหลือคลาสธีมเก่า/ตารางในหน้านี้',dbt.legacy===0,`เจอ ${dbt.legacy}`);
  check('ปุ่มมีข้อความไม่ใช้ .icon-btn (ข้อ 35)',dbt.iconBtnWithText===0,`เจอ ${dbt.iconBtnWithText}`);
  check('ไม่เหลือ fontSize inline ในหน้านี้ (ข้อ 32/4)',dbt.inlineFs.length===0,dbt.inlineFs.slice(0,5).join(' | '));
  check('ปุ่มยืนยันหักยอดคงเหลือยังอยู่ (seed ผูกหมวด "ผ่อนรถ")',dbt.confirmBtn,'');
  // กดยืนยันหักยอด → ยอดคงเหลือต้องลดลงตามผลรวมรายจ่ายในหมวดที่ผูกไว้ (250000 − 5000)
  const cfm=p.locator('.fin-page .debt-match-act .pill-btn').first();
  if(await cfm.count()){
    await cfm.click(); await p.waitForTimeout(1400);
    const after=await p.evaluate(()=>{
      const d=JSON.parse(localStorage.getItem('secretary-dashboard-v1')).finance.debts.find(x=>x.id==='d1');
      return {bal:Number(d.currentBalance),shown:(document.querySelector('.fin-page .debt-item .debt-bal')||{}).textContent};
    });
    check('ยืนยันหักยอดแล้วยอดคงเหลือลดจริง',after.bal===245000,`เหลือ ${after.bal} · การ์ดโชว์ ${after.shown}`);
  } else check('ยืนยันหักยอดแล้วยอดคงเหลือลดจริง',false,'ไม่เจอปุ่มยืนยัน');
  // ปุ่มเดียว → โมดัลเพิ่มหนี้ · แล้วเพิ่มจริง
  const dbAdd=p.locator('.fin-page .inv-add-btn').first();
  if(await dbAdd.count()){
    await dbAdd.click(); await p.waitForTimeout(800);
    const hasModal=await p.evaluate(()=>!!document.querySelector('.modal-backdrop .debt-modal'));
    check('โมดัลเพิ่มหนี้เปิดได้',hasModal,'');
    if(hasModal){
      await p.locator('.debt-modal input').first().fill('หนี้ทดสอบ');
      await p.locator('.debt-modal input[inputmode="decimal"]').first().fill('12000');
      await p.locator('.debt-modal .debt-save-btn').click(); await p.waitForTimeout(1400);
      const n2=await p.evaluate(()=>document.querySelectorAll('.fin-page .debt-item').length);
      check('บันทึกหนี้ใหม่จากโมดัลได้',n2===3,`${n2} การ์ด`);
    } else check('บันทึกหนี้ใหม่จากโมดัลได้',false,'ไม่มีโมดัล');
  } else check('โมดัลเพิ่มหนี้เปิดได้',false,'ไม่เจอปุ่ม');
  // ปุ่มแก้ไขบนการ์ด → โมดัลเดิมพร้อมค่าเก่า
  const dbEdit=p.locator('.fin-page .debt-item .db-chip[title="แก้ไข"]').first();
  if(await dbEdit.count()){
    await dbEdit.click(); await p.waitForTimeout(800);
    const ed=await p.evaluate(()=>{
      const m=document.querySelector('.modal-backdrop .debt-modal');
      return m?{head:m.querySelector('.modal-head span')?.textContent.trim(),name:m.querySelector('input')?.value}:null;
    });
    check('ปุ่มแก้ไขเปิดโมดัลพร้อมค่าเดิม',!!ed&&/แก้ไข/.test(ed.head||'')&&!!ed.name,ed?`${ed.head} · ${ed.name}`:'');
    await p.locator('.modal-close').first().click().catch(()=>{}); await p.waitForTimeout(500);
  } else check('ปุ่มแก้ไขเปิดโมดัลพร้อมค่าเดิม',false,'ไม่เจอปุ่มแก้ไข');

  console.log('\n[ข้อ 24/7] หน้า Finance Review รีดีไซน์ตามธรรมนูญข้อ 32');
  await p.locator('button:has-text("Review")').first().click(); await p.waitForTimeout(2000);
  const rvw=await p.evaluate(()=>{
    const sec=document.querySelector('.fin-section');
    const inlineFs=[...(sec?sec.querySelectorAll('[style]'):[])]
      .filter(e=>e.style.fontSize&&!(e.tagName==='I'&&/\bfa-/.test(e.className)))
      .map(e=>`${e.className}:${e.style.fontSize}`);
    const h=document.querySelector('.fin-page .db-hero-title');
    return {
      page:!!document.querySelector('.fin-section.fin-page'),
      heroFs:h?getComputedStyle(h).fontSize:'',
      heroMargin:h?getComputedStyle(h).marginTop:'',
      cards:document.querySelectorAll('.fin-page .db-bento > .db-card').length,
      bignums:document.querySelectorAll('.fin-page .db-bignum .n').length,
      collapses:document.querySelectorAll('.fin-page .db-bento > .db-card .db-head[role="button"]').length,
      monthSelect:!!document.querySelector('.fin-page .fin-range-select'),
      addBtns:[...document.querySelectorAll('.fin-page button')].filter(b=>/เพิ่มข้อมูล/.test(b.textContent||'')).map(b=>b.textContent.trim()),
      recatBtn:[...document.querySelectorAll('.fin-page button')].filter(b=>/จัดหมวดใหม่/.test(b.textContent||'')).length,
      legacy:document.querySelectorAll('.fin-page .card, .fin-page .empty, .fin-page .fin-stat-card, .fin-page table').length,
      anomRows:document.querySelectorAll('.fin-page .rv-anom').length,
      catRows:document.querySelectorAll('.fin-page .rv-cat-row').length,
      inlineFs,
    };
  });
  check('หน้าใช้โครง .fin-page + db-bento',rvw.page&&rvw.cards>=5,`การ์ด ${rvw.cards} ใบ`);
  check('ฮีโร่ 38px และมี margin:0 (ข้อ 31)',rvw.heroFs==='38px'&&rvw.heroMargin==='0px',`${rvw.heroFs} / margin-top ${rvw.heroMargin}`);
  check('ตัวเลขใหญ่สรุป 3 ตัว (รับ/จ่าย/คงเหลือ)',rvw.bignums===3,`${rvw.bignums} ตัว`);
  check('ตัวเลือกเดือนยังอยู่ในฮีโร่',rvw.monthSelect);
  check('การ์ดพับได้อย่างน้อย 3 ใบ (ข้อ 32/3)',rvw.collapses>=3,`${rvw.collapses} ใบ`);
  check('หน้านี้ไม่มีปุ่ม "เพิ่มข้อมูล" ปลอม มีแค่ปุ่ม "จัดหมวดใหม่" ปุ่มเดียว (ข้อ 32/2)',rvw.addBtns.length===0&&rvw.recatBtn===1,`เพิ่มข้อมูล ${rvw.addBtns.length} · จัดหมวดใหม่ ${rvw.recatBtn}`);
  check('ไม่เหลือคลาสธีมเก่า/ตารางในหน้านี้',rvw.legacy===0,`เจอ ${rvw.legacy}`);
  check('ไม่เหลือ fontSize inline ในหน้านี้ (ข้อ 32/4)',rvw.inlineFs.length===0,rvw.inlineFs.slice(0,5).join(' | '));
  check('ตรรกะ anomaly detection ยังทำงาน (seed มี 2 หมวดใหม่ใน ก.ค.)',rvw.anomRows>0,`${rvw.anomRows} รายการ`);
  check('ตรรกะ buildMonthReview ยังจัดหมวดที่คุมได้ถูก',rvw.catRows>0,`${rvw.catRows} แถว`);
  // การ์ดพับได้: กดหัวการ์ด "รายจ่ายคงที่" แล้วต้องย่อ/กางสลับได้จริง
  const fixHead=p.locator('.fin-page .db-head:has(.db-title:text-is("รายจ่ายคงที่"))').first();
  if(await fixHead.count()){
    const before=await p.evaluate(()=>document.querySelectorAll('.fin-page .rv-fixed-item').length);
    await fixHead.click(); await p.waitForTimeout(500);
    const after=await p.evaluate(()=>document.querySelectorAll('.fin-page .rv-fixed-item').length);
    check('การ์ดพับได้ย่อ/กางสลับได้จริง (ข้อ 32/3)',after!==before,`${before} → ${after} แถว`);
    if(after!==before){ await fixHead.click(); await p.waitForTimeout(400); } // เปิดกลับที่เดิมไว้เผื่อเทสต์ถัดไปอ้างอิง
  } else check('การ์ดพับได้ย่อ/กางสลับได้จริง (ข้อ 32/3)',false,'ไม่เจอหัวการ์ด');
  // ให้คะแนน + เขียนโน้ต แล้วบันทึกได้จริง (ตรรกะเดิม saveReview ไม่ได้แตะ)
  const starBtns=p.locator('.fin-page .rv-star');
  if(await starBtns.count()>=4){
    await starBtns.nth(3).click(); // ให้ 4 ดาว
    await p.locator('.fin-page textarea.modal-input').fill('ทดสอบสรุปเดือนนี้');
    await p.locator('.fin-page .modal-btn-save').click(); await p.waitForTimeout(1200);
    const savedReview=await p.evaluate(()=>{
      const d=JSON.parse(localStorage.getItem('secretary-dashboard-v1'));
      const m=Object.keys(d.reviews||{})[0];
      return m?d.reviews[m]:null;
    });
    check('บันทึกรีวิว (คะแนน+โน้ต) ลง localStorage จริง',!!savedReview&&savedReview.rating===4&&savedReview.notes==='ทดสอบสรุปเดือนนี้',JSON.stringify(savedReview));
  } else check('บันทึกรีวิว (คะแนน+โน้ต) ลง localStorage จริง',false,'ไม่เจอดาวให้กด');
  // ปุ่มจัดหมวดใหม่ยังเปิด RecategorizeModal ได้ (ตรรกะเดิมไม่ได้แตะ)
  const recatBtnLoc=p.locator('.fin-page .inv-add-btn:has-text("จัดหมวดใหม่")').first();
  if(await recatBtnLoc.count()){
    await recatBtnLoc.click(); await p.waitForTimeout(800);
    const hasModal=await p.evaluate(()=>!!document.querySelector('.modal-backdrop .recat-modal'));
    check('ปุ่มจัดหมวดใหม่เปิด RecategorizeModal ได้',hasModal);
    await p.locator('.modal-close').first().click().catch(()=>{}); await p.waitForTimeout(500);
  } else check('ปุ่มจัดหมวดใหม่เปิด RecategorizeModal ได้',false,'ไม่เจอปุ่ม');
  // Budget Settings พับได้ + ยังแสดงรายการหมวด (ตรรกะเดิม getBudget/setBudget ไม่ได้แตะ)
  const budgetHead=p.locator('.fin-page .db-head:has(.db-title:text-is("Budget Settings"))').first();
  if(await budgetHead.count()){
    await budgetHead.click(); await p.waitForTimeout(600);
    const rows=await p.evaluate(()=>document.querySelectorAll('.fin-page .budget-row').length);
    check('Budget Settings กางออกมาแสดงรายการหมวดได้ (ปิดเป็นค่าเริ่มต้น)',rows>0,`${rows} หมวด`);
  } else check('Budget Settings กางออกมาแสดงรายการหมวดได้ (ปิดเป็นค่าเริ่มต้น)',false,'ไม่เจอหัวการ์ด');

  console.log('\n[ข้อ 24/8] หน้า Income + Expenses — reskin เท่านั้น (ห้ามรื้อเป็น bento)');
  const finListScan=async()=>await p.evaluate(()=>{
    const sec=document.querySelector('.fin-section');
    const inlineFs=[...(sec?sec.querySelectorAll('[style]'):[])]
      .filter(e=>e.style.fontSize&&!(e.tagName==='I'&&/\bfa-/.test(e.className)))
      .map(e=>`${e.className}:${e.style.fontSize}`);
    return {
      page:!!document.querySelector('.fin-section.fin-page'),
      bento:document.querySelectorAll('.fin-page .db-bento').length, // ต้อง = 0 (ห้ามรื้อเป็น bento)
      table:document.querySelectorAll('.fin-page .exp-table').length, // ต้องยังอยู่ (คงความหนาแน่นไว้)
      showMore:document.querySelectorAll('.fin-page .exp-table-wrap').length,
      donuts:document.querySelectorAll('.fin-page .db-donut').length,
      recharts:document.querySelectorAll('.fin-page .recharts-wrapper').length,
      legacy:document.querySelectorAll('.fin-page .card, .fin-page .empty, .fin-page .fin-pie-split, .fin-page .fin-pie-card').length,
      dbCards:document.querySelectorAll('.fin-page .db-card').length,
      donutW:(()=>{const d=document.querySelector('.fin-page .db-donut');return d?Math.round(d.getBoundingClientRect().width):0;})(),
      inlineFs,
    };
  });
  await p.locator('button:has-text("Income")').first().click(); await p.waitForTimeout(1800);
  const inc8=await finListScan();
  check('Income: ใช้ .fin-page แต่ไม่ใช่ bento (ยังเป็นรายการ/ตาราง)',inc8.page&&inc8.bento===0&&inc8.table>=1,`bento ${inc8.bento} · table ${inc8.table}`);
  check('Income: โดนัท DashDonut แทน CategoryPieCard เดิม (ไม่ใช่ Recharts)',inc8.donuts>=1&&inc8.recharts===0,`${inc8.donuts} วง · recharts ${inc8.recharts}`);
  check('Income: วงโดนัทขยายใหญ่ขึ้นตามที่ ohm ขอ (140-340px แทน 104px เดิม)',inc8.donutW>=140&&inc8.donutW<=340,`${inc8.donutW}px`);
  check('Income: ไม่เหลือคลาสธีมเก่า (.card/.empty/.fin-pie-*)',inc8.legacy===0,`เจอ ${inc8.legacy}`);
  check('Income: การ์ดใช้ธีม db-card (โดนัท + Add Income + by Source + All Income)',inc8.dbCards===4,`${inc8.dbCards} การ์ด`);
  check('Income: ไม่เหลือ fontSize inline',inc8.inlineFs.length===0,inc8.inlineFs.slice(0,5).join(' | '));
  check('Income: ปุ่ม Import Payslip ยังอยู่ (สโคป CSS-only ไม่รวบปุ่ม)',await p.locator('.fin-page .slip-btn:has-text("Import Payslip")').count()>0);
  // เพิ่มรายรับจริงผ่านฟอร์ม แล้วต้องขึ้นในตารางทันที (ตรรกะ addIncome เดิมไม่ได้แตะ)
  await p.locator('.fin-page input[type=date]').first().fill('2026-07-20');
  await p.locator('.fin-page input[type=number]').first().fill('999');
  await p.locator('.fin-page input[placeholder*="เงินเดือน"]').fill('ทดสอบ 24/8');
  await p.locator('.fin-page .icon-btn').first().click(); await p.waitForTimeout(1000);
  const incAdded=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).finance.income.some(i=>i.source==='ทดสอบ 24/8'&&i.amount===999));
  check('Income: เพิ่มรายรับจากฟอร์มยังทำงานปกติ',incAdded);

  await p.locator('button:has-text("Expenses")').first().click(); await p.waitForTimeout(1800);
  const exp8=await finListScan();
  check('Expenses: ใช้ .fin-page แต่ไม่ใช่ bento (ยังเป็นรายการ/ตาราง)',exp8.page&&exp8.bento===0&&exp8.table>=1,`bento ${exp8.bento} · table ${exp8.table}`);
  check('Expenses: โดนัท DashDonut แทน CategoryPieCard เดิม (ไม่ใช่ Recharts)',exp8.donuts>=1&&exp8.recharts===0,`${exp8.donuts} วง · recharts ${exp8.recharts}`);
  check('Expenses: วงโดนัทขยายใหญ่ขึ้นตามที่ ohm ขอ (140-340px แทน 104px เดิม)',exp8.donutW>=140&&exp8.donutW<=340,`${exp8.donutW}px`);
  check('Expenses: ไม่เหลือคลาสธีมเก่า (.card/.empty/.fin-pie-*)',exp8.legacy===0,`เจอ ${exp8.legacy}`);
  check('Expenses: การ์ดใช้ธีม db-card (โดนัท + Add Expense + by Category + All Expenses)',exp8.dbCards===4,`${exp8.dbCards} การ์ด`);
  check('Expenses: ไม่เหลือ fontSize inline',exp8.inlineFs.length===0,exp8.inlineFs.slice(0,5).join(' | '));
  check('Expenses: ปุ่ม Import CSV ยังอยู่ (สโคป CSS-only ไม่รวบปุ่ม)',await p.locator('.fin-page button:has-text("Import CSV")').count()>0);
  check('Expenses: แบนเนอร์เตือน "อื่นๆ" ใช้คลาส .fin-banner ใหม่ (ไม่ใช่ inline style เดิม)',await p.evaluate(()=>{const b=document.querySelector('.fin-page .fin-banner.info');return !b||!b.getAttribute('style');}));
  // เพิ่มรายจ่ายจริงผ่านฟอร์ม แล้วต้องขึ้นในตารางทันที (ตรรกะ addExpense เดิมไม่ได้แตะ)
  await p.locator('.fin-page input[type=date]').first().fill('2026-07-21');
  await p.locator('.fin-page input[type=number]').first().fill('321');
  await p.locator('.fin-page input[placeholder*="อาหาร"]').fill('ทดสอบหมวด 24/8');
  await p.locator('.fin-page .icon-btn').first().click(); await p.waitForTimeout(1000);
  const expAdded=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).finance.expenses.some(e=>e.category==='ทดสอบหมวด 24/8'&&e.amount===-321));
  check('Expenses: เพิ่มรายจ่ายจากฟอร์มยังทำงานปกติ',expAdded);

  console.log('\n[ข้อ 24/3] หน้า Investments รีดีไซน์ตามธรรมนูญข้อ 32');
  await p.locator('button:has-text("Investments")').first().click(); await p.waitForTimeout(2000);
  const inv=await p.evaluate(()=>{
    const sec=document.querySelector('.fin-section');
    /* ไอคอน makeIcon() ตั้ง fontSize inline เป็นดีไซน์ของมันเอง (ทั้งแอปรวมหน้า Home) — ไม่นับ */
    const inlineFs=[...(sec?sec.querySelectorAll('[style]'):[])]
      .filter(e=>e.style.fontSize&&!(e.tagName==='I'&&/\bfa-/.test(e.className)))
      .map(e=>`${e.className}:${e.style.fontSize}`);
    const heroTitle=document.querySelector('.fin-page .db-hero-title');
    return {
      page:!!document.querySelector('.fin-section.fin-page'),
      hero:!!heroTitle,
      heroFs:heroTitle?getComputedStyle(heroTitle).fontSize:'',
      heroMargin:heroTitle?getComputedStyle(heroTitle).marginTop:'',
      bento:!!document.querySelector('.fin-page .db-bento'),
      cards:document.querySelectorAll('.fin-page .db-bento > .db-card').length,
      bignums:document.querySelectorAll('.fin-page .db-bignum .n').length,
      donutSegs:document.querySelectorAll('.fin-page .db-donut svg circle').length,
      legend:document.querySelectorAll('.fin-page .db-lg').length,
      bars:document.querySelectorAll('.inv-bars .db-bar').length,
      pnlBars:document.querySelectorAll('.pnl-bar-fill').length,
      platGrid:!!document.querySelector('.crypto-platform-grid'),
      platCols:document.querySelectorAll('.crypto-platform-col').length,
      itemCards:document.querySelectorAll('.inv-item-card').length,
      tables:document.querySelectorAll('.fin-section table').length,
      // ธรรมนูญ 32/2: ปุ่มเพิ่มข้อมูลระดับหน้าต้องเหลือปุ่มเดียว (ปุ่ม + DCA บนการ์ดเหรียญไม่นับ)
      addBtns:[...document.querySelectorAll('.fin-page button')].filter(b=>/เพิ่มข้อมูล|เพิ่มเหรียญ|เพิ่มรายการ/.test(b.textContent||'')).map(b=>b.textContent.trim()),
      // ธีมเก่า: ต้องไม่เหลือ .card / .empty / .fin-stat-card ของธีมม่วงในหน้านี้
      legacy:document.querySelectorAll('.fin-page .card, .fin-page .empty, .fin-page .fin-stat-card, .fin-page .inv-alloc-grid').length,
      recharts:document.querySelectorAll('.fin-page .recharts-wrapper').length,
      inlineFs,
    };
  });
  check('หน้าใช้โครง .fin-page + .db-bento',inv.page&&inv.bento,`การ์ด ${inv.cards} ใบ`);
  check('ฮีโร่ 38px และมี margin:0 (ข้อ 31)',inv.hero&&inv.heroFs==='38px'&&inv.heroMargin==='0px',`${inv.heroFs} / margin-top ${inv.heroMargin}`);
  check('ตัวเลขใหญ่สรุป 3 ตัวในฮีโร่',inv.bignums===3,`${inv.bignums} ตัว`);
  check('โดนัท Allocation วาดจริง (DashDonut ไม่ใช่ Recharts)',inv.donutSegs>1&&inv.recharts===0,`${inv.donutSegs} วง · legend ${inv.legend} · recharts ${inv.recharts}`);
  check('กราฟแท่งเงินใส่รายเดือน',inv.bars>0,`${inv.bars} แท่ง`);
  check('แถบพลังกำไร/ขาดทุน',inv.pnlBars>0,`${inv.pnlBars} แถบ`);
  check('กริดพอร์ตคริปโตแยกคอลัมน์',inv.platGrid&&inv.platCols>=2,`${inv.platCols} คอลัมน์`);
  check('รายการเป็นการ์ด ไม่ใช่ตาราง',inv.itemCards>0&&inv.tables===0,`การ์ด ${inv.itemCards} · ตารางเหลือ ${inv.tables}`);
  check('ปุ่มเพิ่มข้อมูลเหลือปุ่มเดียว (ข้อ 32/2)',inv.addBtns.length===1,inv.addBtns.join(' | ')||'ไม่เจอปุ่มเลย');
  check('ไม่เหลือคลาสธีมเก่าในหน้านี้',inv.legacy===0,`เจอ ${inv.legacy}`);
  check('ไม่เหลือ fontSize inline ในหน้านี้ (ข้อ 32/4)',inv.inlineFs.length===0,inv.inlineFs.slice(0,5).join(' | '));
  // ปุ่มเดียว → โมดัลเลือกชนิด → เลือก "เหรียญคริปโต" → AddCoinModal
  const addBtn=p.locator('.inv-add-btn').first();
  if(await addBtn.count()){
    await addBtn.click(); await p.waitForTimeout(800);
    const picker=await p.evaluate(()=>document.querySelectorAll('.modal-backdrop .quick-type-row.inv-pick .quick-type-btn').length);
    check('โมดัลเลือกชนิดข้อมูลเปิดได้',picker===2,`${picker} ตัวเลือก`);
    await p.locator('.quick-type-btn:has-text("เหรียญคริปโต")').first().click().catch(()=>{}); await p.waitForTimeout(900);
    const modal=await p.evaluate(()=>{const m=document.querySelector('.modal-backdrop .modal');return m?{inputs:m.querySelectorAll('input').length,datalist:!!document.querySelector('datalist')}:null;});
    check('modal เพิ่มเหรียญเปิดได้',!!modal&&modal.inputs>3,modal?`${modal.inputs} ช่องกรอก · datalist=${modal.datalist}`:"");
    await p.locator('.modal-close').first().click().catch(()=>{}); await p.waitForTimeout(600);
  } else check('modal เพิ่มเหรียญเปิดได้',false,'ไม่เจอปุ่ม .inv-add-btn');
  // การ์ดพับได้: กดหัวการ์ด "รายการทั้งหมด" แล้วต้องกางออกมา
  const collapseHead=p.locator('.db-head:has-text("Savings & Investments")').first();
  if(await collapseHead.count()){
    const before=await p.evaluate(()=>document.querySelectorAll('.inv-item-card').length);
    await collapseHead.click(); await p.waitForTimeout(800);
    const after=await p.evaluate(()=>document.querySelectorAll('.inv-item-card').length);
    check('การ์ดพับได้กางรายการยาวออกมา (ข้อ 32/3)',after>before,`${before} → ${after} การ์ด`);
  } else check('การ์ดพับได้กางรายการยาวออกมา (ข้อ 32/3)',false,'ไม่เจอหัวการ์ด');

  console.log('\n[ข้อ 24/6 Tracker] หน้า Tracker รีดีไซน์ตามธรรมนูญข้อ 32');
  await p.locator('button:has-text("Tracker")').first().click(); await p.waitForTimeout(2000);
  const ov6=await p.evaluate(()=>{
    const root='.trk-page';
    const sec=document.querySelector(root);
    const inlineFs=[...(sec?sec.querySelectorAll('[style]'):[])]
      .filter(e=>e.style.fontSize&&!(e.tagName==='I'&&/\bfa-/.test(e.className))&&!e.closest('svg'))
      .map(e=>`${e.className}:${e.style.fontSize}`);
    const h=document.querySelector(root+' .db-hero-title');
    return {
      page:!!sec,
      heroFs:h?getComputedStyle(h).fontSize:'',
      heroMargin:h?getComputedStyle(h).marginTop:'',
      cards:document.querySelectorAll(root+' .db-bento > .db-card').length,
      bignums:document.querySelectorAll(root+' .db-bignum .n').length,
      donuts:document.querySelectorAll(root+' .db-donut').length,
      prjInCard:document.querySelectorAll(root+' .db-card .prj-card').length,
      filters:document.querySelectorAll(root+' .fin-range-btn').length,
      addBtns:[...document.querySelectorAll(root+' button')].filter(b=>/เพิ่มข้อมูล/.test(b.textContent||'')).map(b=>b.textContent.trim()),
      legacy:document.querySelectorAll(root+' .card, '+root+' .empty, '+root+' .goal-stat-card, '+root+' .tracker-split, '+root+' table').length,
      inlineFs,
    };
  });
  check('Tracker · หน้าใช้โครง .trk-page + db-bento',ov6.page&&ov6.cards>=3,`การ์ด ${ov6.cards} ใบ`);
  check('Tracker · ฮีโร่ 38px และมี margin:0 (ข้อ 31)',ov6.heroFs==='38px'&&ov6.heroMargin==='0px',`${ov6.heroFs} / margin-top ${ov6.heroMargin}`);
  check('Tracker · ตัวเลขใหญ่สรุป 3 ตัว',ov6.bignums===3,`${ov6.bignums} ตัว`);
  check('Tracker · โดนัทสถานะโปรเจกต์',ov6.donuts===1,`${ov6.donuts} วง`);
  check('Tracker · ตัวกรองเป็นแคปซูล 4 ปุ่ม',ov6.filters===4,`${ov6.filters} ปุ่ม`);
  check('Tracker · การ์ดโปรเจกต์อยู่ในการ์ด bento',ov6.prjInCard>=3,`${ov6.prjInCard} การ์ด`);
  check('Tracker · ปุ่มเพิ่มข้อมูลเหลือปุ่มเดียว (ข้อ 32/2)',ov6.addBtns.length===1,ov6.addBtns.join(' | ')||'ไม่เจอปุ่มเลย');
  check('Tracker · ไม่เหลือคลาสธีมเก่า/ตาราง',ov6.legacy===0,`เจอ ${ov6.legacy}`);
  check('Tracker · ไม่เหลือ fontSize inline (ข้อ 32/4)',ov6.inlineFs.length===0,ov6.inlineFs.slice(0,5).join(' | '));
  const trkAdd=p.locator('.trk-page .inv-add-btn').first();
  if(await trkAdd.count()){
    await trkAdd.click(); await p.waitForTimeout(800);
    const pick=await p.evaluate(()=>[...document.querySelectorAll('.modal-backdrop .quick-type-btn')].map(b=>b.textContent.trim()));
    check('Tracker · ปุ่มเดียวเปิดโมดัลเลือกชนิด (โปรเจกต์/งาน)',pick.length===2,pick.join(' | '));
    await p.locator('.modal-close').first().click().catch(()=>{}); await p.waitForTimeout(500);
  } else check('Tracker · ปุ่มเดียวเปิดโมดัลเลือกชนิด (โปรเจกต์/งาน)',false,'ไม่เจอปุ่ม');
  // หน้ารายละเอียดโปรเจกต์ (ใช้โปรเจกต์แบบตัวเลข = การ์ดครบที่สุด)
  await p.locator('.prj-card:has-text("เก็บเงินล้าน")').first().click(); await p.waitForTimeout(1800);
  const det6=await p.evaluate(()=>{
    const root='.trk-page';
    const sec=document.querySelector(root);
    const inlineFs=[...(sec?sec.querySelectorAll('[style]'):[])]
      .filter(e=>e.style.fontSize&&!(e.tagName==='I'&&/\bfa-/.test(e.className))&&!e.closest('svg'))
      .map(e=>`${e.className}:${e.style.fontSize}`);
    const h=document.querySelector(root+' .db-hero-title');
    return {
      title:h?h.textContent.trim():'',
      heroFs:h?getComputedStyle(h).fontSize:'',
      heroMargin:h?getComputedStyle(h).marginTop:'',
      cards:document.querySelectorAll(root+' .db-bento > .db-card').length,
      ring:!!document.querySelector(root+' .prj-big-ring'),
      ciRows:document.querySelectorAll(root+' .trk-ci-row').length,
      addBtns:[...document.querySelectorAll(root+' button')].filter(b=>/เพิ่มข้อมูล/.test(b.textContent||'')).map(b=>b.textContent.trim()),
      legacy:document.querySelectorAll(root+' .card, '+root+' .empty, '+root+' .prj-stat, '+root+' table').length,
      inlineFs,
    };
  });
  check('ProjectDetail · ฮีโร่เป็นชื่อโปรเจกต์ 38px + margin:0',det6.heroFs==='38px'&&det6.heroMargin==='0px'&&/เก็บเงินล้าน/.test(det6.title),`${det6.title} · ${det6.heroFs}`);
  check('ProjectDetail · เป็น bento และยังมีวงแหวนความคืบหน้า',det6.cards>=4&&det6.ring,`การ์ด ${det6.cards} ใบ`);
  check('ProjectDetail · ปุ่มเพิ่มข้อมูลเหลือปุ่มเดียว (ข้อ 32/2)',det6.addBtns.length===1,det6.addBtns.join(' | ')||'ไม่เจอปุ่มเลย');
  check('ProjectDetail · ไม่เหลือคลาสธีมเก่า/ตาราง',det6.legacy===0,`เจอ ${det6.legacy}`);
  check('ProjectDetail · ไม่เหลือ fontSize inline (ข้อ 32/4)',det6.inlineFs.length===0,det6.inlineFs.slice(0,5).join(' | '));
  // ประวัติ check-in เป็นแถว ไม่ใช่ตาราง — ต้องกางการ์ดก่อน (defaultOpen=false)
  // ต้องเจาะที่ .db-title เป๊ะๆ — :has-text จับ "คำนวณจากประวัติ check-in 2 ครั้ง" ในการ์ดตัวเลขสำคัญด้วย
  const ciHead=p.locator('.trk-page .db-card .db-head:has(.db-title:text-is("ประวัติ Check-in"))').first();
  if(await ciHead.count()){
    await ciHead.click(); await p.waitForTimeout(800);
    const ci=await p.evaluate(()=>document.querySelectorAll('.trk-ci-row').length);
    check('ProjectDetail · ประวัติ check-in เป็นแถวการ์ด ไม่ใช่ตาราง',ci===2,`${ci} แถว`);
  } else check('ProjectDetail · ประวัติ check-in เป็นแถวการ์ด ไม่ใช่ตาราง',false,'ไม่เจอการ์ด');
  await p.locator('.trk-back').first().click(); await p.waitForTimeout(1200);

  console.log('\n[ข้อ 24/9 Book Queue] หน้า Book Queue รีดีไซน์ตามธรรมนูญข้อ 32');
  await p.locator('button:has-text("Books")').first().click(); await p.waitForTimeout(1800);
  const bq=await p.evaluate(()=>{
    const sec=document.querySelector('.book-page');
    const inlineFs=[...(sec?sec.querySelectorAll('[style]'):[])]
      .filter(e=>e.style.fontSize&&!(e.tagName==='I'&&/\bfa-/.test(e.className)))
      .map(e=>`${e.className}:${e.style.fontSize}`);
    const h=document.querySelector('.book-page .db-hero-title');
    return {
      page:!!document.querySelector('.book-page'),
      heroFs:h?getComputedStyle(h).fontSize:'',
      heroMargin:h?getComputedStyle(h).marginTop:'',
      heroText:h?h.textContent.trim():'',
      cards:document.querySelectorAll('.book-page .db-bento > .db-card').length,
      bignums:document.querySelectorAll('.book-page .db-bignum .n').length,
      addBtns:[...document.querySelectorAll('.book-page button')].filter(b=>/เพิ่มข้อมูล/.test(b.textContent||'')).map(b=>b.textContent.trim()),
      legacy:document.querySelectorAll('.book-page .card, .book-page .empty, .book-page .text-btn').length,
      bookItems:document.querySelectorAll('.book-page .book-item').length,
      badges:document.querySelectorAll('.book-page .book-status-badge').length,
      readingRows:document.querySelectorAll('.book-page .db-row').length,
      inlineFs,
    };
  });
  check('หน้าใช้โครง .book-page + db-hero + db-bento',bq.page&&bq.cards>=3,`การ์ด ${bq.cards} ใบ`);
  check('ฮีโร่ 38px และมี margin:0 (ข้อ 31) + ชื่อถูกต้อง',bq.heroFs==='38px'&&bq.heroMargin==='0px'&&/Book Queue/.test(bq.heroText),`${bq.heroFs} / margin-top ${bq.heroMargin} / "${bq.heroText}"`);
  check('ตัวเลขใหญ่สรุป 3 ตัว (ต้องอ่าน/กำลังอ่าน/อ่านแล้ว)',bq.bignums===3,`${bq.bignums} ตัว`);
  check('ปุ่มเพิ่มข้อมูลเหลือปุ่มเดียว (ข้อ 32/2)',bq.addBtns.length===1,bq.addBtns.join(' | ')||'ไม่เจอปุ่มเลย');
  check('ไม่เหลือคลาสธีมเก่า (.card/.empty/.text-btn เดิม) ในหน้านี้',bq.legacy===0,`เจอ ${bq.legacy}`);
  check('ไม่เหลือ fontSize inline ในหน้านี้ (ข้อ 32/4)',bq.inlineFs.length===0,bq.inlineFs.slice(0,5).join(' | '));
  check('การ์ด "กำลังอ่าน" แสดงเล่ม seed (bk1) เป็นแถว db-row',bq.readingRows>=1,`${bq.readingRows} แถว`);
  check('รายการหนังสือทั้งหมด (DashCollapse) แสดงครบ 2 เล่มจาก seed พร้อมป้ายสถานะ',bq.bookItems===2&&bq.badges===2,`การ์ด ${bq.bookItems} ใบ · ป้าย ${bq.badges}`);
  // กด "อ่านจบแล้ว" บนเล่มที่กำลังอ่าน (bk1) → ต้องเลื่อนสถานะเป็น done จริงใน localStorage
  const advanceBtn=p.locator('.book-page .db-row .pill-btn.primary').first();
  if(await advanceBtn.count()){
    await advanceBtn.click(); await p.waitForTimeout(1000);
    const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).bookQueue.find(b=>b.id==='bk1')?.status);
    check('กด "อ่านจบแล้ว" แล้วสถานะเลื่อนเป็น done จริง',st==='done',`status=${st}`);
  } else check('กด "อ่านจบแล้ว" แล้วสถานะเลื่อนเป็น done จริง',false,'ไม่เจอปุ่ม');
  // ปุ่มเดียว → BookFormModal เปิด แล้วเพิ่มหนังสือใหม่ได้จริง
  const bqAdd=p.locator('.book-page .inv-add-btn').first();
  if(await bqAdd.count()){
    await bqAdd.click(); await p.waitForTimeout(800);
    const hasModal=await p.evaluate(()=>!!document.querySelector('.modal-backdrop .modal-head'));
    check('ปุ่มเพิ่มข้อมูลเปิด BookFormModal ได้',hasModal);
    if(hasModal){
      await p.locator('.modal-backdrop input').first().fill('เพิ่มหนังสือทดสอบ 24/9');
      await p.locator('.modal-backdrop .modal-btn-save').click(); await p.waitForTimeout(1000);
      const added=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).bookQueue.some(b=>b.title==='เพิ่มหนังสือทดสอบ 24/9'));
      check('เพิ่มหนังสือใหม่จากโมดัลได้จริง',added);
    } else check('เพิ่มหนังสือใหม่จากโมดัลได้จริง',false,'ไม่มีโมดัล');
  } else check('ปุ่มเพิ่มข้อมูลเปิด BookFormModal ได้',false,'ไม่เจอปุ่ม');
  // ปุ่มแก้ไขบนการ์ดในรายการทั้งหมด → โมดัลเดิมพร้อมค่าเก่า
  const bqEdit=p.locator('.book-page .book-item .db-chip[title="แก้ไข"]').first();
  if(await bqEdit.count()){
    await bqEdit.click(); await p.waitForTimeout(800);
    const ed=await p.evaluate(()=>{
      const m=document.querySelector('.modal-backdrop .modal');
      return m?{head:m.querySelector('.modal-head span')?.textContent.trim(),title:m.querySelector('input')?.value}:null;
    });
    check('ปุ่มแก้ไขเปิดโมดัลพร้อมค่าเดิม',!!ed&&/แก้ไข/.test(ed.head||'')&&!!ed.title,ed?`${ed.head} · ${ed.title}`:'');
    await p.locator('.modal-close').first().click().catch(()=>{}); await p.waitForTimeout(500);
  } else check('ปุ่มแก้ไขเปิดโมดัลพร้อมค่าเดิม',false,'ไม่เจอปุ่มแก้ไข');
  // ลบเล่มหนึ่งออกจากรายการทั้งหมด → หายจริงใน localStorage
  const beforeDel=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).bookQueue.length);
  const bqDel=p.locator('.book-page .book-item .db-chip[title="ลบ"]').first();
  if(await bqDel.count()){
    await bqDel.click(); await p.waitForTimeout(1000);
    const afterDel=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).bookQueue.length);
    check('ลบหนังสือออกจากรายการได้จริง',afterDel===beforeDel-1,`${beforeDel} → ${afterDel}`);
  } else check('ลบหนังสือออกจากรายการได้จริง',false,'ไม่เจอปุ่มลบ');

  /* ───────── รอบ 21: หมุดโปรเจกต์ + toast ───────── */
  console.log('\n[ข้อ 21] หมุดโปรเจกต์ + toast');
  await p.locator('button:has-text("Tracker")').first().click().catch(async()=>{
    await p.locator('.sidebar button').nth(2).click();
  });
  await p.waitForTimeout(1800);
  const cardTicks=await p.evaluate(()=>({
    ticks:document.querySelectorAll('.prj-bar-ms').length,
    hit:document.querySelectorAll('.prj-bar-ms.hit').length,
    nextLine:(document.querySelector('.prj-card-next-ms')||{}).innerText||"",
    cards:document.querySelectorAll('.prj-card').length}));
  check('ขีดหมุดบนการ์ดหน้า Tracker',cardTicks.ticks>=6,`${cardTicks.ticks} ขีด (ถึงแล้ว ${cardTicks.hit}) จาก ${cardTicks.cards} การ์ด`);
  check('บรรทัด "หมุดถัดไป" บนการ์ด',/หมุดถัดไป/.test(cardTicks.nextLine),cardTicks.nextLine.replace(/\n/g,' '));

  await p.locator('.prj-card:has-text("โปรเจกต์กำหนดเอง")').first().click(); await p.waitForTimeout(1600);
  const det=await p.evaluate(()=>({
    card:!!document.querySelector('.ms-track'),
    items:document.querySelectorAll('.ms-item').length,
    hits:document.querySelectorAll('.ms-item.hit').length,
    // ข้อ 24/6: หัวการ์ดย้ายจาก .card-head → .db-head ของ DashCollapse (นับอยู่ใน note ไม่ใช่วงเล็บ)
    head:(Array.from(document.querySelectorAll('.db-head')).find(e=>/หมุดความคืบหน้า/.test(e.innerText))||{}).innerText||"",
    firstItem:(document.querySelector('.ms-item')||{}).innerText||"",
    named:document.body.innerText.includes('ครึ่งทาง')}));
  check('การ์ดหมุดในหน้ารายละเอียด',det.card&&det.items===4,`${det.items} หมุด (ถึงแล้ว ${det.hits})`);
  check('หัวการ์ดนับถูก',/ถึงแล้ว 1 จาก 4 หมุด/.test(det.head),det.head.replace(/\n/g,' '));
  check('หมุดที่ตั้งชื่อแสดงชื่อ',det.named,'หา "ครึ่งทาง"');
  check('หมุดไม่ตั้งชื่อแสดงเป็น %',/^25%/.test(det.firstItem.trim()),det.firstItem.split('\n')[0]);

  const slider=p.locator('input[type=range]').first();
  await slider.fill('60'); await p.waitForTimeout(2200);
  const toast=await p.evaluate(()=>({
    n:document.querySelectorAll('.ms-toast').length,
    text:(document.querySelector('.ms-toast')||{}).innerText||"",
    wrapFixed:getComputedStyle(document.querySelector('.ms-toast-wrap')||document.body).position,
    hits:document.querySelectorAll('.ms-item.hit').length}));
  check('toast เด้งเมื่อข้ามหมุด 50%',toast.n>0&&/ถึงหมุดแล้ว/.test(toast.text),toast.text.replace(/\n/g,' · '));
  check('หมุด 50% ถูกทำเครื่องหมายว่าถึงแล้ว',toast.hits===2,`ถึงแล้ว ${toast.hits}/4`);
  // toast ต้องอยู่ข้ามหน้าได้
  await p.locator('button:has-text("Finance")').first().click(); await p.waitForTimeout(900);
  const toastCross=await p.evaluate(()=>document.querySelectorAll('.ms-toast').length);
  check('toast ยังอยู่เมื่อสลับหน้า',toastCross>0,`${toastCross} อัน`);
  const act=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).activity.filter(a=>/ถึงหมุด/.test(a.text)).length);
  check('บันทึกลง activity',act>0,`${act} รายการ`);
  // persist ไม่วนซ้ำ
  const logLenA=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).activity.length);
  await p.waitForTimeout(2500);
  const logLenB=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).activity.length);
  check('ไม่ persist วนซ้ำ (activity นิ่ง)',logLenA===logLenB,`${logLenA} → ${logLenB}`);
  const plog=await p.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('secretary-dashboard-v1')).progressLog||{}).length);
  check('progressLog ไม่ถูกเขียนทับหาย',plog>=3,`${plog} วัน`);

  // ตัวแก้ไขหมุดใน ProjectModal
  await p.locator('button:has-text("Tracker")').first().click(); await p.waitForTimeout(1500);
  await p.locator('.prj-card:has-text("โปรเจกต์แบบงาน")').first().click(); await p.waitForTimeout(1400);
  await p.locator('button:has-text("แก้ไข")').first().click(); await p.waitForTimeout(1200);
  const editor=await p.evaluate(()=>({
    section:document.body.innerText.includes('หมุดความคืบหน้า (milestones)'),
    rows:document.querySelectorAll('.ms-edit-row').length,
    autoBtn:!!Array.from(document.querySelectorAll('button')).find(b=>/แบ่งอัตโนมัติ/.test(b.innerText))}));
  check('ส่วนตั้งหมุดอยู่ในโมดัลแก้ไข',editor.section&&editor.autoBtn,`แถวหมุดตอนเริ่ม ${editor.rows}`);
  await p.locator('button:has-text("แบ่งอัตโนมัติ")').first().click(); await p.waitForTimeout(800);
  const afterAuto=await p.evaluate(()=>Array.from(document.querySelectorAll('.ms-edit-pct')).map(i=>i.value).join(','));
  check('ปุ่มแบ่งอัตโนมัติสร้าง 25/50/75/100',afterAuto==='25,50,75,100',afterAuto);
  await p.locator('.modal-btn-save').first().click(); await p.waitForTimeout(1600);
  const saved=await p.evaluate(()=>(JSON.parse(localStorage.getItem('secretary-dashboard-v1')).projects.find(x=>x.id==='p3')||{}).milestones||[]);
  check('บันทึกหมุดลง localStorage จริง',saved.length===4,`${saved.length} หมุด: ${saved.map(m=>m.pct).join(',')}`);

  /* ───────── รอบ 20: หน้ายืนยัน Import JSON ───────── */
  console.log('\n[ข้อ 20] หน้ายืนยัน Import JSON');
  dialogs.length=0;
  await p.setInputFiles('#importJsonFile',{name:'junk.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({a:1}))});
  await p.waitForTimeout(1400);
  const junkOverlay=await p.evaluate(()=>!!document.getElementById('importConfirmOverlay'));
  check('ไฟล์ไม่ใช่ของแอปนี้ → เตือนแล้วไม่นำเข้า',dialogs.some(d=>/ไม่ใช่ไฟล์สำรอง/.test(d))&&!junkOverlay,(dialogs[0]||'').split('\n')[0]);

  dialogs.length=0;
  await p.setInputFiles('#importJsonFile',{name:'secretary-backup-2026-08-23.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(SEED))});
  await p.waitForTimeout(1400);
  const ov=await p.evaluate(()=>{
    const o=document.getElementById('importConfirmOverlay');
    if(!o) return null;
    return {rows:o.querySelectorAll('tbody tr').length,text:o.innerText.replace(/\n+/g,' | '),
      buttons:Array.from(o.querySelectorAll('button')).map(b=>b.id).join(',')};
  });
  check('หน้ายืนยันเปิดขึ้น',!!ov,ov?`${ov.rows} แถว · ปุ่ม ${ov.buttons}`:'ไม่มี overlay');
  if(ov){
    check('ตารางครบ 5 หมวด',ov.rows===5,`${ov.rows} แถว`);
    check('โชว์จำนวน+ช่วงวันที่+ยอดรวม',/745|5 รายการ/.test(ov.text)&&/2026-07/.test(ov.text)&&/฿/.test(ov.text),ov.text.slice(0,150));
    await p.locator('#icCancel').click(); await p.waitForTimeout(900);
    const gone=await p.evaluate(()=>!document.getElementById('importConfirmOverlay'));
    check('กดยกเลิกแล้วปิด ไม่เขียนทับ',gone);
    const stillThere=await p.evaluate(()=>(JSON.parse(localStorage.getItem('secretary-dashboard-v1')).projects||[]).length);
    check('ข้อมูลเดิมยังอยู่หลังยกเลิก',stillThere===3,`${stillThere} โปรเจกต์`);
  }

  /* ───────── จอมือถือ: ห้าม scroll แนวนอน ───────── */
  /* ───────── ข้อ 24/6: กันสเกล/สีธีมเก่ากลับมา ─────────
     ตรวจทุกหน้า: ห้ามมีสีม่วงของธีมเดิม และห้ามมีตัวอักษรใหญ่เกินตารางสเกลในธรรมนูญข้อ 32 */
  console.log('\n[ข้อ 24/6] สเกล + สีทั้งแอปต้องสัมพันธ์กับหน้า Home');
  // ตัวเลข/หัวข้อที่ตั้งใจให้ใหญ่ (ดูตารางสเกลในข้อ 32) — 24 = เลขกลางวงแหวนโมเมนตัมหน้า Home ที่ ohm อนุมัติแล้ว
  const ALLOWED_BIG=[15,18,20,22,24,26,30,32,38,40];
  const scanPage=async(label)=>await p.evaluate((allowed)=>{
    const purple=(r,g,b)=>b>g+18&&r>g+4&&b>60;
    const parse=(c)=>{const m=/rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c||"");return m?[+m[1],+m[2],+m[3]]:null;};
    const root=document.querySelector('.content-main')||document.body;
    const els=[...root.querySelectorAll('*')].filter(e=>e.offsetParent!==null);
    const badFs=[],badColor=[];
    for(const e of els){
      const cs=getComputedStyle(e);
      const isIcon=e.tagName==='I'&&/\bfa-/.test(e.className);
      const cls=(typeof e.className==='string'?e.className:'').trim().split(/\s+/).slice(0,2).join('.');
      const fs=parseFloat(cs.fontSize);
      const hasText=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
      if(!isIcon&&fs>14&&!allowed.includes(fs)&&(hasText||['INPUT','SELECT','BUTTON','TEXTAREA'].includes(e.tagName)))
        badFs.push(`${fs}px ${e.tagName.toLowerCase()}.${cls}`);
      for(const prop of ['color','backgroundColor','borderTopColor']){
        const v=parse(cs[prop]);
        if(v&&purple(...v)) badColor.push(`${cs[prop]} ${prop} ${e.tagName.toLowerCase()}.${cls}`);
      }
    }
    return {badFs:[...new Set(badFs)],badColor:[...new Set(badColor)]};
  },allowed=ALLOWED_BIG);
  for(const [label,click] of [['Home','Home'],['Tracker','Tracker'],['Books','Books']]){
    await p.locator(`.nav-pill button:has-text("${click}")`).first().click().catch(()=>{});
    await p.waitForTimeout(1500);
    const r=await scanPage(label);
    check(`${label} · ไม่มีสีธีมม่วงหลงเหลือ`,r.badColor.length===0,r.badColor.slice(0,3).join(' | '));
    check(`${label} · ไม่มีตัวอักษรนอกสเกล`,r.badFs.length===0,r.badFs.slice(0,3).join(' | '));
  }
  await p.locator('.nav-pill button:has-text("Finance")').first().click(); await p.waitForTimeout(1500);
  for(const t of ['Overview','Review','Income','Expenses','Investments','Debts']){
    await p.locator(`.fin-tab-btn:has-text("${t}")`).first().click().catch(()=>{});
    await p.waitForTimeout(1800);
    const r=await scanPage(t);
    check(`Finance/${t} · ไม่มีสีม่วง + สเกลตรง`,r.badColor.length===0&&r.badFs.length===0,
      [...r.badColor.slice(0,2),...r.badFs.slice(0,2)].join(' | '));
  }

  console.log('\n[จอมือถือ 390px] ห้ามล้นแนวนอน');
  await p.setViewportSize({width:390,height:844}); await p.waitForTimeout(1200);
  await p.locator('button:has-text("Finance")').first().click().catch(()=>{}); await p.waitForTimeout(1200);
  for(const t of ['Overview','Review','Investments','Debts']){
    await p.locator(`button:has-text("${t}")`).first().click().catch(()=>{});
    await p.waitForTimeout(1500);
    const o=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:window.innerWidth}));
    check(`มือถือ · แท็บ ${t} ไม่ล้นแนวนอน`,o.sw<=o.iw+2,`scrollWidth ${o.sw} vs ${o.iw}`);
  }
  await p.locator('button:has-text("Tracker")').first().click().catch(()=>{}); await p.waitForTimeout(1600);
  const mTrk=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:window.innerWidth}));
  check('มือถือ · หน้า Tracker ไม่ล้นแนวนอน',mTrk.sw<=mTrk.iw+2,`scrollWidth ${mTrk.sw} vs ${mTrk.iw}`);
  await p.locator('.prj-card').first().click().catch(()=>{}); await p.waitForTimeout(1600);
  const mDet=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:window.innerWidth}));
  check('มือถือ · หน้ารายละเอียดโปรเจกต์ไม่ล้นแนวนอน',mDet.sw<=mDet.iw+2,`scrollWidth ${mDet.sw} vs ${mDet.iw}`);

  /* ───────── สรุป ───────── */
  const failed=results.filter(r=>!r.ok);
  console.log('\n════════ สรุป ════════');
  console.log(`ผ่าน ${results.length-failed.length}/${results.length}`);
  if(failed.length) console.log('ไม่ผ่าน:\n'+failed.map(r=>'  · '+r.name+(r.detail?'  ('+r.detail+')':'')).join('\n'));
  console.log(errs.length?('\nRUNTIME ERRORS:\n'+errs.join('\n')):'\nNO RUNTIME ERRORS');
  await b.close();
  process.exit(failed.length||errs.length?1:0);
})();
