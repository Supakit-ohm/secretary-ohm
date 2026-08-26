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
    head:(Array.from(document.querySelectorAll('.card-head')).find(e=>/หมุดความคืบหน้า/.test(e.innerText))||{}).innerText||"",
    firstItem:(document.querySelector('.ms-item')||{}).innerText||"",
    named:document.body.innerText.includes('ครึ่งทาง')}));
  check('การ์ดหมุดในหน้ารายละเอียด',det.card&&det.items===4,`${det.items} หมุด (ถึงแล้ว ${det.hits})`);
  check('หัวการ์ดนับถูก',/หมุดความคืบหน้า \(1\/4\)/.test(det.head),det.head.replace(/\n/g,' '));
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
  console.log('\n[จอมือถือ 390px] ห้ามล้นแนวนอน');
  await p.setViewportSize({width:390,height:844}); await p.waitForTimeout(1200);
  await p.locator('button:has-text("Finance")').first().click().catch(()=>{}); await p.waitForTimeout(1200);
  for(const t of ['Overview','Investments','Debts']){
    await p.locator(`button:has-text("${t}")`).first().click().catch(()=>{});
    await p.waitForTimeout(1500);
    const o=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:window.innerWidth}));
    check(`มือถือ · แท็บ ${t} ไม่ล้นแนวนอน`,o.sw<=o.iw+2,`scrollWidth ${o.sw} vs ${o.iw}`);
  }

  /* ───────── สรุป ───────── */
  const failed=results.filter(r=>!r.ok);
  console.log('\n════════ สรุป ════════');
  console.log(`ผ่าน ${results.length-failed.length}/${results.length}`);
  if(failed.length) console.log('ไม่ผ่าน:\n'+failed.map(r=>'  · '+r.name+(r.detail?'  ('+r.detail+')':'')).join('\n'));
  console.log(errs.length?('\nRUNTIME ERRORS:\n'+errs.join('\n')):'\nNO RUNTIME ERRORS');
  await b.close();
  process.exit(failed.length||errs.length?1:0);
})();
