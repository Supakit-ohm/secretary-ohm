/* smoke-test.js — เทสต์ว่าแอปรันจริงได้ ไม่ใช่แค่ syntax ผ่าน
   วิธีใช้ (ครั้งแรกติดตั้งก่อน):
     npm i playwright react@18.2.0 react-dom@18.2.0 @babel/standalone@7.24.7 prop-types@15.8.1 recharts@2.15.0
     npx playwright install chromium
     node smoke-test.js
   สคริปต์จะสร้าง test-dashboard.html (สำเนาที่ชี้ CDN ไป node_modules) แล้วเปิดด้วย Chromium
   ใส่ข้อมูลตัวอย่างลง localStorage คลิกทุกแท็บ Finance และจับ runtime error
   *** สำคัญ: @babel/standalone ต้อง pin 7.24.7 รุ่นใหม่กว่านี้ throw "Cannot use import statement outside a module" ***
   หมายเหตุ: แก้ไฟล์ preview-dashboard.html เท่านั้น test-dashboard.html เป็นไฟล์ชั่วคราวที่ generate ใหม่ทุกครั้ง */
const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
const SEED={"todos": {"daily": [], "weekly": [], "monthly": []}, "events": [], "notes": [], "finance": {"income": [{"id": "i1", "date": "2026-07-25", "month": "2026-07", "amount": 45000, "source": "เงินเดือน", "note": "", "importSource": "payslip"}], "expenses": [{"id": "e1", "date": "2026-07-02", "amount": -1200, "category": "อื่นๆ", "memo": "7-ELEVEN สาขา 1", "source": "kbank-csv"}, {"id": "e2", "date": "2026-07-05", "amount": -3400, "category": "อื่นๆ", "memo": "LOTUS", "source": "kbank-csv"}, {"id": "e3", "date": "2026-07-09", "amount": -2500, "category": "ผ่อนรถ", "memo": "งวดเดือน ก.ค.", "source": "manual"}, {"id": "e4", "date": "2026-06-09", "amount": -2500, "category": "ผ่อนรถ", "memo": "งวดเดือน มิ.ย.", "source": "manual"}, {"id": "e5", "date": "2026-07-11", "amount": 500, "category": "อาหาร", "memo": "คืนเงิน เพื่อน", "source": "csv-refund"}], "investments": [{"id": "v1", "date": "2026-07-25", "amount": 1500, "name": "กบข.", "type": "retirement", "source": "payslip"}], "investmentValues": {"retirement": {"value": "52000", "updatedAt": "2026-03-01"}}, "cryptoHoldings": [{"id": "c1", "coin": "BTC", "quantity": "0.01", "avgCost": "2000000", "currentPrice": "3000000", "updatedAt": "2026-08-01"}], "cashAccounts": [{"id": "a1", "name": "KBank", "balance": "80000", "updatedAt": "2026-08-20"}], "debts": [{"id": "d1", "kind": "external", "name": "ผ่อนรถ Honda", "type": "car-loan", "principal": 400000, "currentBalance": 250000, "updatedAt": "2026-08-01", "interestRate": 3.5, "minPayment": 2500, "dueDay": 9, "linkedExpenseCategory": "ผ่อนรถ", "note": "", "startDate": "2024-01-01", "source": "manual"}, {"id": "d2", "kind": "self", "name": "ยืมเงินเก็บซ่อมบ้าน", "type": "other", "principal": null, "currentBalance": 30000, "updatedAt": "2026-08-01", "interestRate": null, "minPayment": null, "dueDay": null, "linkedExpenseCategory": null, "note": "", "startDate": "2026-05-01", "source": "manual"}]}, "goals": [], "habits": [], "health": [], "documents": [], "bookQueue": [], "journal": [], "activity": [], "projects": [], "tasks": [], "checkins": [], "budgets": {}, "reviews": {}};
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
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage();
  const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERROR: '+String(e).slice(0,300)));
  p.on('console',m=>{ if(m.type()==='error'&&!/favicon|manifest|sw\.js|Failed to load resource|net::/i.test(m.text())) errs.push('CONSOLE: '+m.text().slice(0,300)); });
  p.on('dialog',async d=>{ console.log('DIALOG:',d.message().slice(0,120)); await d.accept(); });
  await p.addInitScript(d=>localStorage.setItem('secretary-dashboard-v1',JSON.stringify(d)),SEED);
  await p.goto('file://'+path.resolve('test-dashboard.html'));
  await p.waitForTimeout(7000);
  await p.locator('button:has-text("Finance")').first().click(); await p.waitForTimeout(1500);
  console.log('Net Worth:',(await p.evaluate(()=>document.body.innerText)).match(/Net Worth[\s\S]{0,60}/)[0].replace(/\n/g,' | '));
  for(const t of ['Overview','Income','Expenses','Investments','Debts','Review']){
    await p.locator(`button:has-text("${t}")`).first().click().catch(e=>errs.push('CLICK '+t));
    await p.waitForTimeout(1500);
    const len=(await p.evaluate(()=>document.querySelector('.fin-section')?.innerText.length))||0;
    console.log(`TAB ${t}: ${len>50?'OK':'ว่าง/พัง'} (${len} ตัวอักษร)`);
  }
  console.log(errs.length?('\nERRORS:\n'+errs.join('\n')):'\nNO RUNTIME ERRORS');
  await b.close();
  process.exit(errs.length?1:0);
})();
