# Personal Secretary Dashboard — เอกสารส่งต่อโปรเจกต์

> **วิธีใช้ไฟล์นี้:** เปิด session ใหม่ แล้วพิมพ์ว่า
> *"อ่าน PROJECT-HANDOFF.md ในโฟลเดอร์ก่อน แล้วทำ [สิ่งที่ต้องการ]"*
> อย่าแปะเนื้อหาไฟล์นี้ลงในแชท — ให้ AI อ่านเองจากดิสก์ ประหยัด token กว่ามาก

อัปเดตล่าสุด: 2026-08-26 (ohm ยืนยันว่า**จัดหมวด "อื่นๆ" ครบแล้ว** → ปัญหาข้อ 1 ในข้อ 5 ปิดได้ · ก่อนหน้านี้ 2026-08-25: ข้อ 20 หน้ายืนยัน Import + ข้อ 21 หมุดโปรเจกต์ **push แล้ว** · ข้อ 22 = รันเทสต์จริงย้อนหลัง 4 รอบ ผ่าน 43/43 ไม่มี runtime error)

> **หมายเหตุ (2026-08-20):** ตัดสินใจแล้วว่าแอปหลักคือ `preview-dashboard.html` (React+Babel ไฟล์เดียว, ฟีเจอร์ครบ) — จะ**ไม่**เขียนใหม่แยกเป็น vanilla-JS PWA เพราะเสียของที่ทำไว้เยอะ (Finance, Payslip import, Tracker ฯลฯ) แทนที่ด้วยการ **เพิ่มชั้น PWA + Google Drive sync เข้าไปใน preview-dashboard.html เอง** ดูแผนเต็มในข้อ 9
> ไฟล์ที่ย้ายไป `_to_delete/` แล้ว (ลบทิ้งถาวรได้เมื่อสะดวก): `secretary-dashboard-preview.html` (รุ่นเก่า), `index.html`/`style.css`/`sw.js` เดิมของ secretary-app (UI คนละแนวทาง ไม่ใช้แล้ว)
> โฟลเดอร์ `secretary-app/` ถูกเปลี่ยนชื่อเป็น **`_reference-drive-sync/`** — เก็บไว้เฉพาะส่วนที่ยังมีประโยชน์: `app.js` (มีโค้ด Google Drive sync ที่ใช้ได้จริง บรรทัด 1420-1585), `config.js`, `manifest.json`, `icons/`, `SETUP.md` (วิธีตั้ง OAuth) — ใช้เป็นวัตถุดิบตอนทำข้อ 9 แล้วลบทิ้งได้

> **กำลังทำต่อ (เริ่ม 2026-08-23) — ปรับปรุงหน้า Investments รอบใหญ่:**
> พื้นฐานเสร็จแล้ว: ประเภทสินทรัพย์ 7 แบบ (เฟส 1-4 เดิม), มูลค่าปัจจุบันกรอกเอง, เป้าหมายลงทุน, **พอร์ตคริปโตรองรับ 2 สกุลเงิน THB/USD** (ข้อ 15), **บันทึกซื้อเพิ่ม/DCA รายงวด + สรุปแยกพอร์ต** (ข้อ 16) — ดูรายละเอียดที่ข้อ 4, 15, 16
> **ทำต่อจากตรงนี้:** ohm มี 2 พอร์ตจริง — `Binance Global` (ถือยาว ไม่ซื้อเพิ่ม) กับ `Binance TH` (ตั้ง DCA ซื้อทุกวัน อัปเดตเดือนละครั้งผ่านปุ่ม "ซื้อเพิ่ม") ยังไม่ได้กรอกข้อมูลจริงลงระบบ
> งานที่ยังไม่ได้ทำ (เรียงตามที่คุยไว้ท้ายข้อ 16): **XIRR/ผลตอบแทน %ต่อปี** จาก `h.buys[]`+`firstHeldDate` (มีข้อมูลพร้อมแล้ว), **หน้าประวัติ DCA ต่อเหรียญ** (เก็บ `buys[]` ไว้แล้วแต่ยังไม่มี UI แสดงรายการย้อนหลัง), **ตั้งเป้าสัดส่วนพอร์ต** เช่น crypto ไม่เกิน 10%, **กราฟมูลค่าพอร์ตตามเวลา** (งานใหญ่ ต้องเปลี่ยน `investmentValues` เป็น history array — ดูข้อ 4.4)
> **workflow git ตั้งเสร็จแล้ว** (2026-08-23) — เครื่อง ohm push ได้เองด้วย `git add -A && git commit -m "..." && git push` (พิมพ์ทีละบรรทัด อย่าต่อด้วย `&&` ถ้าไม่แน่ใจว่ามีอะไรเปลี่ยน) อย่าลืมเตือนให้ push + ทดสอบบน GitHub Pages ทุกครั้งที่แก้เสร็จ

---

## 1. ภาพรวม

แอปเลขาส่วนตัว **ไฟล์ HTML เดียวจบ** ไม่มี backend ไม่มี build step เปิดด้วยเบราว์เซอร์ได้เลย

| หัวข้อ | รายละเอียด |
|---|---|
| ไฟล์หลัก | `preview-dashboard.html` (~282KB) + `styles.css` (~55KB, แยกออกมา 2026-08-22) |
| Stack | React 18.2.0 UMD + Babel standalone (แปลง JSX ในเบราว์เซอร์) |
| กราฟ | Recharts (global `Recharts`) |
| ไอคอน | สร้างเองด้วย `makeIcon()` เป็น inline SVG ไม่ได้ใช้ lucide จริง |
| เก็บข้อมูล | `localStorage` key = **`secretary-dashboard-v1`** |
| ภาษา UI | ไทยผสมอังกฤษ — หัวข้อหน้า Finance เป็นอังกฤษ ที่เหลือเป็นไทย |
| ธีม | มืด พื้น `#0b0817` / ม่วง `#8b5cf6` / เขียว `#34d399` / ส้ม `#fb923c` |
| ฟอนต์ | Noto Sans Thai (ทั่วไป) + IBM Plex Mono (ตัวเลข) |

**สำคัญ (อัปเดต 2026-08-22):** CSS ทั้งหมดย้ายออกไป `styles.css` แล้ว (โหลดผ่าน `<link>` ใน `<head>`) — เดิมอยู่ใน `<style>{\`...\`}</style>` ใน `SecretaryDashboard` **แก้ CSS ที่ `styles.css` เท่านั้น อย่าเพิ่ม `<style>` กลับเข้าไปใน JSX** · JS ทั้งหมดยังอยู่ใน `<script type="text/babel">` เดียวใน `preview-dashboard.html`
- `@import` ฟอนต์ต้องอยู่บรรทัดแรกของ `styles.css` เสมอตามสเปก CSS (const `FONTS` ใน JS ยังอยู่ ใช้กับ loading screen ตอน styles.css ยังโหลดไม่เสร็จ)
- **ไฟล์ที่ต้อง deploy ขึ้น Pages มี 6 อย่าง:** `preview-dashboard.html`, `styles.css`, `config.js`, `sw.js`, `manifest.json`, `icons/`

---

## 2. โครงสร้างไฟล์ (เลขบรรทัดโดยประมาณ)

```
1–90      HTML head, CDN, makeIcon(), ไอคอนทั้งหมด
89–150    utils วันที่: isoDate, todayISO, monthYearKey, normalizeExpenseDate, thaiDate
151–330   Tracker logic: projectProgress, projectVelocity, taskStreak, migrateToTracker
349–405   DEFAULT_DATA  ← โครงข้อมูลตั้งต้นทั้งหมดอยู่ตรงนี้
406–511   Budget & review: FIXED_HINTS, getBudget, buildMonthReview, detectAnomalies
512–580   logActivity, uid, useSecretaryData (hook หลัก + migration)
589–820   UI ย่อย: Ring, TodoRow, Modal ต่างๆ, Sidebar, PageNav
824–905   TxnEditModal, TxnFilterBar        ← แก้ไข/กรองรายการเงิน
907–1000  renderPieLabel, CategoryPieCard   ← กราฟวงกลม + panel รายละเอียด
1003–1580 FinanceOverviewTab / IncomeTab / ExpensesTab / InvestmentsTab / DebtsTab
1588–1680 Payslip: parsePayslip, extractPdfText, extractImageText
1683–1870 SlipImportModal                   ← นำเข้าสลิปเงินเดือน
1871–1990 RecategorizeModal, BudgetPanel
1988–2100 FinanceReviewTab                  ← รีวิวรายเดือน
2101–2140 FinancePage (แท็บทั้งหมด)
2140–2730 Tracker: GoalModal, ProjectModal, TaskModal, ProjectDetail, TrackerPage
2730–3050 HealthPage, DocumentPage, BookQueuePage, JournalPage
3040–3160 QuickCaptureModal, HistoryPanel
3155–3980 SecretaryDashboard (root) + CSS ทั้งหมดใน <style>
```

---

## 3. โครงสร้างข้อมูล (localStorage)

```js
{
  todos: { daily:[], weekly:[], monthly:[] },
  resetMarkers: { weekStart, month },
  events: [], notes: [],
  finance: {
    income:      [{ id, date:"YYYY-MM-DD", month:"YYYY-MM", amount:+n,
                    source, note, importSource?, slipMonth? }],
    expenses:    [{ id, date:"YYYY-MM-DD", amount:-n, category, memo,
                    source:"manual"|"kbank-csv"|"payslip", importSource?, slipMonth? }],
    investments: [{ id, date, amount:+n, name, source, slipMonth? }],
    debts: [],
  },
  goals: [], habits: [], health: [], documents: [], bookQueue: [], journal: [],
  activity: [],                    // ประวัติการกระทำ
  projects: [], tasks: [], checkins: [],
  budgets: { "<หมวด>": { amount:Number, type:"fixed"|"variable" } },
  reviews: { "YYYY-MM": { rating:1..5, notes:"..." } },
}
```

### กฎที่ห้ามพลาด

| กฎ | เหตุผล |
|---|---|
| `expenses.amount` **ติดลบเสมอ** / `income.amount` **บวกเสมอ** | ถ้าเครื่องหมายผิด ยอดรวมและกราฟเพี้ยนทันที |
| `income` มีทั้ง `date` และ `month` — แก้วันที่ต้องอัปเดต `month` ด้วย | ไม่งั้นรายการไปโผล่ผิดเดือนในกราฟ |
| `expenses` ไม่มีฟิลด์ `month` — คำนวณจาก `monthYearKey(date)` เสมอ | โครงต่างกันระหว่างสองก้อน อย่าสับสน |
| `budgets` / `reviews` อยู่ที่ **root** ไม่ใช่ใน `finance` | เคยพลาดมาแล้ว เขียนผิดที่ = ข้อมูลหาย |
| เข้าถึงใน component คือ `finance.finance.income` | prop ชื่อ `finance` แต่ข้างในมี key `finance` อีกชั้น |
| มูลค่า crypto ต้องผ่าน `holdingCostTHB`/`holdingValueTHB` เสมอ | มีทั้ง THB และ USD ปนกัน ถ้า reduce เองจะลืมแปลงค่าเงิน |

---

## 4. ฟีเจอร์ที่เสร็จแล้ว

### Finance (6 แท็บ)

- **Overview** — กราฟวงกลมคู่ Income by Source / Expenses by Category มีป้ายชี้บนชิ้นกราฟ คลิกแล้ว panel รายละเอียดเลื่อนเข้ามาทางขวา เรียงมากไปน้อย
- **Income** — กรอกเอง ไม่มี CSV import
- **Expenses** — นำเข้า CSV จากแอปธนาคาร (กรอง type `move money` และ `deposit` ออก)
- **Review** — รีวิวรายเดือน + ตั้งงบ + จับรายการผิดปกติ + ให้คะแนน 1–5 + เขียนสรุป
- **Investments** — กราฟยอดสะสมรายเดือน (เงิน กบข. จากสลิปมาลงที่นี่)
- **Debts** — เสร็จแล้ว: CRUD หนี้ (external/self) + สรุปยอด + จับคู่หมวดรายจ่ายแบบยืนยันเองเพื่อหักยอดคงเหลือ

ทั้ง Income และ Expenses มี: ตัวกรองเดือน+หมวด, ยอดรวมตามตัวกรอง, เลือกหลายรายการเพื่อลบ (เลือกทั้งหมดจะเลือกเฉพาะที่กรองอยู่), ปุ่มแก้ไขเปิด modal พร้อม dropdown หมวดหมู่ที่มีอยู่ + ตัวเลือกเพิ่มหมวดใหม่

### Payslip Import (`parsePayslip`)

รับ PDF (pdf.js ดึง text layer) / รูปภาพ (Tesseract.js OCR ไทย) / วางข้อความ — ทุกไลบรารีโหลดแบบ lazy เฉพาะตอนกดใช้

กฎการจัดหมวด:

| ที่มาในสลิป | ลงเป็น |
|---|---|
| ช่อง "รวมรับ" | รายรับ หมวด `เงินเดือน` |
| ช่อง "ภาษี" | รายจ่าย หมวด `ภาษี ณ ที่จ่าย` |
| รายการหักที่มี ค่าน้ำ/ค่าไฟ/ค่าอ่านหน่วย/ค่าขยะ/Cable TV | รายจ่าย หมวด `ค่าสาธารณูปโภค` (รวมยอด) |
| รายการหักที่มี กบข./กสจ. | **เงินออม** → `investments` (ไม่ใช่รายจ่าย) |
| รายการหักที่เหลือ | รายจ่าย หมวด `รายการหักประจำเดือน` (รวมยอด) |

**ระบบตรวจสอบตัวเลขอัตโนมัติ 4 สมการ** — ถ้าไม่ผ่านจะขึ้นเตือนสีส้มก่อนบันทึก:

```
ผลรวมรายการหัก = ช่องเงินหัก
เงินหัก + ภาษี  = รวมหัก
รวมรับ − รวมหัก = คงรับ
อัตราเงินเดือน + เงินเพิ่ม = รวมรับ
```

**บั๊กที่เคยเจอและแก้แล้ว — อย่าทำพัง:**

1. สลิปบางใบเขียนเศษสตางค์เป็น `.08` (ไม่มี 0 นำหน้า) → regex ต้องเป็น
   `/(\d{8})\s*([\s\S]*?)\s((?:\d{1,3}(?:,\d{3})*)?\.\d{2})(?=\s|$)/g`
   (บังคับช่องว่างนำหน้า เพื่อไม่ให้ไปจับ `ก.ย.66` หรือ `บน.4`)
2. สลิป 2 รอบมีตาราง "รายการจ่ายเงินเดือน 2 รอบ" ท้ายสลิปที่มียอด กบข. ซ้ำ → ต้องตัดด้วย
   `DED_END_MARKERS = ["รายการจ่ายเงินเดือน","ระบบสารสนเทศ","รายการเงินเพิ่ม","รวมเงินหัก"]`
3. มีตัวดักชื่อรายการยาวเกิน 60 ตัวอักษร → ข้ามและเตือน (กันกรณีอ่านคร่อมส่วนอื่น)

### หน้าอื่น

Tracker (Projects → Tasks → Check-ins แทน Goals/To-do/Habits เดิม), Health, Documents, Book Queue, Journal, Quick Capture, History, ค้นหารวมทุกประเภทข้อมูล

---

## 5. ปัญหาค้างอยู่ (เรียงตามความสำคัญ)

| # | ปัญหา | ผลกระทบ | แนวทาง |
|---|---|---|---|
| 1 | ~~หมวด **"อื่นๆ" ~154,823 บาท**~~ ✅ **เสร็จแล้ว — ohm ไล่จัดหมวดครบเองแล้ว (ยืนยัน 2026-08-26)** เครื่องมือ (`RecategorizeModal` + เดาหมวดตอน import + แบนเนอร์ในแท็บ Expenses) เสร็จ 2026-08-22 ดูข้อ 5 และ 10 | — | ที่เหลือคือ "อื่นๆ" จริง · แบนเนอร์จะกลับมาเองถ้ามีรายการ "อื่นๆ" เพิ่มจาก import รอบใหม่ |
| 2 | ค่าเฉลี่ยย้อนหลังใช้ได้ไม่เต็มที่ | ข้อมูลยังไม่ถึง 3 เดือนเต็ม | รอข้อมูลสะสม หรือปรับให้ fallback เป็นค่าเฉลี่ยเท่าที่มี |
| 3 | ~~หน้า **Debts** ยังว่าง~~ ✅ เสร็จแล้ว 2026-08-22 (ดูข้อ 6) | — | — |
| 4 | ไฟล์ 265KB ในไฟล์เดียว | แก้ยากขึ้นเรื่อยๆ, เปลือง context | ดูข้อ 7 |
| 5 | ~~ไม่มีระบบ backup / export~~ ✅ เสร็จแล้ว (Export 2026-08-21, หน้ายืนยัน Import 2026-08-25 ดูข้อ 20) | — | — |

---

## 6. วิธีทำงานให้ประหยัด token (สำคัญมาก)

### ที่ทำให้เปลือง

- อ่านไฟล์ 265KB ทั้งไฟล์ = ~70,000 token ต่อครั้ง
- แปะโค้ดยาวๆ ลงในแชท
- คุยยาวใน session เดียว (history สะสมทุกเทิร์น)
- ทดสอบซ้ำหลายรอบโดยไม่จำเป็น

### ที่ควรทำ

**สั่งงาน AI แบบนี้:**

```
อ่าน PROJECT-HANDOFF.md ก่อน
แล้วแก้ FinanceReviewTab ให้ [...]
ใช้ grep หาบรรทัดที่เกี่ยวข้อง อย่าอ่านทั้งไฟล์
แก้ด้วย Edit ไม่ต้อง Read ทั้งไฟล์
```

**หลักการ:**

| ทำ | อย่าทำ |
|---|---|
| `grep -n "ชื่อฟังก์ชัน"` แล้วอ่านเฉพาะช่วงนั้น | `Read` ทั้งไฟล์ |
| `Edit` แทนที่ข้อความเฉพาะจุด | `Write` ทับทั้งไฟล์ |
| 1 session = 1 ฟีเจอร์ แล้วเปิดใหม่ | ทำ 10 ฟีเจอร์ใน session เดียว |
| บอกให้ตรวจแค่ syntax (Babel) | ให้เขียน mock test เต็มรูปแบบทุกครั้ง |
| อัปเดตไฟล์นี้เมื่อจบงาน | ปล่อยให้เอกสารเก่า |

**ประโยคเปิด session ใหม่ที่แนะนำ:**

> อ่าน `PROJECT-HANDOFF.md` ในโฟลเดอร์นี้ก่อน จากนั้นทำ [งาน] ในไฟล์ `preview-dashboard.html`
> ใช้ grep หาตำแหน่ง แก้ด้วย Edit เท่านั้น ตรวจ syntax ด้วย Babel แล้วบอกผลสั้นๆ

### ทดสอบว่า "รันได้จริง" ไม่ใช่แค่ syntax ผ่าน (2026-08-22)

`smoke-test.js` อยู่ในโฟลเดอร์นี้แล้ว — เปิดแอปด้วย Chromium จริง ใส่ข้อมูลตัวอย่างลง localStorage คลิกทุกแท็บ Finance แล้วจับ runtime error (Babel ผ่าน ≠ ไม่ crash — บั๊ก `Lightbulb is not defined` ที่ทำหน้าจอดำเคยผ่าน Babel มาแล้ว)

```bash
npm i playwright react@18.2.0 react-dom@18.2.0 @babel/standalone@7.24.7 prop-types@15.8.1 recharts@2.15.0
npx playwright install chromium
node smoke-test.js
```

- **ต้อง pin `@babel/standalone@7.24.7`** รุ่นใหม่กว่านี้ throw `Cannot use import statement outside a module` แล้วหน้าจอว่าง (เสียเวลาหาสาเหตุมาแล้ว)
- สคริปต์ generate `test-dashboard.html` (สำเนาที่ชี้ CDN ไป `node_modules`) ทุกครั้ง — **แก้ `preview-dashboard.html` เท่านั้น** อย่าแก้ไฟล์ test
- ผลรันจริง 2026-08-22: ทุกแท็บผ่าน ไม่มี runtime error, Net Worth คำนวณตรงกับที่คิดมือ, ยืนยันจับคู่หนี้หักยอดถูก, เดาหมวดจับ 7-ELEVEN/LOTUS ได้

**บั๊กที่เจอจากการทดสอบนี้และแก้แล้ว:** `SplitExpenseModal` เคยแยกรายการ**คืนเงิน** (`csv-refund`, amount บวก) ได้ แล้วบังคับผลลัพธ์ติดลบ = พลิกเครื่องหมายทำยอดเพี้ยน → ซ่อนปุ่มแยกสำหรับแถวที่ `amount>0` ทั้งในตาราง Expenses และใน `RecategorizeModal`, และ `fillRest` clamp ไม่ให้กรอกค่าติดลบ

### คำสั่งตรวจ syntax (ใช้ทุกครั้งหลังแก้)

```bash
python3 -c "
s=open('preview-dashboard.html',encoding='utf-8').read()
i=s.index('data-presets=\"react\">')+len('data-presets=\"react\">')
open('/tmp/s.jsx','w',encoding='utf-8').write(s[i:s.index('</script>',i)])
"
node -e "require('@babel/core').transformSync(require('fs').readFileSync('/tmp/s.jsx','utf8'),{presets:[['@babel/preset-react']]});console.log('OK')"
```

ถ้าไม่มี babel: `npm install @babel/core @babel/preset-react`

---

## 7. ข้อเสนอแนะสำหรับโปรเจกต์ใหม่

### ทางเลือกที่ 1 — อยู่ในไฟล์เดียวต่อ (แนะนำถ้าใช้คนเดียว)

**ข้อดี:** ก๊อปไฟล์เดียวจบ เปิดที่ไหนก็ได้ ไม่ต้องติดตั้งอะไร
**ข้อเสีย:** แก้ยากขึ้นเรื่อยๆ

ถ้าเลือกทางนี้ ควรทำเพิ่ม:

1. **ใส่ comment คั่นชัดเจน** ทุกส่วน เช่น `/* ═══ SECTION: Finance ═══ */` → grep หาเร็วขึ้นมาก
2. **เพิ่ม Export/Import JSON** ป้องกันข้อมูลหาย (สำคัญที่สุด)
3. **ย้าย CSS ออกเป็น `styles.css`** แยกไฟล์ → ไฟล์หลักเหลือ ~200KB และแก้ CSS ไม่กระทบ JS

### ทางเลือกที่ 2 — แยกไฟล์

```
index.html          — โครง + CDN
styles.css          — CSS ทั้งหมด
js/utils.js         — วันที่, uid, helper
js/finance.js       — Finance ทุกแท็บ
js/payslip.js       — parsePayslip + modal
js/tracker.js       — Projects/Tasks
js/app.js           — root + routing
```

**ข้อดี:** แก้เฉพาะไฟล์ที่เกี่ยว = ประหยัด context มหาศาล
**ข้อเสีย:** ต้องเปิดผ่าน local server (`python3 -m http.server`) เพราะ `file://` โหลด module ไม่ได้

### ทางเลือกที่ 3 — ทำเป็น Skill

ตัว `parsePayslip` เป็นตรรกะที่นิ่งแล้วและทดสอบผ่าน 2 สลิป → แยกเป็น Skill แล้วเรียกใช้ซ้ำได้โดยไม่ต้องอธิบายใหม่ทุกครั้ง

### ลำดับที่ผมแนะนำ

1. **Export/Import JSON** ← ทำก่อนเลย ข้อมูลหายคือจบ
2. **แยก CSS ออกไฟล์** ← ได้ผลทันที ความเสี่ยงต่ำ
3. ~~**จัดหมวด "อื่นๆ"**~~ ✅ เสร็จแล้ว (ohm ไล่จัดเองครบ ยืนยัน 2026-08-26)
4. **หน้า Debts**
5. ค่อยพิจารณาแยกไฟล์ JS ตอนที่ไฟล์โตกว่านี้

---

## 8.5 แผนงาน: เพิ่ม PWA + Google Drive sync ให้ preview-dashboard.html (ตัดสินใจแล้ว 2026-08-20)

**เป้าหมาย:** ใช้ `preview-dashboard.html` เดิม (ฟีเจอร์ครบ) แต่เพิ่มให้ (1) ติดตั้งเป็นแอปบนมือถือ/ไอแพดได้ (2) ข้อมูลซิงก์ข้ามเครื่องผ่าน Google Drive แทนที่จะติดอยู่ใน localStorage เครื่องเดียว

**วัตถุดิบพร้อมใช้ใน `_reference-drive-sync/`:**
- `app.js` บรรทัด 1420–1585 — โค้ด Google Drive sync ที่ทดสอบแล้ว: `initGoogleIdentity`, `signIn`, `onSignedIn`, `driveFetch`, `ensureFolder`, `ensureFile`, `syncWithDrive`, `pushToDrive`, `scheduleDriveSave` (ใช้ Google Identity Services + Drive API v3, scope `drive.file`)
- `config.js` — ที่ใส่ `CLIENT_ID` (ต้องไปสร้างเองใน Google Cloud Console ตาม SETUP.md ส่วนที่ 1)
- `manifest.json` + `icons/` — พร้อมใช้ตรงๆ
- `SETUP.md` — ขั้นตอนสร้าง OAuth Client ID + โฮสต์ GitHub Pages/Netlify (ยังต้องทำ ยังไม่เคยตั้งค่า)

**ขั้นตอนทำ (แนะนำแยก session ต่อขั้น):**

| ขั้น | งาน | ไฟล์ที่แก้ |
|---|---|---|
| 1 ✅ | เพิ่ม `<link rel="manifest">`, meta theme-color, ก็อป `manifest.json` + `icons/` มาไว้ข้าง preview-dashboard.html — **เสร็จแล้ว 2026-08-20** | `preview-dashboard.html`, `manifest.json`, `icons/` |
| 2 ✅ | เขียน `sw.js` cache-first ง่ายๆ (แคชไฟล์หลัก + CDN) แล้ว register ใน `preview-dashboard.html` — **เสร็จแล้ว 2026-08-20** | `sw.js` ใหม่, `preview-dashboard.html` |
| 3 ← ต่อไป | **ข่าวดี:** พบว่ามี `window.storage` abstraction เตรียมไว้แล้ว (บรรทัด 78-88 ของ preview-dashboard.html) เป็น async get/set รอต่อ Drive อยู่แล้ว! งานขั้นนี้คือแทนที่ implementation ของ `window.storage.get/set` ให้เรียก Drive API แทน localStorage ตรงๆ (localStorage ใช้เป็น cache offline เสมือน) — เอาโค้ด `driveFetch/ensureFolder/ensureFile/syncWithDrive/pushToDrive` จาก `_reference-drive-sync/app.js` บรรทัด 1420-1585 มาปรับใช้ ไม่ต้องแตะ `useSecretaryData` hook เลยเพราะมันเรียกผ่าน `window.storage` อยู่แล้ว (เช็คให้ชัวร์ด้วย grep "window.storage" ก่อนแก้) | `preview-dashboard.html`, ก็อป `config.js` |
| 4 | ทำ Export/Import JSON ปุ่มในหน้า Settings (อยู่ในลิสต์ข้อ 5 ปัญหาค้างอยู่แล้ว — ทำพร้อมกันเลยเพราะ logic ใกล้เคียงกับ Drive sync) | `preview-dashboard.html` |
| 5 | ตั้ง OAuth Client ID ตาม SETUP.md ส่วนที่ 1 (ทำเองนอก session — ต้องเข้า Google Cloud Console) | — |
| 6 | โฮสต์ GitHub Pages ตาม SETUP.md ส่วนที่ 2 (ทำเองนอก session) | — |
| 7 | ทดสอบเปิดจากมือถือ/ไอแพด → เชื่อมต่อ Drive → เช็คว่าซิงก์ถูกต้อง | — |

**คำสั่งเปิด session สำหรับแต่ละขั้น (ตัวอย่างขั้น 1):**
> อ่าน PROJECT-HANDOFF.md ก่อน แล้วทำขั้น 1 ของข้อ 9 (เพิ่ม PWA manifest) ใน preview-dashboard.html ใช้ grep หาตำแหน่ง `<head>` แก้ด้วย Edit เท่านั้น ตรวจ syntax ด้วย Babel แล้วบอกผลสั้นๆ

หลังทำแต่ละขั้นเสร็จ ให้ติ๊กในตารางนี้และย้ายไปข้อถัดไปใน session ใหม่ — อย่าทำหลายขั้นรวดเดียวใน session เดียวกัน

**ความคืบหน้า (2026-08-21):**
- ✅ ขั้น 1: เพิ่ม PWA manifest ใน preview-dashboard.html แล้ว (คัดลอก manifest.json + icons/ มาไว้ที่ root ของโฟลเดอร์แล้ว)
- ✅ แก้บั๊ก Lightbulb (ดูตารางข้อ 8)
- ✅ ขั้น 5: สร้าง Google Cloud OAuth เสร็จแล้ว — ใช้โปรเจกต์ `personal-os` เดิม, เปิด Drive API, ตั้ง OAuth consent screen (External, test user supakit6906@gmail.com), สร้าง Web application OAuth Client ID โดยตั้ง Authorized JavaScript origin เป็น `https://supakit-ohm.github.io`
- ✅ Client ID ที่ได้: `1034065613880-ufoc34mqhi69a2lb841elmevaebarqhk.apps.googleusercontent.com` — ใส่ใน `config.js` แล้ว (ก็อปไฟล์มาไว้ที่ root ข้าง preview-dashboard.html แล้ว)
- ✅ ขั้น 3: เพิ่ม Google Drive sync แล้วใน preview-dashboard.html:
  - เพิ่ม `<script src="config.js">` + Google Identity Services script ใน `<head>`
  - เพิ่มปุ่มลอย "เชื่อมต่อ Google Drive" มุมขวาบน (plain JS นอก React ทั้งหมด อยู่ก่อน `<script type="text/babel">`)
  - `window.storage.set()` จะ push ขึ้น Drive อัตโนมัติ (debounce 1.2 วิ) เมื่อเชื่อมต่อแล้ว
  - ตอนกด "เชื่อมต่อ" ครั้งแรก: ถ้าไฟล์บน Drive ยังไม่มี → อัปโหลดข้อมูลเครื่องนี้ขึ้นไปตั้งต้น / ถ้ามีข้อมูลอยู่แล้วและต่างจากเครื่องนี้ → จะถาม (confirm dialog) ว่าจะดึงจาก Drive มาแทนที่ หรือเก็บของเครื่องนี้แล้วอัปโหลดทับ (ป้องกันข้อมูลหายจากการซิงก์ผิดเครื่อง)
  - ตรวจ syntax ผ่านทั้ง Babel และ `node --check` แล้ว (2026-08-21)
  - **ข้อจำกัดที่ควรรู้:** access token จาก Google อยู่ในหน่วยความจำเท่านั้น ไม่บันทึกข้ามการเปิดแอปใหม่ — ทุกครั้งที่เปิดแอปใหม่ (refresh/เปิดเครื่องใหม่) ต้องกดปุ่ม "เชื่อมต่อ Google Drive" อีกครั้ง (ปกติของ flow นี้ ไม่ใช่บั๊ก)
- ✅ ขั้น 6: อัปโหลดขึ้น GitHub Pages แล้ว — repo `Supakit-ohm/secretary-ohm` (public), เปิด Pages จาก branch `main` / root แล้ว
  - **URL ที่ใช้งานจริง:** `https://supakit-ohm.github.io/secretary-ohm/preview-dashboard.html`
- ✅ ขั้น 7: ทดสอบเชื่อมต่อ Google Drive จาก URL จริงสำเร็จ — โฟลเดอร์ `SecretaryOhmApp` + ไฟล์ `data.json` ถูกสร้างขึ้นบน Drive ของผู้ใช้แล้ว (2026-08-21)

**สรุป: แผนงานข้อ 8.5 (PWA + Google Drive sync) เสร็จครบทั้ง 7 ขั้นแล้ว** 🎉 แอปตอนนี้ใช้งานได้จริงผ่าน URL ด้านบน ติดตั้งเป็นแอปบนมือถือ/ไอแพดได้ (Add to Home Screen) และซิงก์ข้อมูลข้ามเครื่องผ่าน Google Drive ได้แล้ว

**สิ่งที่เหลือทำต่อ (จากข้อ 5 เดิม เรียงตามความสำคัญ):**
1. ✅ Export/Import JSON — เสร็จแล้ว (2026-08-21): เพิ่มปุ่ม "Export JSON" / "Import JSON" (plain JS นอก React ทั้งหมด อยู่ก่อน `<script type="text/babel">`) Export ดาวน์โหลด `localStorage["secretary-dashboard-v1"]` เป็นไฟล์ `secretary-backup-YYYY-MM-DD.json`, Import อ่านไฟล์ + validate JSON + confirm dialog ก่อนเขียนทับผ่าน `window.storage.set` (จะ push ขึ้น Drive อัตโนมัติถ้าเชื่อมต่ออยู่) แล้ว reload หน้า — ตรวจ syntax ผ่านทั้ง Babel และ `node --check` แล้ว
   - ✅ อัปเดต (2026-08-21): ย้าย 3 ปุ่ม (เชื่อมต่อ Drive / Export / Import) จากมุมขวาบนไปเป็นไอคอนกลมเล็กๆ ซ้อนกันแนวตั้ง ตำแหน่ง fixed ซ้ายล่างเหนือ avatar ของ Sidebar (`#driveBar` ยังเป็น DOM element แยกนอก React ทั้งชุด id เดิม ไม่ได้ reparent เข้าไปใน React tree จริงเพื่อกันปัญหา re-render ทับปุ่ม) ปรับ `afterSignedIn()` ให้เปลี่ยนสี/title แทนการเซ็ต `textContent` (กันเขียนทับไอคอน fa-cloud) และซ่อน `#driveBar` ที่จอเล็ก (<900px) เหมือน sidebar หลัก
2. ✅ **เสร็จแล้ว (2026-08-21) — หน้ารีวิว Deposit ตอน import CSV**
   - เพิ่ม helper `expOut(e)` = `-(amount)` ไว้บนสุดของ helpers → **ทุกจุดที่รวมยอดรายจ่ายเปลี่ยนจาก `Math.abs()` มาใช้ `expOut()` แล้ว (12 จุด)**: buildMonthReview, detectAnomalies, FinanceOverviewTab, ExpensesTab (by category / this month / ยอดรวมใต้ตัวกรอง), RecategorizeModal — เหลือ `Math.abs` เฉพาะตอนแสดงผลเท่านั้น
   - เพิ่ม `DepositReviewModal` (วางก่อน `FinanceExpensesTab`) + state `depositRows` + `applyDeposits()` ใน ExpensesTab, `EXCLUDED_TYPES` เหลือ `["move money"]` — แถว deposit ไปเข้าหน้ารีวิวแทนการทิ้ง
   - เงินคืน = `finance.expenses` amount **บวก** `source:"csv-refund"` (คอมเมนต์กำกับไว้ที่ `expOut`), ตารางแสดง +฿ สีเขียว + badge "คืนเงิน", `TxnEditModal` ไม่กลับเครื่องหมายของ csv-refund
   - bonus: จำหมวดตามชื่อผู้โอน (localStorage key `secretary-refund-cat-map`) แล้ว pre-select ให้ ยังต้องกดยืนยันเอง
   - ตรวจ syntax ผ่าน Babel แล้ว

   สเปกเดิม (คุยรายละเอียดไว้ใน claude.ai project session ไม่ใช่ในไฟล์นี้ สรุปสเปกไว้ที่นี่แล้ว):
   - ปัญหา: CSV จาก Make by KBank มีแถว Type=`Deposit` ที่บางส่วนคือเพื่อนโอนคืนเงิน (หารค่าอาหาร/คืนเงินซื้อของแทน) ตอนนี้ import filter Deposit ทิ้งทั้งหมด → รายจ่ายที่จ่ายเต็มก้อนไปก่อนเลยเพี้ยนสูงเกินจริง
   - สเปกที่ต้องทำ: หลังพาร์ส CSV เสร็จ แยกแถว Deposit ออกมาเป็นหน้ารีวิวก่อนบันทึก (ใช้ pattern checkbox หลายรายการ + action bar แบบเดียวกับที่ ExpensesTab มีอยู่แล้วสำหรับ "เลือกหลายรายการเพื่อลบ") ตารางเรียงยอดมากไปน้อย แสดง วันที่/ยอด/Note(ชื่อคนโอน) มี checkbox เลือกได้หลายแถว + "เลือกทั้งหมด"
   - action bar มี 3 ตัวเลือก apply กับแถวที่เลือกพร้อมกัน: (1) **ข้าม** (โอนย้ายในบัญชีตัวเอง) — ค่าเริ่มต้นของทุกแถว ปลอดภัยสุด (2) **เงินคืน → หักจากหมวด...** เลือกหมวดรายจ่ายที่มีอยู่ แล้วบันทึกเป็นรายการใน `finance.expenses` แต่ `amount` เป็น**บวก** (ข้อยกเว้นเดียวจากกฎ "expenses.amount ติดลบเสมอ" — ต้องเขียน comment กำกับจุดนี้ในโค้ดให้ชัด) พร้อม `memo:"คืนเงิน"+note เดิม`, `source:"csv-refund"` เพื่อ trace ได้ (3) **เป็นรายรับจริง → income** เลือก source แล้วเพิ่มเข้า `finance.income` ตามปกติ (amount บวก, ต้องอัปเดต `month` ด้วยตามกฎเดิม)
   - ก่อนแก้ **ต้องตรวจสอบ**: ทุกจุดที่ sum `expenses.amount` ทั้งแอป (Overview, Review, กราฟวงกลม, budgets) sum ยอดตรงๆ ไม่ได้ไป `Math.abs()` มันทุกจุด — ถ้ามีจุดไหน hardcode สมมติฐานว่าติดลบเสมอ (เช่นใช้ `Math.abs` เพื่อแสดงผลแล้วลืมว่าอาจมีค่าบวกปนมา) ต้องแก้ให้รองรับรายการบวกในหมวดด้วย ไม่งั้นยอดจะเพี้ยนกลับด้าน
   - bonus (ทำถ้าเวลาเหลือ ไม่ใช่ blocker): จำหมวดที่เคยเลือกไว้ตาม Note (ชื่อคน) แล้ว pre-select หมวดเดิมให้อัตโนมัติในครั้งถัดไปที่เจอชื่อเดิม (ยังต้องกดยืนยันเองเสมอ ไม่ auto-save เงียบๆ)
3. ✅ **เสร็จแล้ว (2026-08-22) — งานเล็กๆ 2 อย่าง**:
   - ย้ายปุ่ม "Import Payslip" จาก fin-tab-nav (ลอยทุกแท็บ) ไปอยู่ในการ์ด "Add Income" ของแท็บ Income เท่านั้น (มุมขวาของ card-head) — `showSlip` state ย้ายจาก `FinancePage` ไป `FinanceIncomeTab`
   - เพิ่มตัวกรอง "ที่มาข้อมูล" (dropdown ที่ 3) ใน `TxnFilterBar` ใช้ได้ทั้ง All Expenses และ All Income — เพิ่ม helper `originOf(r)`/`ORIGIN_LABELS` (ก่อน `TxnFilterBar`) แยก manual/kbank-csv/payslip/csv-refund พ่วงแก้บั๊กเดิมที่ badge ในตาราง Income เช็ค `i.source==="payslip"` ผิด (ควรเช็ค `importSource`) ทำให้ขึ้น "Manual" เสมอ
4. **ใหม่ (2026-08-22) — ยกเครื่องหน้า Investments ให้เห็นภาพรวมพอร์ตทั้งหมด** (คุยสเปกไว้ใน claude.ai project session สรุปไว้ที่นี่แล้ว) — **แบ่งทำ 4 เฟส แยก session ทีละเฟส ห้ามรวด:**

   **บริบท/การตัดสินใจที่คุยไว้แล้ว:**
   - ประเภทสินทรัพย์ที่ต้องมี: `retirement`(กบข./กสจ. จากสลิป), `insurance`(ประกันสะสมทรัพย์), `gold`(ทอง), `crypto`, `stock`(หุ้น), `fund`(กองทุน), `other` — เพิ่มได้ทีหลังถ้ามีอีก
   - CSV จาก Make by KBank: ธุรกรรมโอนไปลงทุนทุกประเภทอยู่ใน **category เดียวกันคือ "ออม ลงทุน"** (สะกดแบบนี้เป๊ะ) แยกกันไม่ได้จากคอลัมน์ category ต้องดูจาก **memo/Note ที่ผู้ใช้เขียนเอง** แล้วให้ผู้ใช้เป็นคนเลือกประเภทเองตอน import (ห้าม auto 100%)
   - มูลค่าปัจจุบัน: **กรอกเองเป็นระยะๆ ไม่ต้องต่อ API ราคาแบบ real-time** (ผู้ใช้บอกชัดว่าไม่อยากซับซ้อน) ยกเว้น crypto ที่อยากมีช่องกรอกละเอียดกว่า (ดูเฟส 2)
   - Crypto: มีพอร์ตเก่าอยู่ก่อนแล้วที่ยังไม่เคยลงระบบ ผู้ใช้จะไปรวบรวมข้อมูลมากรอกเอง (เหรียญ/จำนวน/ต้นทุน) — แค่เตรียมช่องกรอกให้
   - เป้าหมาย (goal) ระยะสั้น-ยาว: **ผูกกับระบบ Tracker/Goals เดิมที่มีอยู่แล้ว** ไม่สร้างระบบใหม่แยก

   **เฟส 1 — เพิ่มฟิลด์ประเภท + แก้ CSV import** ✅ **เสร็จแล้ว (2026-08-22)**
   - เพิ่ม `INVEST_TYPES` / `INVEST_TYPE_LABELS` / `INVEST_CSV_CATEGORY` / `INVEST_MAP_KEY` + `InvestmentReviewModal` (วางก่อน `FinanceExpensesTab`)
   - migration ใน `useSecretaryData`: รายการ investments ที่ยังไม่มี `type` → `payslip` เป็น `retirement`, ที่เหลือ `other` (เซฟกลับ storage อัตโนมัติ)
   - `handleCSVUpload`: แถวที่ `category === "ออม ลงทุน"` เป๊ะๆ แยกเป็น `investRows` → เปิด `InvestmentReviewModal` แทนการลงเป็นรายจ่าย
   - แถวที่ผู้ใช้ไม่ได้จัดการ (กดปิด) จะถูกบันทึกเป็น**รายจ่ายปกติ**ตามเดิม ไม่หายไปไหน (`closeInvestReview`)
   - Payslip import ใส่ `type:"retirement"` ให้รายการ กบข./กสจ. แล้ว, ตาราง Investments เพิ่มคอลัมน์ "ประเภท"
   - bonus ทำแล้ว: จำประเภทตาม memo/Note (`secretary-invest-type-map`) pre-select ให้ ยังต้องกดยืนยันเอง
   - ตรวจ syntax ด้วย Babel ผ่านแล้ว

   สเปกเดิมของเฟส 1:
   - เพิ่มฟิลด์ `type` ให้ `finance.investments` แต่ละรายการ (ค่าที่เป็นไปได้ตามลิสต์ข้างบน) migration: รายการเดิมที่มาจาก payslip (`source:"payslip"`) → `type:"retirement"`, ที่เหลือ (ยังไม่เคยมี type) → `type:"other"` ชั่วคราว
   - แก้ `handleCSVUpload` ใน `FinanceExpensesTab`: แถวที่ category ตรงกับ `"ออม ลงทุน"` เป๊ะๆ ไม่ให้เข้า `newExpenses` เหมือนเดิม แต่แยกเก็บเป็น `investRows` แล้วเปิด **`InvestmentReviewModal`** ใหม่ (pattern เดียวกับ `DepositReviewModal` ที่มีอยู่แล้ว — checkbox หลายรายการ + เลือกทั้งหมด + action bar) ให้ผู้ใช้เลือกประเภทสินทรัพย์ต่อแถว (หรือเลือกหลายแถวพร้อมกันแล้วเลือกประเภทเดียวใส่ทีเดียว) ก่อนบันทึกลง `finance.investments` (`amount` เป็นบวกตามกฎเดิมของ investments, `source:"kbank-csv"`)
   - bonus (ทำถ้าเวลาเหลือ): จำประเภทตาม memo/Note เดิม (คล้าย `secretary-refund-cat-map` แต่แยก key เป็น `secretary-invest-type-map`) pre-select ให้ ยังต้องกดยืนยันเอง

   **เฟส 2 — มูลค่าปัจจุบัน + พอร์ต crypto** ✅ **เสร็จแล้ว (2026-08-22)**
   - เพิ่ม `investmentValues` + `cryptoHoldings` ใน `DEFAULT_DATA.finance` (คอมโพเนนต์อ่านแบบ `||{}` / `||[]` ไม่ต้องมี migration แยก)
   - ใน `FinanceInvestmentsTab` เพิ่ม 2 การ์ด: **"มูลค่าปัจจุบัน (กรอกเองเป็นระยะ)"** ตารางต่อประเภท (เงินที่ใส่ไป / ช่องกรอกมูลค่าปัจจุบัน / วันที่อัปเดตล่าสุด — เซฟ `updatedAt` อัตโนมัติตอนแก้) พร้อมสรุปรวม + กำไร/ขาดทุน, และ **"พอร์ตคริปโต"** ตารางเพิ่ม/แก้/ลบแถว (เหรียญ/จำนวน/ต้นทุนเฉลี่ย/ราคาปัจจุบัน) คำนวณ cost basis + มูลค่าปัจจุบันอัตโนมัติ
   - แถว crypto ในตารางมูลค่าปัจจุบัน**ไม่มีช่องกรอก** — ดึงจากตาราง holdings เพื่อไม่ให้กรอกซ้ำ
   - เก็บค่าที่กรอกเป็น string แล้ว `Number()` ตอนคำนวณ (กันปัญหาพิมพ์ "0." แล้วโดนตัด)
   - ตรวจ syntax ด้วย Babel ผ่านแล้ว

   สเปกเดิมของเฟส 2:
   - เพิ่ม `finance.investmentValues = { "<type>": { value:Number, updatedAt:"YYYY-MM-DD" } }` เก็บมูลค่าปัจจุบันแบบกรอกเองต่อประเภท (ยกเว้น crypto)
   - เพิ่ม `finance.cryptoHoldings = [{ id, coin, quantity, avgCost, currentPrice, updatedAt }]` — ตารางกรอกเอง (เหรียญ/จำนวน/ต้นทุนเฉลี่ยต่อหน่วย/ราคาปัจจุบันต่อหน่วย) คำนวณ cost basis และ current value ของ crypto จากตารางนี้อัตโนมัติ (ไม่ต้องกรอกใน investmentValues.crypto ซ้ำ)
   - หน้า UI: ฟอร์มแก้ไข "มูลค่าปัจจุบัน" ต่อประเภท + ตาราง crypto holdings แบบเพิ่ม/ลบ/แก้ไขแถวได้ (pattern เดียวกับตารางอื่นในแอป)

   **เฟส 3 — เป้าหมายการลงทุน** ✅ **เสร็จแล้ว (2026-08-22)**
   - หมายเหตุสำคัญ: `goals` เดิมถูก migrate เป็น `projects` (root) ไปแล้ว (migrateToTracker) จึง**ไม่ได้ใช้ `goals` array** ตามสเปกเดิม แต่ query จาก `data.projects` ที่ `category==="finance"` (หมวดที่มีอยู่แล้วใน `GOAL_CATEGORIES`) — ไม่เพิ่มฟิลด์ใหม่เลย
   - ใน `FinanceInvestmentsTab` เพิ่มการ์ด **"เป้าหมายการลงทุน"** (วางก่อนการ์ด Savings & Investments) แบ่งระยะสั้น (`daysUntil(targetDate) < 365`) / ระยะยาว (≥365 หรือไม่มี targetDate) แสดง progress bar + สถานะจาก `projectHealth` + ยอดปัจจุบัน/เป้าหมายจาก `projectCurrentValue` — read-only แก้ไขที่หน้า Tracker เท่านั้น (กรอง `status!=="archived"`)
   - ตรวจ syntax ด้วย Babel ผ่านแล้ว

   สเปกเดิมของเฟส 3:
   - ใช้ `goals` array เดิม (root) เพิ่มหมวด/tag ที่บ่งว่าเป็นเป้าหมายการเงิน (เช่น `category:"investment"`) ก่อนแก้ **ต้องอ่านโครง Goal เดิมให้ครบ** (ฟิลด์ title/targetValue/currentValue/unit/category/targetDate ฯลฯ) อย่าเพิ่ม field ใหม่ถ้าใช้ของเดิมพอ — แบ่งระยะสั้น/ยาวโดยคำนวณจาก `targetDate` (เช่น <1 ปี = สั้น, ≥1 ปี = ยาว) ไม่ต้องเพิ่มฟิลด์ใหม่
   - แสดงเป้าหมายที่ tag ไว้ในหน้า Investments (ไม่ต้องซ้ำกับหน้า Tracker เดิม แค่ query แล้วโชว์)

   **เฟส 4 — รีดีไซน์ Overview ของหน้า Investments** ✅ **เสร็จแล้ว (2026-08-22)** — ครบทั้ง 4 เฟสแล้ว
   - แถบ stat ด้านบนเปลี่ยนเป็น 4 การ์ด: เงินที่ใส่ไปสะสม / มูลค่าปัจจุบัน / กำไร-ขาดทุน (+%) / เฉลี่ยต่อเดือน (+จำนวนรายการ)
   - เพิ่มการ์ด **"ภาพรวมพอร์ตตามประเภท"** (ใต้ stat row): แถบสัดส่วน stacked สีตามประเภท + รายการต่อประเภท (ใส่ไป / มูลค่าปัจจุบัน / กำไร-ขาดทุน / % สัดส่วน) เรียงตามมูลค่ามากไปน้อย ซ่อนประเภทที่ยังไม่มีข้อมูล
   - เพิ่ม `INVEST_TYPE_COLORS` (ถัดจาก `INVEST_TYPE_LABELS`) และ `perType`/`activeTypes` ใน `FinanceInvestmentsTab` เป็นแหล่งคำนวณเดียว
   - การ์ดเดิม "มูลค่าปัจจุบัน" เปลี่ยนบทบาทเป็นฟอร์มกรอกล้วนๆ (เปลี่ยนหัวเป็น "กรอกมูลค่าปัจจุบัน (อัปเดตเป็นระยะ)" ตัดบรรทัดสรุปที่ซ้ำกับด้านบนออก)
   - ตรวจ syntax ด้วย Babel ผ่านแล้ว

   สเปกเดิมของเฟส 4:
   - รวมทุกอย่างจากเฟส 1-3: การ์ดสรุปแยกตามประเภท (เงินที่ใส่ไปสะสม vs มูลค่าปัจจุบัน vs กำไร/ขาดทุน per type), รายละเอียด crypto holdings, เป้าหมายที่ผูกไว้ — เป็นเฟสที่เห็นผลลัพธ์ตามที่ขอ "แสดงภาพรวมการลงทุน...ให้ดูง่าย"

4.1 **บั๊กแก้แล้ว (2026-08-22) — CSV import ไม่จับรายการ "ออม ลงทุน"**: ไฟล์ CSV จริงจาก KBank export บางไฟล์มี**เว้นวรรค 2 ช่อง** ระหว่างคำ ("ออม  ลงทุน") ไม่ใช่ 1 ช่องแบบที่ `INVEST_CSV_CATEGORY` เทียบแบบ exact match (`cat===INVEST_CSV_CATEGORY`) เลยหลุดไปเข้า `newExpenses` ปกติแทนที่จะเข้า `InvestmentReviewModal` — แก้ใน `handleCSVUpload` โดยเพิ่มตัวแปร `catNorm` (`cat.replace(/\s+/g," ").trim()`) แล้วเทียบ `catNorm===INVEST_CSV_CATEGORY` แทน (บันทึกลง investRows ด้วย category ที่ normalize แล้วเสมอ)
   - **ผลกระทบกับข้อมูลเดิม + วิธีแก้ที่ทำจริง**: รายการ 2 แถวที่เจอบั๊ก (25/6/2026 -3285 "DCA crypto" และ 23/7/2026 -3240 "DCA crypto" รวม 6,525 บาท) ถูกบันทึกเป็น**รายจ่ายปกติ**ไปแล้วด้วยหมวด "ออม  ลงทุน" (เว้นวรรค 2 ช่อง) — แทนที่จะให้ ohm ลบ+import ซ้ำเอง (เสี่ยง duplicate รายการอื่น) จึงเพิ่ม**แบนเนอร์แก้ไขย้อนหลังในแท็บ Expenses**: ตรวจรายจ่ายที่ `category` (normalize เว้นวรรคแล้ว) ตรงกับ `INVEST_CSV_CATEGORY` เจอกี่รายการ โชว์ปุ่ม "ย้ายไปเป็นเงินลงทุน" → เปิด `InvestmentReviewModal` เดิม (ให้เลือกประเภทสินทรัพย์) → ตอนกด apply จะลบแถวนั้นออกจาก `expenses` พร้อมเพิ่มเข้า `investments` ในการ persist ครั้งเดียว (ผ่าน field ภายใน `_fromExpenseId` ที่ผูกกับ id รายจ่ายเดิม, ไม่ใช่ field ถาวรที่ต้อง migrate)
   - แก้ `applyInvestments`/`closeInvestReview` ให้รองรับทั้ง 2 ที่มา (CSV ใหม่ vs รายจ่ายเดิมที่ดึงมาแก้) — เพิ่มฟังก์ชัน `fixStrayInvestments` ใน `FinanceExpensesTab`
   - ตรวจ syntax ด้วย Babel ผ่านแล้ว

4.2 **เพิ่มแล้ว (2026-08-22) — ฟอร์มเพิ่มรายการลงทุนแบบ manual**: `FinanceInvestmentsTab` เดิมไม่มีทางกรอกรายการลงทุนเองเลย (เข้าได้แค่ผ่าน CSV import/payslip) เพิ่มการ์ด **"เพิ่มรายการลงทุน (กรอกเอง)"** (วางก่อนการ์ด Savings & Investments) มีฟิลด์ Date/จำนวนเงิน/ประเภท (dropdown จาก `INVEST_TYPES`)/ชื่อรายการ (ไม่บังคับ ถ้าเว้นว่างใช้ label ของประเภทแทน) กดปุ่ม + จะบันทึกลง `finance.investments` ด้วย `amount` เป็นบวกเสมอ (ตามกฎเดิม) และ `source:"manual"`
   - state/handler: `invDate/invName/invType/invAmount` + `addInvestment()` ใน `FinanceInvestmentsTab`
   - ตรวจ syntax ด้วย Babel ผ่านแล้ว

4.3 **เพิ่มแล้ว (2026-08-22) — แก้ไขรายการใน "Savings & Investments" แบบ inline**: เดิมแก้ไขรายการไม่ได้ (ลบได้อย่างเดียว ต้องลบแล้วเพิ่มใหม่ถ้าพิมพ์ผิด) เพิ่มปุ่มดินสอ (`Edit3`) ต่อแถว กดแล้วแถวนั้นสลับเป็นฟอร์มแก้ไข (date/name/type/amount) มีปุ่ม ✓ บันทึก / ✕ ยกเลิก / ถังขยะ (ลบได้แม้อยู่ในโหมดแก้ไข ไม่ต้องกดยกเลิกก่อน)
   - state: `editInvId/editInvDraft` + `startEditInv/cancelEditInv/saveEditInv` ใน `FinanceInvestmentsTab` — `saveEditInv` บังคับ `amount` เป็นบวกเสมอ (กฎเดิมของ investments) กันพิมพ์ค่าติดลบหลุดเข้ามา
   - ตรวจ syntax ด้วย Babel ผ่านแล้ว

4.4 **ไอเดียที่ยังไม่ได้ทำ (ohm ขอให้บันทึกไว้ก่อน — จะกลับมาทำเป็น session แยกถ้ามีเวลา/แนวคิดเพิ่ม)**:
   - ~~**แจ้งเตือนมูลค่าที่ไม่ได้อัปเดตนาน**~~ ✅ **เสร็จแล้ว (2026-08-22)**: `staleTypes` ใน `FinanceInvestmentsTab` (ประเภทที่มีเงินใส่ไปหรือมีมูลค่า แต่ `updatedAt` เก่ากว่า 30 วัน หรือยังไม่เคยกรอก — ข้าม crypto เพราะดึงจากตาราง holdings) โชว์แบนเนอร์ส้มเหนือการ์ด "กรอกมูลค่าปัจจุบัน" + คอลัมน์ "อัปเดตล่าสุด" เปลี่ยนสีตามอายุ (เหลือง ≥30 วัน / ส้ม ≥60 วัน / "ยังไม่เคยกรอก") คำนวณอายุด้วย `-daysUntil(u)`
   - **กราฟมูลค่าพอร์ตตามเวลา**: ตอนนี้มีแต่กราฟ "เงินที่ใส่ไปต่อเดือน" (contributions) ยังไม่มีกราฟมูลค่ารวมของพอร์ตตามเวลา เพราะ `investmentValues[type]` เก็บแค่ค่าล่าสุดจุดเดียว (เขียนทับทุกครั้ง) ถ้าจะทำต้องเปลี่ยนโครงสร้างเป็น history array `[{value,date}]` แทน — เป็นงานใหญ่กว่าที่เหลือ ต้องคิด migration ให้ดี
   - **สัดส่วนเทียบเป้าหมายการจัดพอร์ต (asset allocation target)**: การ์ด "ภาพรวมพอร์ตตามประเภท" (เฟส 4) โชว์แค่สัดส่วนจริง ยังไม่มีให้ตั้งเป้าเช่น "crypto ไม่เกิน 10%" แล้วเทียบว่าตอนนี้เกินหรือยัง
   - ~~**เชื่อมกับ Net Worth รวมทั้งบ้าน**~~ ✅ **เสร็จแล้ว (2026-08-22)** — ดูข้อ 9 ด้านล่าง
   - (เดิม) **เชื่อมกับ Net Worth รวมทั้งบ้าน**: ยังไม่มีหน้าไหนรวมเงินสด + การลงทุน + หนี้สิน ให้เห็น net worth เดียว — **หน้า Debts เสร็จแล้ว (2026-08-22) ทำต่อได้เลย** ข้อมูลที่ต้องใช้: `investmentValues`+`cryptoHoldings` (มูลค่าพอร์ต), `finance.debts[].currentBalance` (หนี้), เงินสดยังไม่มีที่เก็บ ต้องคิดว่าจะกรอกเองหรือคำนวณจาก income−expenses สะสม

5. **จัดหมวด "อื่นๆ" — เครื่องมือเสร็จแล้ว (2026-08-22) เหลือ ohm ไล่กดจัดจริง**
   - เพิ่มระบบเดาหมวด 2 ชั้น (วางก่อน `RecategorizeModal`): (1) **learned map** `secretary-memo-cat-map` — จำ memo→หมวด ทุกครั้งที่ผู้ใช้กดย้ายเอง (ทั้งจาก `apply()` และ `applyAllGuesses()`) (2) **`CATEGORY_RULES`** กฎคำค้นตั้งต้น 8 หมวด (อาหาร/ของใช้ซูเปอร์/เดินทางน้ำมัน/ช้อปปิ้งออนไลน์/บันเทิงสมาชิก/สุขภาพ/สาธารณูปโภค/ค่าธรรมเนียม) — `guessCategory(memo,map)` คืน `{cat,by:"learned"|"rule"}`
   - ใน `RecategorizeModal`: แต่ละกลุ่ม memo โชว์ป้าย "→ หมวดที่เดา" (เขียว=learned / ม่วง=rule), แถบสรุปข้อเสนอด้านบนกดเลือกทั้งชุดต่อหมวดได้, ปุ่ม **"ย้ายทั้งหมดตามที่เดา"** (มี `window.confirm` สรุปจำนวนต่อหมวดก่อน)
   - เพิ่มแบนเนอร์ม่วงในแท็บ Expenses: นับรายจ่ายที่ category เป็น "อื่นๆ"/"อื่น ๆ"/"ไม่ระบุ"/ว่าง + ยอดรวม (ใช้ `expOut`) + ปุ่ม "จัดหมวดเลย" เปิด `RecategorizeModal` ด้วย `startCat="อื่นๆ"` (state `showRecatExp` ใน `FinanceExpensesTab`) — เดิมเข้าได้จากหน้า Review เท่านั้น
   - **แยกรายการเป็นหลายหมวด (split transaction) — เสร็จแล้ว (2026-08-22)**: เพิ่ม `SplitExpenseModal` (วางก่อน `FinanceExpensesTab`) + ไอคอน `SplitIcon = makeIcon("fa-code-branch")`
     - **วิธีเก็บข้อมูล (ตัดสินใจแล้ว): แตกเป็นแถวจริงหลายแถวใน `finance.expenses` แล้วลบแถวเดิมทิ้ง** ไม่ใช้ nested object / ไม่มี field ยอดย่อยซ้อน — เหตุผล: ทุกจุดที่รวมยอด/กราฟ/งบ/รีวิว ทำงานต่อได้ทันทีโดยไม่ต้องแก้ตรรกะที่ไหนเลย (ถ้าเก็บซ้อนต้องไล่แก้ทุกจุดที่ sum)
     - trace ย้อนกลับด้วย `splitFrom` (id รายการเดิม) + `splitGroup` (จับกลุ่มแถวที่มาจากรายการเดียวกัน), memo ต่อท้าย `(แยก i/n)`, ทุกแถว `amount` ติดลบตามกฎเดิม
     - กรอกเป็น**จำนวนเงิน** (ไม่ใช่ %) เพราะตรงกับสลิปจริงที่มีตัวเลขอยู่แล้ว มีปุ่มลูกศร "ใส่ยอดที่เหลือ" ต่อแถว + แถบสรุป "รวม X / ยอดเดิม Y" ปุ่มยืนยัน disabled จนกว่าผลรวมจะเท่ายอดเดิม (tolerance 0.01) และทุกแถวมีหมวด+ยอด>0
     - เข้าถึงได้ 2 ที่: ปุ่มไอคอนกิ่งไม้ต่อแถวในตาราง All Expenses, และใน `RecategorizeModal` เฉพาะกลุ่มที่มี **รายการเดียว** (`g.count===1`) เพราะกลุ่มหลายรายการแยกทีเดียวไม่ได้
     - **หมายเหตุโครงสร้าง JSX:** `RecategorizeModal` ถูกห่อด้วย `<>...</>` แล้ว และ `SplitExpenseModal` ถูก render **นอก** `.modal-backdrop` ของตัวมัน — ไม่งั้นคลิกปิด modal ซ้อนจะ bubble ไปโดน `onClick={onClose}` ของ backdrop ตัวนอกด้วย
   - **เดาหมวดตอน import CSV — เสร็จแล้ว (2026-08-22)**: ใน `handleCSVUpload` โหลด `loadMemoCatMap()` ครั้งเดียวต่อการ import แล้วเดาหมวด**เฉพาะแถวที่ CSV ไม่ได้ระบุหมวด** (`VAGUE=["อื่นๆ","อื่น ๆ","ไม่ระบุ",""]` เทียบกับ `catNorm`) — แถวที่ CSV มีหมวดชัดเจนอยู่แล้วไม่แตะ แถวที่ถูกเดาติด `guessedCategory:true` ไว้ตรวจย้อนหลังได้ และ alert สรุปท้ายบอกจำนวนที่เดาให้
   - **split สืบทอด `linkedDebtId`**: ถ้ารายการเดิมเคยยืนยันจับคู่หนี้ไปแล้ว แถวย่อยที่แตกออกมาจะพก `linkedDebtId` ไปด้วย ไม่งั้นจะกลับมาโผล่ในรายการรอยืนยันของหนี้ตัวนั้นซ้ำ
   - ตรวจ syntax ด้วย Babel ผ่านแล้ว

6. **หน้า Debts — สเปกสรุปสุดท้ายแล้ว (คุยจบในเซสชัน claude.ai 2026-08-22) พร้อมเริ่มโค้ดได้เลยในเซสชันถัดไป แบ่ง 2 เฟส:**

   **บริบท/การตัดสินใจที่คุยไว้แล้ว (ห้ามถามซ้ำ):**
   - **ไม่โยงกับ Tracker/Goals** (ต่างจาก investments เฟส 3) — หน้า Debts ทำงานอิสระ ไม่ query จาก `projects`
   - หนี้มี **2 ชนิด (kind)**: `external` = หนี้จริงกับเจ้าหนี้ภายนอก (ผ่อนรถ/บ้าน/บัตรเครดิต/กู้สหกรณ์/อื่นๆ) และ `self` = หนี้ตัวเอง (ดึงเงินเก็บ/เงินลงทุนมาใช้จ่ายเอง แล้วถือเป็นหนี้ที่ต้องคืนตัวเอง)
   - หนี้ชนิด `self`: ยอดคงเหลือ **กรอกเองล้วนๆ** ไม่ผูก/ไม่หักกับ `finance.investments` หรือ `investmentValues` อัตโนมัติเด็ดขาด (กันข้อมูล 2 ที่ไม่ตรงกัน) — เป็นแค่บัญชีคู่ขนานที่ผู้ใช้ปรับเลขเองเป็นระยะ
   - **จับคู่กับ Expenses**: ให้ตั้งค่า `linkedExpenseCategory` ต่อหนี้ 1 รายการได้ (เช่น หนี้ "ผ่อนรถ" ผูกกับหมวดรายจ่าย "ผ่อนรถ") ระบบจะ**โชว์ให้ดูว่าพบรายจ่ายตรงหมวดกี่รายการ/รวมเท่าไหร่ แล้วให้ผู้ใช้กดยืนยันเองเพื่อหักยอดคงเหลือ** — ห้ามหักอัตโนมัติทันทีที่เจอ (ผู้ใช้เลือกทางนี้ชัดเจน ไม่ใช่ auto-deduct)
   - **จับคู่กับรายการหักในสลิปเงินเดือน** (เช่น หักเงินกู้สหกรณ์): **ยังไม่ทำตอนนี้** เป็นงานอนาคต (ยังไม่ได้ระบุว่าจะแยกรายการหนี้แต่ละตัวจากสลิปยังไง) — อย่าเริ่มทำส่วนนี้เองถ้าไม่ได้ถูกขอ

   **โครงสร้างข้อมูล** (เพิ่มใน `finance.finance.debts`, ปัจจุบันเป็น `[]` เปล่าไม่มี field กำหนดตายตัว):
   ```
   {
     id, kind: "external"|"self",
     name,                    // ชื่อหนี้/เจ้าหนี้ เช่น "ผ่อนรถ Honda", "ยืมเงินเก็บมาซ่อมบ้าน"
     type,                    // external: "car-loan"/"mortgage"/"coop-loan"/"credit-card"/"personal-loan"/"other" | self: "other" พอ (ไม่ต้องมี subtype ซับซ้อน)
     principal,                // ยอดตั้งต้น (optional โดยเฉพาะ self ที่อาจไม่ทราบยอดตั้งต้นชัดเจน)
     currentBalance,          // ยอดคงเหลือ กรอกเองเป็นระยะ (เหมือน investmentValues) เก็บที่ตัวหนี้แต่ละรายการตรงๆ ไม่ต้องมี object แยกเหมือน investmentValues เพราะหนี้ไม่ได้มี fixed type ชุดเดียวแบบ investments
     updatedAt,                // วันที่แก้ currentBalance ล่าสุด
     interestRate,             // % ต่อปี, optional, ส่วนใหญ่ใช้กับ external
     minPayment,                // ผ่อนขั้นต่ำ/เดือน, optional
     dueDay,                    // วันครบกำหนดชำระในเดือน (1-31), optional
     linkedExpenseCategory,    // ชื่อหมวดรายจ่ายที่จะ match (optional, ต้องตรง category string เป๊ะเหมือนที่ใช้ใน expenses)
     note, startDate, source:"manual"
   }
   ```
   - Expense ที่ถูกยืนยันจับคู่แล้วให้เติม field `linkedDebtId` ลงใน object รายจ่ายนั้นเอง (กัน suggest ซ้ำรอบถัดไป) — เหมือน pattern `_fromExpenseId` ที่ใช้แก้บั๊ก investment import ไปแล้ว

   **เฟส 1 — CRUD หนี้พื้นฐาน** ✅ **เสร็จแล้ว (2026-08-22)**
   - เขียน `FinanceDebtsTab` ใหม่ทั้งหมด (แทน placeholder เดิม) + `FinancePage` ส่ง props `finance={data} persist={persist}` แล้ว
   - เพิ่มค่าคงที่ก่อน component: `DEBT_KINDS` (external/self), `DEBT_TYPES_EXTERNAL` (car-loan/mortgage/coop-loan/credit-card/personal-loan/other), `DEBT_TYPE_LABELS`, `DEBT_KIND_STYLE` (สี badge ส้ม=external / ฟ้า=self)
   - stat row 4 การ์ด: หนี้คงเหลือรวม (+จำนวนรายการ) / หนี้ภายนอก / หนี้ตัวเอง / ผ่อนขั้นต่ำรวมต่อเดือน
   - ฟอร์ม "เพิ่มหนี้ใหม่": เลือก kind ก่อน แล้วฟิลด์ปรับตาม — `self` ไม่โชว์ ประเภท/ดอกเบี้ย/วันครบกำหนด (โชว์ "วันที่เริ่ม" แทน) ปุ่ม + disabled จนกว่าจะมีชื่อ + ยอดคงเหลือ > 0
   - ตารางหนี้เรียงยอดคงเหลือมากไปน้อย + แก้ไข inline (ดินสอ → ฟอร์มในแถว → ✓/✕/ถังขยะ) pattern เดียวกับ `FinanceInvestmentsTab` — `updatedAt` อัปเดตอัตโนมัติเฉพาะตอน `currentBalance` เปลี่ยนจริง
   - `linkedExpenseCategory` เขียนเป็น `null` ไว้แล้วตอนสร้าง (รอเฟส 2) ยังไม่มี UI
   - ตรวจ syntax ด้วย Babel ผ่านแล้ว

   สเปกเดิมของเฟส 1:
   - แก้ `FinancePage`: `{tab==="debts"&&<FinanceDebtsTab/>}` → ต้องส่ง props `<FinanceDebtsTab finance={data} persist={persist}/>` (ตอนนี้ placeholder ไม่รับ props เลย)
   - เขียน `FinanceDebtsTab` ใหม่ทั้งหมด (ทิ้ง placeholder เดิม): การ์ดสรุป (ยอดหนี้คงเหลือรวมแยก external/self, ผ่อนขั้นต่ำรวมต่อเดือน, จำนวนรายการ) + ตารางหนี้ (แสดง badge ชนิด external/self แยกสี) + แก้ไข `currentBalance`/field อื่นๆ inline แบบเดียวกับที่เพิ่งทำใน `FinanceInvestmentsTab` (ปุ่มดินสอ→ฟอร์มในแถว→✓/✕/ถังขยะ) + ฟอร์มเพิ่มหนี้ใหม่ (เลือก kind ก่อน แล้วฟิลด์ที่เหลือปรับตาม kind เช่น self ไม่ต้องโชว์ interestRate/dueDay)
   - ตรวจ Babel ให้ผ่านตามเดิม

   **เฟส 2 — จับคู่กับ Expenses แบบยืนยันเอง** ✅ **เสร็จแล้ว (2026-08-22)** — ครบทั้ง 2 เฟสแล้ว
   - เพิ่ม `linkedExpenseCategory` เป็น dropdown ทั้งในฟอร์มเพิ่มหนี้ (คู่กับช่องโน้ต) และในโหมดแก้ไข inline (เป็น **แถวที่ 2 เต็มความกว้าง** ใต้แถวหนี้ — ห่อทั้งคู่ด้วย `React.Fragment` เพราะตารางแคบเกินจะยัดคอลัมน์เพิ่ม)
   - **validation กันหมวดซ้ำ**: `takenCat` map หมวด→debt id, `catDisabled(cat,selfId)` ทำให้ option ที่ถูกหนี้อื่นจองไว้เป็น `disabled` พร้อมป้าย "(ผูกกับหนี้อื่นแล้ว)" — กันที่ตัว dropdown เลย ไม่ต้องเขียน validation ตอน save
   - แถวสรุปใต้หนี้ที่ผูกหมวดไว้: `pendingFor(d)` หารายจ่ายในหมวดนั้นที่ยังไม่มี `linkedDebtId` (**ทุกเดือนย้อนหลัง** ไม่จำกัดเดือนปัจจุบัน) แสดง "พบ N รายการ รวม ฿X (วันแรก → วันสุดท้าย)" + ปุ่ม "ยืนยันหักยอดคงเหลือ"
   - `confirmMatch(d)`: persist ครั้งเดียว — `currentBalance -= sum` + `updatedAt=today` และ mark `linkedDebtId` ให้ทุกรายจ่ายที่เพิ่งยืนยัน
   - รวมยอดใช้ `expOut(e)` (ไม่ใช่ `Math.abs`) → รายการ `csv-refund` ที่ amount เป็นบวกจะหักลบออกจากยอดถูกต้อง
   - เทียบชื่อหมวดแบบ normalize เว้นวรรค (`catKey`) ตามบทเรียนบั๊ก "ออม  ลงทุน" ในข้อ 4.1
   - ตรวจ syntax ด้วย Babel ผ่านแล้ว
   - **ต่อได้แล้ว:** ไอเดีย "เชื่อมกับ Net Worth รวม" ในข้อ 4.4 ไม่ติด blocker อีกต่อไป (หน้า Debts มีข้อมูลครบแล้ว)

   สเปกเดิมของเฟส 2:
   - ในฟอร์มเพิ่ม/แก้ไขหนี้ เพิ่มช่องเลือก `linkedExpenseCategory` (dropdown จากหมวดรายจ่ายที่มีอยู่จริงใน `finance.finance.expenses`)
   - ในการ์ดหนี้แต่ละรายการที่มี `linkedExpenseCategory`: คำนวณรายจ่ายในหมวดนั้นที่ยังไม่มี `linkedDebtId` (ทุกเดือนที่ผ่านมา หรือจะจำกัดแค่เดือนปัจจุบันก็ได้ ต้องตัดสินใจตอนทำจริง) รวมยอด แล้วโชว์ปุ่ม "พบรายจ่ายตรงกับหนี้นี้ ฿X (N รายการ) — ยืนยันหักยอดคงเหลือ" กดแล้ว: `currentBalance -= X` และ mark `linkedDebtId` ให้ทุกรายจ่ายที่เพิ่งยืนยัน
   - ระวัง: รายจ่าย 1 รายการควร map กับหนี้ได้แค่ 1 ตัว (เพราะ `linkedDebtId` เป็นค่าเดียว) ถ้าหมวดเดียวกันถูกผูกกับหนี้ 2 ตัว ต้องคิด validation กันไว้ (เช่น กันตั้ง `linkedExpenseCategory` ซ้ำหมวดเดียวกันข้ามหนี้ 2 ตัว)

   เมื่อทำเสร็จทั้ง 2 เฟส อัปเดตหมายเหตุในข้อ 4.4 บรรทัด "เชื่อมกับ Net Worth" ว่าทำต่อได้แล้ว

9. **Net Worth — เสร็จแล้ว (2026-08-22)**
   - เพิ่ม `finance.cashAccounts = [{id,name,balance,updatedAt}]` ใน `DEFAULT_DATA.finance` (คอมโพเนนต์อ่านแบบ `||[]` ไม่ต้อง migration)
   - **ตัดสินใจ:** เงินสด**กรอกยอดคงเหลือเองเป็นระยะ** ไม่คำนวณสะสมจาก income−expenses เพราะข้อมูลไม่ครอบคลุมทุกบัญชี จะเพี้ยนแบบเงียบๆ — โครงเดียวกับ `investmentValues` และ `debts.currentBalance`
   - **helper กลาง (แหล่งคำนวณเดียว อย่าคำนวณซ้ำที่อื่น)** วางก่อน `FinanceDebtsTab`: `nv()`, `cryptoPortfolioValue(f)`, `portfolioValue(f)`, `totalDebtBalance(f)`, `totalCash(f)` — `FinanceInvestmentsTab` ถูกแก้ให้เรียก `cryptoPortfolioValue`/`portfolioValue` แทนการ reduce เองแล้ว ตัวเลขจะไม่มีวันไม่ตรงกัน
   - `NetWorthCard` วางเป็นการ์ดแรกของแท็บ **Overview** (`FinanceOverviewTab` รับ prop `persist` เพิ่มแล้ว): ยอด net worth ที่หัวการ์ด + แถบสัดส่วน (เงินสด+ลงทุน เทียบกับ หนี้) + กดพับเปิดตารางบัญชีเงินสดเพื่อเพิ่ม/แก้/ลบ (แก้ทันทีแบบ cryptoHoldings, `updatedAt` เซ็ตอัตโนมัติ)
   - เตือนบัญชีที่ไม่ได้อัปเดตเกิน 30 วัน (pattern เดียวกับ `staleTypes` ของ Investments)

10. **แบนเนอร์หมวด "อื่นๆ" ปิดได้ (2026-08-22)** — ohm จัดหมวดครบแล้ว ที่เหลือคือ "อื่นๆ" จริง ปุ่ม "ที่เหลือคืออื่นๆ จริง" เก็บ**จำนวนรายการตอนกดปิด**ลง `secretary-vague-dismiss` (ไม่ใช่ปิดถาวร) — ถ้ามีรายการ "อื่นๆ" เพิ่มขึ้นจากตอนนั้น (เช่น import รอบใหม่ที่เดาหมวดไม่ได้) แบนเนอร์จะกลับมาเองพร้อมบอกว่าเพิ่มขึ้นกี่รายการ

11. **แยก CSS + แก้ service worker (2026-08-22)**
   - `styles.css` แยกออกจาก JSX แล้ว (ไฟล์หลักเล็กลง ~55KB) แก้ CSS ได้โดยไม่แตะ JS และไม่กิน context ตอนอ่านไฟล์หลัก
   - `sw.js`: bump `CACHE_NAME` เป็น `secretary-ohm-v2` + เพิ่ม `styles.css`/`config.js` ใน precache
   - **แก้ปัญหาที่ยังไม่ทันเจอ:** เดิม sw เป็น cache-first ทั้งหมด แปลว่าเครื่องที่เคยเปิดแอปแล้วจะติดเวอร์ชันเก่าถาวรจนกว่าจะ bump cache — เปลี่ยนไฟล์แอปของเราเอง (`.html`/`.css`/`config.js`) เป็น **network-first** (fallback cache เมื่อออฟไลน์) ส่วน CDN ยังคง cache-first เหมือนเดิม
   - **หลังจากนี้ทุกครั้งที่ deploy ยัง bump `CACHE_NAME` ด้วยเสมอ** เป็นกันชนอีกชั้น

12. **กับดักที่เสียเวลาไปแล้ว 2026-08-23 — `file://` vs GitHub Pages (อ่านก่อนแนะนำ ohm ทดสอบ)**
   - เปิด `preview-dashboard.html` จากไฟล์ในเครื่อง (`file://`) แล้วกดเชื่อม Google Drive จะได้ `400: invalid_request` เสมอ — เพราะ OAuth Client ตั้ง Authorized JavaScript origin ไว้แค่ `https://supakit-ohm.github.io` ส่วน `file://` ส่ง origin เป็น `null` ซึ่ง Google ไม่รับ **ไม่ใช่บั๊กของโค้ด อย่าไปไล่แก้โค้ด**
   - `file://` กับ Pages เป็นคนละ origin → **localStorage คนละก้อน** ข้อมูลไม่ไหลถึงกัน ohm เคยกรอกข้อมูลการเงินทั้งหมดลงฝั่ง `file://` มาแล้ว
   - **วิธีย้ายข้อมูลข้าม origin: Export JSON ฝั่งต้นทาง → Import ฝั่งปลายทาง** (ทดสอบจริงแล้วได้ผล ข้อมูลครบ)
   - ตอนกดเชื่อม Drive ครั้งแรกหลัง import กล่อง confirm สลับกับสัญชาตญาณ: **OK = ดึงจาก Drive มาทับเครื่องนี้ / Cancel = เก็บของเครื่องนี้แล้วอัปทับ Drive** — หลัง import ต้องกด **Cancel** ถ้ากด OK ข้อมูลที่เพิ่ง import หายทันที **ควรพิจารณาแก้ข้อความ/เปลี่ยนเป็น modal ที่มีปุ่มบอกผลลัพธ์ชัดๆ แทน `window.confirm`**
   - แนวทางบอก ohm: ใช้งานจริงเปิดจาก URL เท่านั้น, ไฟล์เดสก์ท็อปไว้ทดสอบ UI หลังแก้โค้ดก่อน push (ถ้าต้องทดสอบ Drive sync ก่อน push ให้เปิดผ่าน `python -m http.server` แล้วเพิ่ม `http://localhost:8000` ใน OAuth origins)

13. **สถานะ deploy: ขึ้น GitHub Pages เรียบร้อยแล้ว (2026-08-23)** — ทดสอบครบวงจร เดสก์ท็อป → Drive → มือถือ ข้อมูลตรงกันทุกเครื่อง ฟีเจอร์ทั้งหมดจากรอบ 2026-08-22 (Debts 2 เฟส, Net Worth, split transaction, เดาหมวดอัตโนมัติ, แยก CSS, sw network-first) ใช้งานจริงแล้ว

14. **ปรับปรุงพอร์ตคริปโตรายเหรียญ (2026-08-23)**
   - `coinStat(h)` ใน `FinanceInvestmentsTab` คืน `{cost,value,pnl,pct,share}` ต่อเหรียญ — ทุกตัวเลขในตารางคริปโตมาจากตัวนี้ตัวเดียว
   - ตารางเดิม 6 คอลัมน์เท่าเดิม (ไม่เพิ่มคอลัมน์เพราะมือถือจะล้น) แต่ใส่ข้อมูลเป็น**บรรทัดที่สองใต้แต่ละช่อง**: สัดส่วน % ใต้ชื่อเหรียญ / ต้นทุนรวม ใต้ต้นทุนเฉลี่ย / อายุราคา ใต้ราคาปัจจุบัน / กำไร-ขาดทุน ฿ และ % ใต้มูลค่า
   - เพิ่ม `priceUpdatedAt` แยกจาก `updatedAt` — อัปเดตเฉพาะตอนแก้ `currentPrice` (แก้ชื่อ/จำนวนไม่นับว่าเช็คราคาใหม่) แถวเก่าที่ไม่มี field นี้แสดง "ยังไม่เคยอัปเดต" ไม่ต้อง migration
   - เตือนราคาค้างเกิน **7 วัน** (สั้นกว่าประเภทอื่นที่ใช้ 30 วัน เพราะคริปโตผันผวนเร็ว)
   - สรุปบนการ์ด: กำไร/ขาดทุนรวมมี % ต่อท้าย + บรรทัด "ดีที่สุด/แย่ที่สุด" เทียบเป็น %
   - **ปุ่ม "เรียงตามมูลค่า" เป็นการกดเอง ไม่เรียงอัตโนมัติ** — ถ้าเรียง realtime แถวจะกระโดดระหว่างที่ผู้ใช้กำลังพิมพ์ตัวเลข
   - ทดสอบด้วย smoke test แล้ว: BTC 40%/+50%, ETH 60%/-25%, แบนเนอร์เตือนราคาเก่าทำงาน ไม่มี runtime error

15. **พอร์ตคริปโตรองรับ 2 สกุลเงิน THB/USD (2026-08-23)**
   - เพิ่ม `finance.fxRate = { USDTHB: {value, updatedAt} }` ใน `DEFAULT_DATA.finance` — **กรอกเรตเองเป็นระยะ ไม่ต่อ API** ตามแนวทางเดิมของแอป (ช่องกรอกอยู่บนการ์ดพอร์ตคริปโต)
   - `cryptoHoldings` เพิ่ม `costCurrency`/`priceCurrency` (**เลือกแยกกันต่อช่อง** เพราะ ohm ซื้อผ่าน Binance เป็น USDT แต่บางเหรียญซื้อผ่าน Binance TH เป็นบาท และมักเช็คราคาปัจจุบันเป็น USD), `costFxRate`, `platform`, `firstHeldDate` — ไม่มี field = `"THB"` แถวเก่าจึงคำนวณเหมือนเดิม ไม่ต้อง migration
   - **กฎที่ห้ามพลาด — เรตต้นทุน ≠ เรตปัจจุบัน:** `holdingCostTHB()` ใช้ `costFxRate` (เรตตอนซื้อ) ถ้ากรอกไว้ ไม่ใช่เรตวันนี้ ส่วน `holdingValueTHB()` ใช้เรตวันนี้เสมอ — ถ้าใช้เรตเดียวแปลงทั้งคู่ ต้นทุนในอดีตจะขยับตามค่าเงินทุกครั้งที่อัปเดตเรต ทำให้กำไร/ขาดทุนเพี้ยนแบบเงียบๆ (เงินบาทที่จ่ายไปจริงล็อกไปแล้ว) ถ้าไม่กรอก `costFxRate` จะ fallback ไปเรตปัจจุบัน
   - helper ทั้ง 4 (`usdThb`, `holdingCostTHB`, `holdingValueTHB`, `cryptoPortfolioValue`) เป็น global อยู่กับกลุ่ม Net Worth — **ทุกที่ที่คิดมูลค่า crypto ต้องผ่าน helper นี้เท่านั้น** ห้าม reduce เอง
   - แบนเนอร์แดงเตือนถ้ามีแถว USD แต่ยังไม่กรอกเรต (ไม่งั้นมูลค่าจะเป็น 0 เงียบๆ)
   - ทดสอบจริง: BTC ซื้อ USD เรตตอนซื้อ 34 / ราคาปัจจุบัน USD เรต 36 → ต้นทุน ฿20,400 มูลค่า ฿32,400 (+58.8%), ETH ซื้อบาท/ราคา USD → -25.0% ทุกยอดตรง ไม่มี runtime error
   - **ยังไม่ได้ทำ:** ผลตอบแทน %ต่อปี (มี `firstHeldDate` พร้อมแล้ว), ตั้งเป้าสัดส่วนพอร์ต, จำนวนที่ stake/lock แยก

16. **สรุปแยกพอร์ต + บันทึก DCA รายงวด (2026-08-23)**
   - **บริบทของ ohm (สำคัญต่อการออกแบบ):** มี 2 พอร์ต — `Binance Global` = เหรียญเก่าที่ซื้อไว้แล้วถือยาว ไม่ซื้อเพิ่ม (ต้นทุนนิ่ง แตะแค่ราคาปัจจุบัน) / `Binance TH` = **ตั้ง DCA ซื้อทุกวัน** แต่จะมาอัปเดตเป็นรายเดือน
   - **สรุปแยกตามพอร์ต** (`byPlatform`/`platformList` จัดกลุ่มจาก `h.platform`) แสดงใต้บรรทัดดี/แย่ที่สุด เมื่อมีมากกว่า 1 พอร์ต: ใส่ไป / มูลค่า / กำไร-ขาดทุน+% / สัดส่วน — กลยุทธ์คนละแบบต้องวัดผลแยกกัน
   - **`AddBuyModal`** (วางก่อน `FinanceInvestmentsTab`) ปุ่ม + ต่อแถวในตารางคริปโต — **ออกแบบให้กรอกยอดรวมของงวด ไม่ใช่รายครั้ง** เพราะ DCA รายวันเดือนหนึ่ง 30 รายการ กรอกทีละครั้งไม่มีใครทำไหว: ใส่ "งวดนี้ได้กี่หน่วย + จ่ายรวมเท่าไร (THB/USD)" แล้วระบบคิดต้นทุนเฉลี่ยถ่วงน้ำหนักใหม่ให้ พร้อมพรีวิวก่อนกดบันทึก
   - หลัง merge **`costCurrency` กลายเป็น `"THB"` เสมอ** (งวดที่จ่าย USD ถูกล็อกด้วยเรตของงวดนั้นตอนบันทึกไปแล้ว) — modal เตือนไว้ก่อนกดถ้าต้นทุนเดิมเป็น USD
   - เก็บทุกงวดใน `h.buys[] = [{id,date,qty,total,currency,fxRate,totalTHB}]` — **ข้อมูลนี้คือวัตถุดิบของ XIRR** ถ้าไม่เก็บตั้งแต่ตอนนี้ ทำผลตอบแทน %ต่อปี ทีหลังไม่ได้ ต้องย้อนกรอกใหม่ทั้งหมด (ตารางแสดง "บันทึกซื้อ N งวด" ใต้ชื่อเหรียญ)
   - ทดสอบจริง: ETH เดิม 0.5 หน่วย ต้นทุน ฿60,000 + ซื้อเพิ่ม 0.1 หน่วย ฿9,000 → ได้ 0.6 หน่วย เฉลี่ย ฿115,000 ถูกต้อง, สรุปแยกพอร์ตแสดงครบ ไม่มี runtime error
   - **งานต่อยอดที่พร้อมทำแล้ว:** XIRR/ผลตอบแทน %ต่อปี จาก `buys[]`+`firstHeldDate`, หน้าประวัติ DCA ต่อเหรียญ (ตอนนี้เก็บแล้วแต่ยังไม่มี UI ดูรายการ), ตั้งเป้าสัดส่วนพอร์ต

7. ลบโฟลเดอร์ `_to_delete/` และ `_reference-drive-sync/` ทิ้งถาวรเมื่อสะดวก (ใช้ประโยชน์ครบแล้ว)

---

## 8. ประวัติการตัดสินใจ (อย่าย้อนกลับโดยไม่ตั้งใจ)

| การตัดสินใจ | เหตุผล |
|---|---|
| ตัด legend chips ใต้กราฟวงกลมออก ใช้ป้ายบนชิ้นกราฟแทน | ลดความรก อ่านง่ายกว่า |
| กบข./กสจ. = **เงินออม** ไม่ใช่รายจ่าย | เป็นเงินของตัวเอง ไม่ได้หายไปไหน (~16,000 บาท/ปี) ถ้านับเป็นรายจ่ายจะทำให้ตัวเลขรายจ่ายพองเกินจริง |
| CSV: กรอง `move money` และ `deposit` ออก | ไม่ใช่รายจ่ายจริง เป็นการโอนย้าย |
| รวม Goals + To-do + Habits → Tracker เดียว | เดิมซ้ำซ้อนกัน |
| นำเข้าสลิปต้องมีหน้ายืนยันเสมอ | เป็นข้อมูลการเงิน + OCR ไทยไม่แม่นพอที่จะบันทึกอัตโนมัติ |
| แยกค่าคงที่ (ผ่อน/ภาษี/สาธารณูปโภค) ออกจากค่าใช้จ่ายผันแปร | ค่าคงที่ควบคุมไม่ได้ ถ้ารวมกันจะกลบสัญญาณของส่วนที่ควบคุมได้จริง |
| กรองแล้ว "เลือกทั้งหมด" = เลือกเฉพาะที่เห็น | กันลบข้อมูลเกินโดยไม่ตั้งใจ |
| แก้บั๊ก `Lightbulb is not defined` ใน FinancePage (บรรทัด 2112) — เพิ่ม `const Lightbulb = makeIcon("fa-lightbulb");` บรรทัด 76 | บั๊กเดิมที่มีอยู่ก่อนแล้ว (ไม่เกี่ยวกับงาน PWA) ทำให้แท็บ Finance ทั้งหน้าจอดำเพราะ React crash — เจอตอนทดสอบ 2026-08-20 |
| ใช้ `preview-dashboard.html` (React/Babel) เป็นฐานต่อไป ไม่เขียน PWA แยกใหม่ | secretary-app/ (vanilla JS) ขาดฟีเจอร์เกือบทั้งหมดเทียบกับไฟล์หลัก เขียนใหม่จะเสียของเดิมและเสี่ยงบั๊ก — เพิ่ม PWA/Drive sync เป็นชั้นบน preview-dashboard.html แทน (ดูข้อ 8.5) |

17. **แยกตารางพอร์ตคริปโตเป็นคอลัมน์ต่อพอร์ต (2026-08-23)** — ทำต่อจากข้อ 16 ตามที่ ohm ขอ (สองพอร์ตจริง Binance Global / Binance TH กลยุทธ์คนละแบบ อยากเห็นแยกกันชัดๆ แทนตารางรวม)
   - ตัดสินใจกับ ohm ไว้ 3 ข้อก่อนเริ่มแก้: (1) อิงคอลัมน์จาก `h.platform` **ตรงตัว** (free text เดิม ไม่บังคับ dropdown) (2) จอเล็ก (<900px) สลับจาก 2 คอลัมน์เคียงข้างเป็นซ้อนบน-ล่าง (3) แต่ละคอลัมน์มีหัว + สรุปย่อย (ใส่ไป/มูลค่า/กำไรขาดทุน%) อยู่เหนือตารางเหรียญของพอร์ตนั้น
   - ใน `FinanceInvestmentsTab`: `byPlatform` เดิม (ข้อ 16) เพิ่ม field `items:[]` เก็บ holdings ของแต่ละพอร์ตไว้ด้วย (เดิมมีแค่ยอดรวม), เพิ่ม `PLATFORM_ORDER=["Binance Global","Binance TH"]` ให้ `platformList.sort()` เอาสองชื่อนี้ขึ้นก่อนเสมอ ที่เหลือ (เช่น เหรียญที่ยังไม่กรอก platform → กลุ่ม "ไม่ระบุที่เก็บ") เรียงตามมูลค่าต่อจากนั้น
   - เอาบล็อกสรุปแยกพอร์ตแบบตารางแถวเดิม (ที่อยู่เหนือตารางรวม) ออก ย้ายข้อมูลเดียวกันไปโชว์เป็นหัวคอลัมน์แทน — ไม่มีข้อมูลซ้ำซ้อน
   - การ์ด "พอร์ตคริปโต" ยังมีส่วนบนเหมือนเดิมทั้งหมด (ต้นทุนรวม/มูลค่ารวมทั้งพอร์ต, ดีที่สุด/แย่ที่สุด, เรต USD→THB, แบนเนอร์เตือน, ปุ่ม "+ เพิ่มเหรียญ"/"เรียงตามมูลค่า") — เปลี่ยนแค่ตารางด้านล่างจากตารางเดียวเป็น `.crypto-platform-grid` (CSS grid 2 คอลัมน์) แต่ละคอลัมน์คือ `.crypto-platform-col` มีตาราง `.exp-table` ของตัวเองข้างใน (ฟิลด์/ปุ่มแก้ไข/ลบ/บันทึกซื้อเพิ่มเหมือนเดิมทุกอย่าง ไม่ตัดอะไรออก)
   - เพิ่ม CSS ใน `styles.css`: `.crypto-platform-grid` (`grid-template-columns:1fr 1fr`), `.crypto-platform-col`, `.crypto-platform-head` + media query `max-width:900px` สลับเป็น 1 คอลัมน์ (breakpoint เดียวกับ sidebar เดิม)
   - เหรียญที่ยังไม่กรอก platform (กด "+ เพิ่มเหรียญ" ใหม่) จะไปโผล่คอลัมน์ "ไม่ระบุที่เก็บ" ท้ายกริด ไม่หาย — พิมพ์ชื่อ platform ให้ตรง "Binance Global"/"Binance TH" เป๊ะๆ เพื่อให้ขึ้นคอลัมน์ที่ถูกต้อง (ยังไม่ได้ทำ normalize ช่องว่าง/ตัวพิมพ์เหมือนที่ทำกับ CSV import ข้อ 4.1 — ถ้าเจอปัญหาพิมพ์ผิดบ่อยค่อยกลับมาทำ)
   - ตรวจ syntax ด้วย Babel ผ่านแล้ว (`@babel/preset-react`) — ยังไม่ได้รัน smoke test เต็มรูปแบบ (playwright) รอบนี้ ให้ ohm เปิดแอปทดสอบเองก่อน push ว่าตารางแสดงถูกต้อง โดยเฉพาะกรณีมีเหรียญที่ platform ว่าง/สะกดไม่ตรง
   - **ยังไม่ได้ทำ:** ohm ยังไม่ได้กรอกข้อมูลพอร์ตจริงลงระบบ (ตามที่ค้างไว้ในข้อ "กำลังทำต่อ" ด้านบนไฟล์) — พร้อมกรอกได้เลยตอนนี้ที่ 2 คอลัมน์แยกแล้ว

18. **รื้อ UI หน้า Investments รอบใหญ่ (2026-08-23)** — ohm บอกว่าเวอร์ชันคอลัมน์คู่ของข้อ 17 ยังไม่ใช่ที่ต้องการ คุยสเปกกันใหม่ทั้งหน้าก่อนแก้ (ดูสรุปที่คุยไว้ด้านล่าง) แล้วรื้อทั้งหน้าตามนั้น

   **สเปกที่ ohm ยืนยันแล้ว (ห้ามถามซ้ำ):**
   - แถบพลังกำไร/ขาดทุน = แถบแนวนอนเริ่มจาก 0 เสมอ ยาวตาม |%| (เพดาน 100%) สีเขียว=กำไร/สีแดง=ขาดทุน — ไม่ใช่แบบเต็มแถบลบกึ่งกลาง
   - เลิกใช้ `<table>`/`exp-table` ทั้งหน้า Investments เปลี่ยนเป็น layout การ์ด/รายการหมด กัน scroll แนวนอน
   - manual entry: **เฉพาะฟอร์ม "เพิ่มรายการใหม่"** (เพิ่มเหรียญ, เพิ่มรายการลงทุน) เปลี่ยนเป็นปุ่ม + modal ส่วนแก้ไข/ลบของที่มีอยู่แล้วยังกดที่การ์ดแถวนั้นเหมือนเดิม (ไม่ต้องเปิด modal)
   - Contributions by Month (กราฟแท่ง) และ Savings & Investments (รายการทั้งหมด) ไม่ได้อยู่ในภาพที่ ohm อธิบาย — ตัดสินใจ **เก็บไว้ต่อจากส่วนที่ ohm อธิบาย** ไม่ตัดออก (Contributions เป็นกราฟแท่งอยู่แล้วไม่มี scroll ไม่ต้องแก้, Savings&Investments แปลงจากตารางเป็นการ์ดแทน)

   **โครงหน้าใหม่ (บนลงล่าง) ใน `FinanceInvestmentsTab`:**
   1. แถบสรุป 4 การ์ด (เงินใส่ไปสะสม/มูลค่าปัจจุบัน/กำไรขาดทุน/เฉลี่ยต่อเดือน) — เดิม ไม่แตะ
   2. **การ์ด Allocation** (แทนที่การ์ด "ภาพรวมพอร์ตตามประเภท" เดิม) — `.inv-alloc-grid` (grid 300px+1fr, media <900px เหลือ 1fr): ซ้าย `PieChart` สัดส่วนตามประเภท (`allocPieData` จาก `activeTypes`) มี `pie-center-overlay` โชว์มูลค่ารวมกลางวง, ขวา `.inv-alloc-list` — แต่ละประเภทเป็น `.pnl-row` มีชื่อ/มูลค่า/ใส่ไป/กำไรขาดทุน + แถบพลังจาก `renderPnlBar(pnl, pct)` (helper ใหม่ในคอมโพเนนต์ ใช้ร่วมกับข้อ 3)
   3. การ์ด "เป้าหมายการลงทุน" — เดิม ไม่แตะ
   4. **การ์ด พอร์ตคริปโต** — ยังเป็น `.crypto-platform-grid` 2 คอลัมน์ (Binance Global/TH) จากข้อ 17 แต่ข้างในเปลี่ยนจากตารางเป็น: มินิ `PieChart` (`.crypto-mini-pie`, สัดส่วนเหรียญในพอร์ตนั้น) ต่อด้วย `.inv-card-list` ของเหรียญ — แต่ละเหรียญเป็น `.inv-item-card` มี **โหมดดู** (ชื่อ/สัดส่วน/จำนวน/มูลค่า + แถบพลัง `renderPnlBar`) กับ **โหมดแก้ไข** (กดดินสอ `Edit3` สลับเข้า — ฟิลด์เดิมทั้งหมด onChange ผ่าน `editHolding` เหมือนเดิม เซฟสดทันทีที่พิมพ์ ปุ่ม "เสร็จแล้ว" แค่ปิดโหมดแก้ไข ไม่ได้ save เพิ่ม) ปุ่ม + (บันทึกซื้อ DCA) และถังขยะยังอยู่ที่หัวการ์ด
      - ปุ่ม "+ เพิ่มเหรียญ" เปลี่ยนจาก `addHolding()` (แทรกแถวว่างในตารางทันที) เป็นเปิด **`AddCoinModal`** ใหม่ (component แยก วางก่อน `FinanceInvestmentsTab`) กรอกครบทุกฟิลด์ในหน้าเดียวก่อนกดบันทึกทีเดียว มี `<datalist>` แนะนำ "Binance Global"/"Binance TH" ให้ช่องเก็บไว้ที่ กันพิมพ์เพี้ยนแล้วหลุดไปกลุ่ม "ไม่ระบุที่เก็บ"
   5. การ์ด "กรอกมูลค่าปัจจุบัน" — จากตารางเปลี่ยนเป็น `.inv-card-list` ของ `.inv-item-card` ต่อประเภท ยังกรอกอินไลน์ได้ตรงๆ (ไม่ใช่ modal เพราะเป็นการแก้ไขค่าที่มีอยู่แล้วทุกประเภท ไม่ใช่ "เพิ่มใหม่")
   6. กราฟ Contributions by Month — เดิม ไม่แตะ
   7. การ์ด "เพิ่มรายการลงทุน" — จากฟอร์มฝังหน้าเปลี่ยนเป็นปุ่ม "+ เพิ่มรายการ" เปิด **`AddInvestmentModal`** ใหม่ (component แยก) — state เดิม `invDate/invName/invType/invAmount/addInvestment` ถูกลบออกจาก `FinanceInvestmentsTab` ทั้งหมด (ย้าย logic เข้า modal + inline callback ตอนเรียก `onSave`)
   8. การ์ด "Savings & Investments" — ตารางเดิมเปลี่ยนเป็น `.inv-card-list` ของ `.inv-item-card` ต่อรายการ ยังมีโหมดดู/โหมดแก้ไขแบบเดิมทุกอย่าง (state `editInvId/editInvDraft/startEditInv/cancelEditInv/saveEditInv` ไม่ได้แตะ เปลี่ยนแค่ JSX จาก `<tr>` เป็น `<div>`)
   - เพิ่ม CSS ใหม่ใน `styles.css`: `.inv-alloc-grid/.inv-alloc-pie-frame/.inv-alloc-list`, `.pnl-row/.pnl-bar-track/.pnl-bar-fill`, `.inv-card-list/.inv-item-card/.inv-item-head/.inv-item-actions`, `.crypto-mini-pie`
   - ลบโค้ดที่ไม่ใช้แล้วออก: `addHolding()` เดิม (ตารางแถวว่าง), state/handler ของฟอร์ม "เพิ่มรายการลงทุน" แบบฝังหน้าเดิม
   - ตรวจ syntax ด้วย Babel ผ่านแล้ว (`@babel/preset-react`) — ~~ยังไม่ได้เปิดแอปทดสอบจริงเลยรอบนี้~~ ✅ **ทดสอบจริงผ่านแล้ว 2026-08-25 ดูข้อ 22** (งานใหญ่ รื้อ JSX หลายจุดพร้อมกัน) ต้องให้ ohm เปิดแอปเช็คเองก่อน push โดยเฉพาะ: กราฟวงกลม Allocation ขึ้นถูกไหม, กดดินสอแก้ไขเหรียญ crypto แล้วฟิลด์ขึ้นครบไหม, modal เพิ่มเหรียญ/เพิ่มรายการลงทุนบันทึกแล้วขึ้นในรายการจริงไหม, มือถือจอแคบไม่มี scroll แนวนอนจริงไหม
   - **ที่ตัดสินใจเองแทน ohm เพราะไม่ได้ถูกถามตรงๆ ต้องรีเช็ค:** ระดับความยาวแถบพลังใช้เพดาน 100% (เกินกว่านี้แถบเต็มเท่ากันหมด) — ถ้า ohm มีรายการกำไร/ขาดทุนเกิน 100% หลายตัวพร้อมกัน แถบจะดูไม่ต่างกันเท่าที่ควร แจ้งได้ถ้าอยากเปลี่ยนสเกล

19. **การ์ดโมเมนตัมบนแดชบอร์ด + ย้ายแถวการ์ดสถิติออกจากแผงม่วง (2026-08-24)** — ohm อยากได้ลูกเล่นที่ "น่าจูงใจ" บนหน้าแรก เห็นว่าก้าวหน้ากว่าเมื่อวาน/อาทิตย์ก่อน/เดือนก่อน/ปีก่อนเท่าไร
   - **สเปกที่ ohm ยืนยัน:** (1) ย้ายการ์ดสถิติออกจาก `.hero-panel` (เดิม 4 ช่องในแผงม่วงขวา ซึ่ง `display:none` เมื่อจอ <1200px = มือถือไม่เห็นเลย) มาเป็นแถวเต็มบนสุดของคอลัมน์หลัก เหนือ TodayPanel (2) **ความคืบหน้ารวมเฉลี่ยทุกโปรเจกต์เท่ากันหมด ไม่ถ่วงน้ำหนัก priority** — เหตุผลของ ohm: บางโปรเจกต์เป็นงาน สำคัญแต่ไม่ได้ให้คะแนนกับชีวิตมาก
   - `.hero-panel` เหลือแค่ปุ่ม Quick Capture (`.hero-tiles-solo` = grid 1 คอลัมน์) ข้อมูลสถิติไม่ซ้ำซ้อน
   - **helper ใหม่** (วางก่อน `migrateToTracker`): `activeProjectsAt`, `taskCompletionRateAt`, `projectProgressAt`, `overallProgressNow`, `overallProgressAt`, `earliestTrackerDate`, `progressOn`, `shiftISO`, `movementDates`, `momentumStreak`, `recordProgressSnapshot`
   - **`progressLog` ที่ root** (`{"YYYY-MM-DD": number}` ค่าความคืบหน้ารวม ทศนิยม 1 ตำแหน่ง) เขียนวันละครั้งผ่าน `useEffect` ใน `SecretaryDashboard` เฉพาะตอนค่าเปลี่ยน เก็บย้อนหลัง 800 วัน (~30KB/ปี) — **อยู่ที่ root ไม่ใช่ใน finance**
   - **กฎที่ห้ามพลาด:** `progressOn(data,date)` คืน `{value,exact}` — ใช้ `progressLog` ถ้ามี key ≤ วันนั้น (`exact:true`) ไม่งั้น fallback คำนวณย้อนหลังจาก `checkins[]`/`completions{}` (`exact:false` → UI แสดงเครื่องหมาย `~`) และคืน **`null`** ถ้าย้อนไปก่อน `earliestTrackerDate` (UI แสดง "—" ไม่ใช่ 0% เพราะ 0% ดูเหมือนล้มเหลว) — โปรเจกต์แบบ `manual` ไม่มีประวัติจริง ค่าย้อนหลังจะเป็นเส้นแบน นี่คือเหตุผลที่ต้องเริ่มเก็บ `progressLog` ตั้งแต่วันนี้
   - `momentumStreak` นับวันติดกันที่ "มีการขยับ" = มี check-in หรือติ๊กงานประจำรายวัน หรือปิดงานครั้งเดียว (งานรายสัปดาห์/รายเดือนไม่นับ เพราะ key ไม่ใช่วันปฏิทิน) ข้ามวันนี้ได้ 1 วันเหมือน `taskStreak` เดิม
   - **คอมโพเนนต์ใหม่** (วางก่อน `SecretaryDashboard`): `useCountUp` (นับเลขขึ้น 800ms ease-out cubic), `MomentumSpark` (sparkline 30 วัน inline SVG ไม่พึ่ง Recharts), `MomentumCard` — วงแหวน SVG วาดตัวเองด้วย `stroke-dasharray`, สีตามสถานะ: `hot` (เขียวเรือง ขยับ ≥1% ใน 7 วัน) / `warm` (ม่วง) / `cold` (จาง `filter:saturate(.55)` เมื่อ streak=0)
   - CSS ใหม่ท้าย `styles.css`: `.dash-stat-row` (grid `minmax(280px,1.7fr) repeat(3,1fr)`, <900px → 3 คอลัมน์ + การ์ดโมเมนตัม `grid-column:1/-1`, <560px → วงแหวน/sparkline ซ้อนแนวตั้ง), `.dash-tile*`, `.mom-*`
   - ตรวจ syntax ด้วย Babel ผ่านแล้ว + ทดสอบ logic ของ helper แยกใน Node ผ่านแล้ว (p1 numeric 114k/300k + p2 manual 40% → รวม 39.0%, ย้อน 1 เดือน 36.7%, ย้อน 1 ปี = null, streak 3 วัน ถูกต้อง) — ~~ยังไม่ได้เปิดแอปจริง~~ ✅ **ทดสอบจริงผ่านแล้ว 2026-08-25 ดูข้อ 22** (container รุ่นใหม่มี Chromium ให้แล้ว) ให้ ohm เปิดเช็คก่อน push: การ์ดขึ้นครบไหม, วงแหวนวาดแล้วเลขวิ่งไหม, จอมือถือไม่ล้น
   - **ที่ตัดสินใจเองแทน ohm ต้องรีเช็ค:** โปรเจกต์ที่เสร็จแล้ว (100%) ยังถูกนับรวมในค่าเฉลี่ย (ตัดออกเฉพาะ `status==="archived"`) — ถ้าสะสมโปรเจกต์เสร็จเยอะ ตัวเลขรวมจะถูกดันขึ้นค้างไว้ ทางแก้คือ archive โปรเจกต์ที่จบแล้ว หรือเปลี่ยนสูตรให้ตัด done ออก
   - **คุยกันไว้แต่ยังไม่ได้ทำ (เรียงตามที่ ohm สนใจ):** Timeline โปรเจกต์บนแกนเวลา, Tracker Review รายเดือน (`trackerReviews` ที่ root — "ขยับมากสุด/นิ่งสนิท N วัน/streak ที่ขาด"), ปรับ `expectedProgress` ให้ผ่อนผัน 14 วันแรก + เกณฑ์ยืดตามช่วง, `milestones[]` ต่อโปรเจกต์ + ปุ่มแบ่งหมุดอัตโนมัติ 25/50/75/100% + toast ตอนข้ามหมุด — ส่วนการผูก Tracker เข้ากับข้อมูล Finance/Debts จริง ohm ขอ**พักไว้ก่อน** จนกว่าฝั่ง Finance จะเรียบร้อย

   **แก้ตามที่ ohm สั่งเพิ่ม (2026-08-24, รอบสอง):** ยกเลิกการย้ายการ์ดสถิติออกมาคอลัมน์หลัก — **เอาทุกอย่างกลับเข้า `.hero-panel` (แผงม่วง) แล้วขยายแผงจาก `380px` เป็น `width:33%` (min 340 / max 560)** เรียงบนลงล่าง: ทักทาย → เวที/แบรนด์ → เวลา → **การ์ดโมเมนตัม** → 3 การ์ดสถิติ (`.hero-tiles` เปลี่ยนจาก 2 เป็น **3 คอลัมน์**: งานวันนี้/โปรเจกต์/โน้ต) → ปุ่ม Quick Capture เต็มความกว้าง (`.hero-cta-full`) → งานถัดไปวันนี้ · ลบ CSS `.dash-stat-row`/`.dash-tile*`/`.hero-tiles-solo` ที่ไม่ใช้แล้วออก · เพิ่ม override `.hero-panel .mom-*` ให้การ์ดโมเมนตัมกลืนกับพื้นม่วง (โปร่งแสง ตัดวงเรืองหลังการ์ด) + media 1400px สลับวงแหวน/sparkline เป็นแนวตั้งเมื่อแผงแคบ · **`.hero-panel` ยังซ่อนเมื่อจอ <1200px เหมือนเดิม — ohm บอกว่าจะไปจัดหน้ามือถือเองทีหลัง** ตรวจ Babel ผ่านแล้ว ยังไม่ได้เปิดแอปจริง

   **แก้เพิ่ม (2026-08-24, รอบสาม):** การ์ดที่ 3 ในแผงม่วงเปลี่ยนจาก "โน้ต" เป็น **"หนังสือ"** — เลขหลัก = กำลังอ่าน/ทั้งหมด, บรรทัดล่าง = อ่านแล้ว N เล่ม, ไอคอน `BookOpen`, กดแล้วไปหน้า Books (`setPage(5)`) · เพิ่ม `bookStats` (นับจาก `data.bookQueue` status `to-read`/`reading`/`done`) ไว้ใต้ `const notes=` ใน `SecretaryDashboard` · ตรวจ Babel ผ่าน

20. **หน้ายืนยันก่อน Import JSON (2026-08-25)** — ต่อยอดจากข้อ 9.1 (Export/Import เดิมที่ใช้แค่ `confirm()` ธรรมดา) ตามสเปกที่ ohm ยืนยันแล้ว
   - โค้ดยังอยู่ที่เดิม: IIFE plain JS ก่อน `<script type="text/babel">` (บรรทัด ~38 ในไฟล์) **ไม่ได้แตะ React เลย** ปุ่มยังอยู่ที่ `#driveBar` ซ้ายล่างของ Sidebar เหมือนเดิม (สำรองทั้งแอป ไม่ใช่แค่ Finance)
   - **Export ไม่เปลี่ยน** — ดาวน์โหลด `localStorage["secretary-dashboard-v1"]` ทั้งก้อนเป็น `secretary-backup-YYYY-MM-DD.json`
   - **ตรวจโครงสร้างก่อน (`validateShape`)** — ต้องมี `finance` (object) + `finance.income` + `finance.expenses` + `projects` + `tasks` เป็น array ครบ ถ้าไม่ครบ = ไม่ใช่ไฟล์ของแอปนี้ → `alert` บอกว่าข้อไหนไม่ผ่าน แล้ว**ไม่ให้นำเข้า** (return ทันที ไม่ถึงหน้ายืนยัน)
   - **หน้ายืนยัน (`showImportConfirm`)** — overlay DOM ล้วน (ไม่ใช่ React modal, `id=importConfirmOverlay`, z-index 9999) คืน Promise<boolean> ตาราง 4 คอลัมน์: หมวด / ไฟล์ที่จะนำเข้า / ข้อมูลปัจจุบัน / ต่าง — 5 แถว: รายรับ, รายจ่าย, เงินออม/ลงทุน, โปรเจกต์, งาน แต่ละช่องโชว์ จำนวนรายการ + ช่วงวันที่ (min → max) + ยอดรวมบาท (เฉพาะ 3 หมวดการเงิน) คอลัมน์ "ต่าง" = ผลต่างจำนวนรายการ เขียว/แดง
   - ปุ่ม: **สำรองก่อน** (เรียก `exportJson()` ดาวน์โหลดข้อมูล*ปัจจุบัน*ไว้ก่อน โดยไม่ปิด overlay) / **ยกเลิก** / **เขียนทับข้อมูลเดิม** (แดง) · ปิดได้ด้วย Esc หรือคลิกพื้นหลัง = ยกเลิก
   - helper ใหม่ใน IIFE เดียวกัน: `isArr`, `validateShape`, `pickDate` (ไล่ฟิลด์ `date/createdAt/created/startDate/dueDate/due/month` ตัวแรกที่ match `^\d{4}-\d{2}`), `dateRange`, `sumAmount`, `fmtBaht`, `statOf`, `summarize`, `esc`, `cellHtml`, `showImportConfirm` + const `DATE_FIELDS`, `CMP_ROWS`
   - ตรวจแล้ว: `node --check` ผ่าน (สคริปต์ plain), Babel `@babel/preset-react` ผ่าน (ส่วน JSX ไม่ได้แตะ), ทดสอบ logic ใน Node กับไฟล์ `secretary-backup-2026-08-23.json` จริง → validate ผ่าน, สรุปได้ รายรับ 11 (2026-01-27→2026-07-23, 375,226฿) / รายจ่าย 745 (2026-01-01→2026-07-31, -312,265฿) / ลงทุน 12 / โปรเจกต์ 2 / งาน 3 ถูกต้อง และ `{foo:1}` ถูกปฏิเสธพร้อมเหตุผล 3 ข้อ
   - **ยังไม่ได้เปิดแอปจริง** — ให้ ohm ทดสอบก่อน push: กดปุ่ม import แล้วเลือกไฟล์ `secretary-backup-2026-08-23.json` ดูว่าตารางขึ้นครบ แล้วกด **ยกเลิก** (อย่าเพิ่งกดเขียนทับ) + ลองเลือกไฟล์ JSON มั่วๆ ดูว่าเตือนแล้วไม่นำเข้า

21. **หมุดความคืบหน้าโปรเจกต์ (milestones) + toast (2026-08-25)** — ทำต่อจากรายการค้างท้ายข้อ 19
   **สเปกที่ ohm ยืนยันแล้ว (ห้ามถามซ้ำ):** (1) หมุดตั้งเป็น **% ล้วน** แต่ถ้าโปรเจกต์เป็น `numeric` ให้โชว์ค่าจริงคู่กัน เช่น 50% = 500,000 บาท (2) **ตั้งชื่อหมุดได้ ไม่ตั้งก็ใช้ % แทน** (3) toast **โผล่ได้ทุกหน้า + บันทึกลง activity**
   - **โครงข้อมูล:** `p.milestones = [{id, pct:1..100, label:"", reachedAt:"YYYY-MM-DD"|null}]` อยู่ในแต่ละ project (ไม่ใช่ที่ root) · `EMPTY_PROJECT` เพิ่ม `milestones:[]`
   - **helper ใหม่** (บล็อก `/* Milestones */` วางก่อน `/* Momentum */`): `AUTO_MILESTONE_PCTS=[25,50,75,100]`, `sortedMilestones`, `milestoneLabel`, `milestoneValue`, `milestoneValueText`, `autoMilestones` (ข้าม pct ที่มีอยู่แล้ว), `nextMilestone`, `syncMilestones`
   - **กฎที่ห้ามพลาด:** `syncMilestones(data)` คืน **`null` ถ้าไม่มีอะไรเปลี่ยน** — จำเป็นมาก ไม่งั้น persist วนไม่จบ · และมันถูกเรียกใน **effect เดียวกันกับ `recordProgressSnapshot`** แล้ว persist ครั้งเดียว ถ้าแยกเป็นสอง effect จะ spread จาก `data` ก้อนเดียวกันแล้วเขียนทับกันเอง (progressLog หาย)
   - **ProjectModal:** ส่วนตั้งหมุดอยู่เหนือ "สีประจำโปรเจกต์" — กรอก % + ชื่อ, ปุ่ม "เพิ่มหมุด" (เลือก % ว่างถัดไปทีละ 10) และ "แบ่งอัตโนมัติ 25/50/75/100" (disabled เมื่อมีครบแล้ว) · ตอนเซฟผ่าน `cleanMilestones()` clamp 1-100 + ตัด pct ซ้ำ + เรียง
   - **ProjectDetail:** การ์ด "หมุดความคืบหน้า (n/m)" เหนือการ์ด Project Tasks — แถบ `.ms-track` มีขีดหมุด `.prj-bar-ms` + `.ms-list` แต่ละหมุดโชว์ชื่อ/`%`/ค่าจริง/วันที่ถึง หรือ "อีก N%"
   - **ProjectCard (หน้า Tracker):** ขีดหมุดบนแถบเดิม + บรรทัด `.prj-card-next-ms` "หมุดถัดไป … อีก N%"
   - **Toast:** `MilestoneToast` (วางก่อน `SecretaryDashboard`) + state `toasts` ใน `SecretaryDashboard` render เป็น `.ms-toast-wrap` **ที่ root ของ `<div className="app">` เลยโผล่ได้ทุกหน้า** หายเองใน 7 วิ กดปิดได้ เก็บพร้อมกันสูงสุด 3 อัน · ทุกหมุดที่ข้ามลง activity ด้วย `source:"goal"`, `status:"completed"`
   - CSS ใหม่ท้าย `styles.css`: `.prj-bar-ms`, `.prj-card-next-ms`, `.ms-track`, `.ms-list/.ms-item*`, `.ms-edit-*`, `.ms-toast*` + `@keyframes msToastIn` + media 560px (toast เต็มความกว้าง) · `.ms-toast-icon` ใช้ `color-mix()` มี fallback สีทึบบรรทัดก่อนหน้า
   - ตรวจ Babel ผ่าน + ทดสอบ logic ใน Node ผ่าน: แบ่งอัตโนมัติได้ 25/50/75/100 (ถ้ามี 50 แล้วเหลือ 25/75/100), หมุด 50% ของโปรเจกต์เป้า 1,000,000 โชว์ "500,000 บาท", ข้าม 30%→80% ยิง 2 หมุด, รันซ้ำคืน null, ถอยกลับ 40% ล้าง reachedAt โดยไม่ยิง toast
   - **ที่ตัดสินใจเองแทน ohm ต้องรีเช็ค:** ความคืบหน้าถอยต่ำกว่าหมุด = **ล้าง `reachedAt`** (ข้ามใหม่จะเตือนซ้ำ) — โปรเจกต์แบบ `tasks` ที่ติ๊ก/ถอนติ๊กบ่อยอาจเด้ง toast บ่อย ถ้าไม่ชอบเปลี่ยนเป็น "ถึงแล้วถึงเลย" ได้ (ลบ branch `if(!hit&&m.reachedAt)` ใน `syncMilestones`)
   - **ยังไม่ได้เปิดแอปจริง** ให้ ohm เช็คก่อน push: ตั้งหมุดในโมดัลแล้วบันทึกขึ้นจริงไหม, การ์ดหมุดในหน้ารายละเอียดแสดงถูกไหม, ลากสไลเดอร์โปรเจกต์แบบ manual ข้ามหมุดแล้ว toast เด้งไหม, ขีดหมุดบนการ์ดหน้า Tracker ตรงตำแหน่งไหม

22. **รันเทสต์จริงย้อนหลังทั้ง 4 รอบ (2026-08-25) — ผ่าน 43/43 ไม่มี runtime error**
   - **สำคัญ: คอนเทนเนอร์ของ AI รัน Chromium ได้แล้ว** (มี Chromium ติดตั้งมาให้ที่ `/opt/pw-browsers/chromium-*/chrome-linux/chrome`) — บันทึกเดิมที่เขียนว่า "รัน playwright ไม่ได้เพราะไม่มีเน็ตถึง CDN" **ไม่จริงอีกต่อไป** ต่อไปนี้สั่งให้รัน smoke test จริงได้ทุกครั้ง ไม่ต้องรอ ohm เปิดเอง
   - `smoke-test.js` ขยายจาก 7 เช็ค → **43 เช็ค** ครอบคลุมข้อ 18/19/20/21 + จอมือถือ · เพิ่ม `CHROME_PATH=/path/to/chrome` env ไว้ชี้ Chromium ที่มีอยู่แล้ว (ไม่ใส่ = ใช้ของ playwright ตามเดิม) · seed ข้อมูลเพิ่ม: 3 โปรเจกต์ (manual/numeric/tasks) พร้อม `milestones`, tasks, checkins, `progressLog`, คริปโต 3 เหรียญ 2 พอร์ต + 1 เหรียญไม่ระบุที่เก็บ
   - **ผลที่ยืนยันแล้ว:** ข้อ 18 — Allocation pie วาด 4 ชิ้น, แถบพลัง 5 แถบ, กริดพอร์ต 3 คอลัมน์, มินิพาย 3 วง, **ตารางเหลือ 0 ตัว** (เป็นการ์ด 12 ใบตามสเปก), modal เพิ่มเหรียญเปิดได้พร้อม datalist · ข้อ 19 — แผงม่วงแสดงผล วงแหวนมี `stroke-dasharray` จริง sparkline วาดจริง การ์ดสถิติครบ · ข้อ 20 — ไฟล์มั่วถูกปฏิเสธ, หน้ายืนยันขึ้น 5 แถวครบ, กดยกเลิกแล้วข้อมูลเดิมอยู่ครบ · ข้อ 21 — ขีดหมุด 6 ขีดบนการ์ด, การ์ดหมุด 4 รายการ, toast เด้งข้ามหน้าได้, ลง activity, **ไม่ persist วนซ้ำ** และ **`progressLog` ไม่ถูกเขียนทับหาย** (ยืนยันว่ารวม effect เดียวถูกต้อง)
   - **บั๊กที่เจอจากการทดสอบและแก้แล้ว:** จอมือถือ 390px มี scroll แนวนอน 3px — ต้นเหตุคือ `.topbar-right` (ช่องค้นหา + ปุ่ม Quick Capture) กว้าง 377px ไม่ยอมหด เกิน viewport ไป 3px · แก้ใน `styles.css` media `max-width:900px`: `.topbar-right{width:100%;min-width:0}` + `.search-wrap{flex:1;min-width:0}` + `.search-wrap input{width:100%;min-width:0}` → หลังแก้ `scrollWidth` = 390 พอดีทุกแท็บ · **เป็นบั๊กเดิมที่มีอยู่ก่อน ไม่เกี่ยวกับงานรอบ 18-21**
   - หมายเหตุเรื่องเขียนเทสต์: อย่าใช้ `button:has-text("บันทึก")` จับปุ่มเซฟในโมดัล ใช้ `.modal-btn-save` ตรงๆ · วงแหวนโมเมนตัมต้องจับ `.mom-ring-fg` (circle ตัวแรกคือ `.mom-ring-bg` ไม่มี dasharray) · `.page-nav-btn` ล้นกรอบเป็นเรื่องปกติ อยู่ในกล่อง scroll แนวนอนของตัวเอง ไม่ทำให้ทั้งหน้าเลื่อน
