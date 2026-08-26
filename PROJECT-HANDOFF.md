# Personal Secretary Dashboard — เอกสารส่งต่อโปรเจกต์

> **วิธีใช้ไฟล์นี้:** เปิด session ใหม่ แล้วพิมพ์ว่า
> *"อ่าน PROJECT-HANDOFF.md ในโฟลเดอร์ก่อน แล้วทำ [สิ่งที่ต้องการ]"*
> อย่าแปะเนื้อหาไฟล์นี้ลงในแชท — ให้ AI อ่านเองจากดิสก์ ประหยัด token กว่ามาก

อัปเดตล่าสุด: 2026-08-26 (ข้อ 27 = ข้อ 24/1 เสร็จแล้ว โครงเมนูทั้งแอป sidebar→แถบแคปซูลบน + สลับสีจริงเป็น Dark Emerald แล้ว (screenshot ยืนยันแล้ว) **push แล้ว** · ข้อ 28 = หลักการเพิ่มเติม การ์ดกระทัดรัด+ปุ่มย่อรายการยาว ใช้ตอนทำแต่ละหน้าจริง · ข้อ 26 = ข้อ 24/0 ปูพื้น CSS variables 94 ตัว · ข้อ 25 = วางสถาปัตยกรรมระบบเก็บไฟล์ Drive เริ่มจากปกหนังสือ รอคิวหลังข้อ 24/9 · ข้อ 24 = ล็อกลำดับรีดีไซน์ 11 ขั้น (0-10) · ข้อ 23 = ล็อกชุดสีธีมใหม่ Dark Emerald + mockup ที่ `mockups/` · ohm ยืนยันว่า**จัดหมวด "อื่นๆ" ครบแล้ว** → ปัญหาข้อ 1 ในข้อ 5 ปิดได้ · ก่อนหน้านี้ 2026-08-25: ข้อ 20 หน้ายืนยัน Import + ข้อ 21 หมุดโปรเจกต์ **push แล้ว** · ข้อ 22 = รันเทสต์จริงย้อนหลัง 4 รอบ ผ่าน 43/43 ไม่มี runtime error)

> **หมายเหตุ (2026-08-20):** ตัดสินใจแล้วว่าแอปหลักคือ `preview-dashboard.html` (React+Babel ไฟล์เดียว, ฟีเจอร์ครบ) — จะ**ไม่**เขียนใหม่แยกเป็น vanilla-JS PWA เพราะเสียของที่ทำไว้เยอะ (Finance, Payslip import, Tracker ฯลฯ) แทนที่ด้วยการ **เพิ่มชั้น PWA + Google Drive sync เข้าไปใน preview-dashboard.html เอง** ดูแผนเต็มในข้อ 9
> ไฟล์ที่ย้ายไป `_to_delete/` แล้ว (ลบทิ้งถาวรได้เมื่อสะดวก): `secretary-dashboard-preview.html` (รุ่นเก่า), `index.html`/`style.css`/`sw.js` เดิมของ secretary-app (UI คนละแนวทาง ไม่ใช้แล้ว)
> โฟลเดอร์ `secretary-app/` ถูกเปลี่ยนชื่อเป็น **`_reference-drive-sync/`** — เก็บไว้เฉพาะส่วนที่ยังมีประโยชน์: `app.js` (มีโค้ด Google Drive sync ที่ใช้ได้จริง บรรทัด 1420-1585), `config.js`, `manifest.json`, `icons/`, `SETUP.md` (วิธีตั้ง OAuth) — ใช้เป็นวัตถุดิบตอนทำข้อ 9 แล้วลบทิ้งได้

> **กำลังทำต่อ (เริ่ม 2026-08-23) — ปรับปรุงหน้า Investments รอบใหญ่:**
> พื้นฐานเสร็จแล้ว: ประเภทสินทรัพย์ 7 แบบ (เฟส 1-4 เดิม), มูลค่าปัจจุบันกรอกเอง, เป้าหมายลงทุน, **พอร์ตคริปโตรองรับ 2 สกุลเงิน THB/USD** (ข้อ 15), **บันทึกซื้อเพิ่ม/DCA รายงวด + สรุปแยกพอร์ต** (ข้อ 16) — ดูรายละเอียดที่ข้อ 4, 15, 16
> **ทำต่อจากตรงนี้:** ohm มี 2 พอร์ตจริง — `Binance Global` (ถือยาว ไม่ซื้อเพิ่ม) กับ `Binance TH` (ตั้ง DCA ซื้อทุกวัน อัปเดตเดือนละครั้งผ่านปุ่ม "ซื้อเพิ่ม") ยังไม่ได้กรอกข้อมูลจริงลงระบบ
> งานที่ยังไม่ได้ทำ (เรียงตามที่คุยไว้ท้ายข้อ 16): **XIRR/ผลตอบแทน %ต่อปี** จาก `h.buys[]`+`firstHeldDate` (มีข้อมูลพร้อมแล้ว), **หน้าประวัติ DCA ต่อเหรียญ** (เก็บ `buys[]` ไว้แล้วแต่ยังไม่มี UI แสดงรายการย้อนหลัง), **ตั้งเป้าสัดส่วนพอร์ต** เช่น crypto ไม่เกิน 10%, **กราฟมูลค่าพอร์ตตามเวลา** (งานใหญ่ ต้องเปลี่ยน `investmentValues` เป็น history array — ดูข้อ 4.4)
> **workflow git ตั้งเสร็จแล้ว** (2026-08-23) — เครื่อง ohm push ได้เองด้วย `git add -A && git commit -m "..." && git push` (พิมพ์ทีละบรรทัด อย่าต่อด้วย `&&` ถ้าไม่แน่ใจว่ามีอะไรเปลี่ยน) อย่าลืมเตือนให้ push + ทดสอบบน GitHub Pages ทุกครั้งที่แก้เสร็จ
> **AI push เองไม่ได้ (พบ 2026-08-26):** shell ที่ AI ใช้บนเครื่อง ohm ไม่มี GitHub credentials — `git add`/`git commit` ทำได้ แต่ `git push` fail ว่า `could not read Username for 'https://github.com'` ให้ commit ไว้แล้วบอก ohm พิมพ์ `git push` เองในเทอร์มินัล · shell นี้ลบไฟล์ไม่ได้ตามค่าตั้งต้น ทำให้ git ทิ้ง `.git/HEAD.lock`, `.git/index.lock`, `.git/objects/*/tmp_obj_*` ค้างไว้ (ต้องลบก่อนไม่งั้น git ในเครื่องขึ้น "Another git process seems to be running") — ขอสิทธิ์ลบผ่าน `device_request_delete_permission` ครั้งเดียวต่อ session แล้ว `rm -f` ได้เลย

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

23. **ธีมใหม่ "Dark Emerald + Soft Gold" — ล็อกชุดสีแล้ว (2026-08-26)** ohm ส่งรูปอ้างอิงสไตล์ bento dashboard (Crextio/Nixtio โทนครีม-เหลือง) แล้วขอแบบเดียวกันแต่เป็นธีมมืด · **ยังไม่ได้แตะ `preview-dashboard.html`/`styles.css` เลย** — ทำเป็น mockup แยกที่ `mockups/mockup-dark-emerald.html` (ไฟล์เดียวจบ เปิดดูได้ ไม่กระทบแอปจริง)

   **ชุดสีที่ ohm อนุมัติแล้ว (ห้ามถามซ้ำ ห้ามเปลี่ยนเอง):**
   ```
   --bg #0c1613 · --surface #172620 · --surface-2 #1e2f28 · --surface-3 #274038 · --line #304a3f
   --line-soft rgba(255,255,255,.075)
   --ink #e9f3ee · --ink-2 #a9c1b6 · --ink-3 #83a396
   --accent #10b981 · --accent-soft #34d399 · --accent-dim rgba(16,185,129,.16)
   --gold #d9b26a · --gold-soft #eccf94        (สีรอง ใช้ประหยัดมาก)
   --up #34d399 · --down #f2777a · --warn #e0b872
   --r-card 24px · --r-inner 16px · --r-pill 999px · --gap 16px
   ```
   - **พื้นหลังไล่สี (ค่าที่ ohm เลือกหลังลองจางลงแล้วขอกลับมาแบบเดิม):** ทั้งหน้าเป็น "แผ่น" มุมโค้ง 34px ลอยบนพื้นดำ ซ้อน 4 ชั้น — ทอง `.30` ที่ `104% 52%` (ขอบขวากลางจอ), ทอง `.22` ที่ `88% -4%`, เขียว `.24` ที่ `-6% 2%`, แล้ว `linear-gradient(150deg,#16261f,#111d18 48%,#0d1714)` · การ์ดโปร่งแสง `rgba(23,38,32,.84)` + `backdrop-filter:blur(6px)` ให้แสงซึมผ่าน
   - **ตอนพอร์ตเข้าแอปจริงอย่าใช้ `background-attachment:fixed`** (Safari มือถือกระตุกเมื่อคู่กับ backdrop-filter) — ใช้ div ไล่สี `position:fixed` ชั้นล่างสุดแทน ได้ผลตาเดียวกัน
   - **กฎการใช้ทอง:** เขียวคือสีเน้นหลัก ทองแตะได้เฉพาะจุดที่เป็น "ข้อมูล" จริงๆ (มูลค่าสุทธิ, แท่งวันที่ขยับมากสุด, แถบงบ, หมุดความคืบหน้า) ถ้าทองเยอะกว่านี้จะแย่งความสนใจกับเขียว
   - รายจ่าย/ขาดทุนใช้ `#f2777a` (แดงนวล) ไม่ใช่แดงสด เพราะบนพื้นเขียวเข้มแดงสดแสบตา

   **โครงหน้าใหม่ที่ ohm เลือก:** เปลี่ยนจาก sidebar ซ้าย + แผงม่วงขวา → **แถบเมนูแคปซูลด้านบน** (โลโก้ซ้าย / เมนูกลาง / ค้นหา+บันทึกเร็ว+โปรไฟล์ขวา) แล้วเนื้อหาเป็น **bento grid 4 คอลัมน์** การ์ดหลายขนาด มีการ์ดเด่น 1 ใบสูง 2 แถว (งานวันนี้) · หน้าที่เป็นรายการยาว (Expenses/Income) **ไม่ต้องทำ bento** เอาแค่ภาษาเดียวกัน (สี ฟอนต์ ความโค้ง ระยะ) แต่คงความหนาแน่นไว้ ไม่งั้นข้อมูล 745 แถวจะยืดจนใช้งานไม่ได้

   **ลำดับงานที่ตกลงกันไว้:** (1) แปลง `styles.css` ให้ใช้ CSS variables ก่อน — ปัจจุบัน**ไม่มี custom property เลยสักตัว** มี hex เขียนตรงๆ 514 จุด (ซ้ำสุด: `#8b5cf6` 50 ครั้ง, `#3a3155` 46, `#a29bc4` 48) และมี inline `style={{}}` ใน JSX **432 จุด** ที่ CSS ภายนอกชนะไม่ได้ ต้องไล่ย้ายออกเฉพาะหน้าที่จะรีดีไซน์ (2) ทำระบบเก็บไฟล์/รูปบน Drive (3) ค่อยไล่ใส่รูปตามจุดต่างๆ
   - **ยังไม่ได้ตัดสินใจ:** จะรีดีไซน์ทีละหน้าหรือทั้งแอปรวดเดียว, จะเก็บ `.hero-panel` ม่วงไว้ในรูปแบบไหน (โครงใหม่ไม่มีแผงข้างแล้ว), การ์ดรูปโปรไฟล์แบบในรูปอ้างอิงรอระบบเก็บรูปก่อน

24. **ลำดับการรีดีไซน์หน้าตา — วางแผนแล้ว ยังไม่เริ่มทำจริง (2026-08-26)** คุยกับ ohm เรื่องคิวงาน ตามธีม Dark Emerald ในข้อ 23 · ohm เลือกทุกข้อแนะนำ ลำดับนี้ **ยึดตามนี้ ห้ามสลับเองโดยไม่ถาม** (ทำทีละข้อ แยก session ตามกฎข้อ 6):

   | # | หน้า/งาน | เหตุผลที่อยู่ตรงนี้ |
   |---|---|---|
   | 0 | **CSS variables migration** (ทำก่อนทุกอย่าง) | ปูพื้น 514 hex ตรงๆ ใน styles.css → ตัวแปรที่ `:root` ตาม token ข้อ 23 — ต้อง **screenshot diff ก่อน/หลังให้เหมือนเดิม 100%** (แค่รีแฟกเตอร์ ไม่ใช่รีดีไซน์) ไม่งั้นงานข้อถัดไปทุกข้อจะพังตาม |
   | 1 | **โครงเมนูทั้งแอป** (sidebar+hero panel → แถบแคปซูลบน) | ohm เลือกให้ทำก่อนเพราะเป็นเปลือกนอกกระทบทุกหน้าพร้อมกัน — ทุกหน้าเปลี่ยนธีมเห็นผลทันทีแม้เนื้อหาข้างในยังไม่ได้ทำ bento เป็นงานแยกจากข้อ 0 (แตะ JSX โครง ไม่ใช่แค่ CSS) |
   | 2 | ~~**Dashboard (หน้าแรก)**~~ ✅ เสร็จแล้ว 2026-08-26 (ดูข้อ 29) | ทำ mockup ไว้แล้วที่ `mockups/mockup-dark-emerald.html` (อนุมัติแล้วทั้งสี+โครง+อังกฤษ/ไทย) เหลือแค่ต่อ JSX จริง + ผูกข้อมูลจริงแทนเลขสมมติ |
   | 3 | **Investments** | เสี่ยงต่ำสุดในบรรดาหน้า Finance เพราะรื้อเป็นการ์ดไปแล้วตั้งแต่ข้อ 18 (23 ส.ค.) งานรอบนี้คือ reskin สี/ระยะ ไม่ใช่เปลี่ยนโครง |
   | 4 | **Finance Overview** | มีกราฟวงกลม Income/Expenses อยู่แล้ว เข้ากับ bento ธรรมชาติ |
   | 5 | **Debts** | การ์ดสรุป + ตารางหนี้ ขนาดข้อมูลไม่เยอะ ทำได้เร็ว |
   | 6 | **Tracker** (Projects/Tasks/ProjectDetail/milestones/ProjectCard) | โมเมนตัมการ์ดใน Dashboard (ข้อ 2) ใช้ helper ชุดเดียวกับหน้านี้อยู่แล้ว ทำต่อเนื่องง่ายกว่า |
   | 7 | **Finance Review** | มี BudgetPanel + anomaly detection ต้องเช็ค logic ควบคู่ไปกับ UI |
   | 8 | **Income + Expenses** | **ohm เลือกทำท้ายๆ เอง** — เหตุผล: 745+ รายการ มีตัวกรอง เลือกหลายแถว โมดัลแก้ไข เสี่ยงพังง่ายสุด แม้จะเป็นหน้าที่เปิดบ่อยที่สุดก็ตาม **สโคปงานนี้คือ reskin เท่านั้น (สี/ฟอนต์/ความโค้ง/ระยะ) ห้ามรื้อเป็น bento** — ต้องคงตาราง/รายการความหนาแน่นสูงไว้ ไม่งั้นข้อมูลยาวจะเลื่อนจอไม่จบ |
   | 9 | **หน้าเล็กที่ใช้ไม่บ่อย รวบทำทีเดียว** — Health, Documents, Book Queue, Journal (+ Quick Capture, History ถ้าจำเป็น) | **ohm เลือกรวบท้ายสุด** — โฟกัสหน้าที่ใช้จริงก่อน |
   | 10 | **มือถือ (<900px) รอบสุดท้าย** | เช็คซ้ำทั้งแอปหลังหน้าอื่นเสร็จหมด — ธีมใหม่อาจกระทบ breakpoint เดิมที่เพิ่งแก้ไป (topbar overflow ข้อ 22) |

   หมายเหตุ: แต่ละข้อ = 1 session ตามกฎ "1 session = 1 ฟีเจอร์" (ข้อ 6 ของไฟล์นี้) · ทุกข้อต้องรัน smoke test / ตรวจ Babel ก่อน push เหมือนเดิม · ถ้า ohm อยากสลับคิวระหว่างทาง ให้แก้ตารางนี้ด้วยไม่ใช่แค่ทำสลับเฉยๆ (กันงงว่าทำไปถึงไหนแล้ว)

25. **ระบบเก็บไฟล์/รูปบน Google Drive — วางสถาปัตยกรรมแล้ว ยังไม่เริ่มทำ (2026-08-26)** คุยกับ ohm ต่อจากข้อ 2 เดิม (โยนไฟล์ให้เลขาเก็บ) — สรุปแนวทางที่ตกลงกันไว้:

   **สถาปัตยกรรม:**
   - ใช้โครง multipart upload ที่มีอยู่แล้วใน Drive sync (`ensureFile()` บรรทัด ~301-320) ขยายให้อัปโหลดไฟล์ทั่วไปได้ ไม่ใช่แค่ `data.json` — อัปขึ้นโฟลเดอร์ `SecretaryOhmApp` เดิม (หรือโฟลเดอร์ย่อยใหม่ เช่น `SecretaryOhmApp/files/`)
   - ตอนอัปโหลดขอ `fields=id,webViewLink,thumbnailLink,mimeType,size,name` — **ใช้ `webViewLink` เปิดไฟล์ตรงๆ ด้วย `window.open()` ไม่ต้องเขียนระบบดึงไฟล์กลับมาแสดงในแอปเอง** (เป็น Drive ส่วนตัว ohm เอง เบราว์เซอร์ล็อกอินอยู่แล้วเปิดได้ทันที) ประหยัดงานไปเยอะ
   - เพิ่ม **`files` array ที่ root** (ไม่ใช่ใน finance): `{id, driveFileId, webViewLink, name, mimeType, sizeBytes, thumbnail, linkedTo:{type, refId}, createdAt}` — `thumbnail` คือ base64 รูปย่อขนาดเล็กสร้างจาก canvas ตอนอัป (ไม่กี่ KB) เก็บ inline ใน data.json เพื่อให้กริดโหลดเร็ว ตัวไฟล์เต็มอยู่บน Drive เท่านั้น
   - บันทึกที่มีอยู่แล้ว (expense/income/journal/document/project/**bookQueue**) เพิ่มช่อง `attachments: [fileId,...]` แทนที่จะทำหน้าคลังไฟล์แยกลอยๆ

   **จุดเริ่มที่ ohm เลือก: รูปปกหนังสือ (หน้า Book Queue)** — ไม่ใช่ 3 ตัวเลือกที่เสนอไป (สลิป/Documents/Journal) ohm อยากเห็นปกหนังสือจริงในรายการก่อน

   **งานเงื่อนไขที่ต้องทำคู่กัน:** token เชื่อมต่อ Drive (จาก `initGoogleIdentity`/`tokenClient`) หมดอายุทุก ~1 ชม. ตอนนี้ต้องกด "เชื่อมต่อ Drive" ใหม่ทุกครั้งที่หมดอายุ (`prompt:"consent"` เด้ง popup เสมอ) ถ้าจะแนบไฟล์บ่อยๆ ระหว่างวันต้องทำ**ระบบขอ token ใหม่แบบเงียบๆ** (ลอง `prompt:""` ก่อน silent refresh, fallback เป็น popup ถ้าต้องขอสิทธิ์ใหม่จริง) — **ohm ให้รวมงานนี้เข้ากับงานแนบไฟล์ในคราวเดียว** ไม่แยก session ต่างหาก

   **คิวงาน: รอให้ข้อ 24 ลำดับที่ 9 (หน้าเล็กที่ใช้ไม่บ่อย รวบทำทีเดียว — Health/Documents/Book Queue/Journal) เสร็จก่อน** — ohm เลือกเอง เพราะจะได้แตะ BookQueuePage ครั้งเดียวจบทั้งรีดีไซน์และแนบรูป ไม่ต้องกลับมาแก้ไฟล์เดิมซ้ำสองรอบ **อย่าเริ่มงานนี้ก่อนข้อ 24/9 เสร็จ โดยไม่ถาม ohm ก่อน**

26. **ข้อ 24/0 เสร็จแล้ว: ปูพื้น CSS variables ใน styles.css (2026-08-26)** — แปลง hex ตรงๆ ทั้งหมดเป็นตัวแปร ตามที่วางแผนไว้ในข้อ 24 แถวที่ 0

   - **514 จุดที่เคยเป็น hex ตรงๆ → `var(--ชื่อ)` ทั้งหมด** อ้างอิงตัวแปร **94 ตัว** ที่ประกาศรวมกันใน `:root{}` บล็อกใหม่ (แทรกไว้หลัง `@import` ฟอนต์ทันที — `@import` ยังคงเป็นบรรทัดที่ทำงานจริงบรรทัดแรกเหมือนเดิม ไม่ได้ย้าย) จัดกลุ่มด้วยคอมเมนต์: พื้นหลัง/พื้นผิว, เส้น/ขอบ, ตัวอักษร, สีเน้น/สถานะ, โปร่งแสงขาว, การ์ดโน้ต 5 ธีม, สลิป/overdue/anomaly, การ์ดโมเมนตัม, แผงฮีโร่, อื่นๆ
   - **ค่าทุกตัวแปรยังเป็นค่าเดิม (ธีมม่วง) 100% ไม่ได้เปลี่ยนเป็น Dark Emerald** — ขั้นนี้คือรีแฟกเตอร์ชื่อเท่านั้น ตามข้อตกลงในแผนข้อ 24 (ห้ามแก้ค่าจนกว่าจะถึงงานข้อ 1 โครงเมนู)
   - **สโคปคือ hex เท่านั้น** ไม่แตะ `rgba()`/`hsla()` (มี 72 จุดในไฟล์ ยังเป็น literal เหมือนเดิม) — ตามที่ระบุไว้ในแผนข้อ 24 ชัดเจนว่า "514 hex ตรงๆ" ไม่รวม rgba · ไม่ได้แตะ `preview-dashboard.html` เลย (inline `style={{}}` 432 จุดในนั้นยังเป็นงานคนละสโคป รอคิวตามแผน)
   - **วิธีตรวจว่าไม่มีอะไรเปลี่ยนภาพ (แม่นกว่า screenshot):** เขียนสคริปต์ resolve `var(--ชื่อ)` ทุกตัวกลับเป็น hex เดิมจาก `:root` แล้วเทียบกับไฟล์ก่อนแก้ (`git show HEAD:styles.css`) แบบ **ตัวอักษรต่อตัวอักษร — ตรงกัน 100%** (ต่างแค่ 1 บรรทัดว่างที่แทรกเพิ่ม ไม่กระทบ CSS) นี่คือหลักฐานที่แน่นกว่าการเทียบภาพเพราะครอบคลุมทุกบรรทัดจริง ไม่ใช่แค่สิ่งที่ขึ้นจอตอนแคป
   - พยายามเปิดแอปจริงเทียบ before/after ด้วย Chromium ในคอนเทนเนอร์เพิ่มด้วย — **CDN `unpkg.com` (React/Babel/Recharts) ถูกบล็อกโดย network allowlist ของคอนเทนเนอร์รอบนี้** ทำให้ React ไม่ขึ้นจริง (ค้างที่ shell เปล่าๆ ทั้ง before/after เหมือนกัน) แต่ pixel diff ของสิ่งที่ขึ้นจอ (CSS ล้วนก่อน JS ทำงาน) = **0 พิกเซลต่าง** ยืนยันสอดคล้องกับผลจาก text-diff ด้านบน — **ohm ควรเปิดแอปจริงในเบราว์เซอร์เองอีกทีก่อน push เพื่อความชัวร์เต็มร้อย** (เหมือนทุกงานก่อนหน้า) เพราะ container รอบนี้ตรวจได้แค่ระดับ CSS-source ไม่ได้เห็น React render จริง
   - **ยังไม่ push** (commit ไว้ที่ `styles.css` แล้ว) — มี commit ค้าง push อยู่ก่อนหน้านี้ด้วย (ข้อ 24, 25) รวมเป็น 3 commit ที่ต้อง push
   - **ขั้นต่อไปตามคิวข้อ 24 คือลำดับที่ 1: โครงเมนูทั้งแอป** (sidebar+hero panel → แถบแคปซูลบน) ตอนนั้นค่อยเปลี่ยนค่าตัวแปรใน `:root` จากม่วงเป็น Dark Emerald ตามข้อ 23 จริง

27. **ข้อ 24/1 เสร็จแล้ว: โครงเมนูทั้งแอป + สลับสีจริงเป็น Dark Emerald (2026-08-26)** — ohm สั่ง "ลอง 2" คือทำทั้งโครงเมนู และ ปรับสีให้กลมกลืนกับ hero-panel ไปพร้อมกันเลย (ไม่แยก session สีต่างหาก)

   **A) โครงเมนู (JSX, `preview-dashboard.html`):**
   - ลบ `Sidebar`/`SIDEBAR_ITEMS` (แถบไอคอนซ้าย 96px) และ `.topbar` เดิม (แถบชื่อหน้า+ค้นหา+Quick Capture) ทั้งคู่ → รวมเป็นคอมโพเนนต์ใหม่ `TopNav` ตัวเดียว: แคปซูลบนมี `.brand` (โลโก้), `.nav-pill` (ปุ่มลิงก์ 7 หน้าใช้ `PAGE_TITLES` เดิม), และฝั่งขวา search bar (ฟังก์ชันเดิมทั้งหมด ไม่ตัดอะไรออก) + ปุ่ม Quick Capture แบบไอคอน (ใหม่ เข้าถึงได้ทุกหน้า ไม่ใช่แค่ Dashboard) + avatar
   - **hero-panel ไม่ได้ย้าย/แก้โครงสร้าง** ยังอยู่เฉพาะหน้า Dashboard (page===0) เหมือนเดิมทุกจุด (ตรวจแล้วว่า hero-panel ไม่ใช่ chrome ที่อยู่ทุกหน้าอย่างที่เข้าใจตอนแรก) — จะจัดใหม่จริงตอนข้อ 24/2 (bento dashboard)
   - `PageNav` (แถบล่างมือถือ) **ไม่แตะเลย** ยังทำงานเหมือนเดิม แค่สีเปลี่ยนตาม `:root` อัตโนมัติ
   - มือถือ (<900px): `.nav-pill` (ปุ่มลิงก์หน้า) ซ่อน ให้ `PageNav` ด้านล่างทำหน้าที่แทน — เหมือนพฤติกรรม sidebar เดิม

   **B) สลับสีจริงเป็น Dark Emerald (`styles.css`):**
   - **--accent/--accent-soft เปลี่ยนตรงตามข้อ 23** (`#8b5cf6`→`#10b981`, `#a78bfa`→`#34d399`) + เพิ่ม 4 ตัวแปรใหม่ `--accent-dim/--gold/--gold-soft/--gold-dim`
   - **หมุน hue ตัวแปรกลุ่ม "ม่วงเป็นกลาง" 45 ตัว** (พื้นหลัง/พื้นผิว, เส้น/ขอบ, ตัวอักษร, การ์ดโมเมนตัม, แผงฮีโร่ส่วนที่เป็นม่วง, สลิป/misc 2-3 จุด) ด้วย delta เดียวกันที่คำนวณจาก accent เก่า→ใหม่ (-98.2°) คง S/L เดิมทุกตัว เพื่อให้กลมกลืนเป็นชุดเดียวกัน ไม่ใช่เลือกทีละสี
   - **ตั้งใจไม่แตะ 47 ตัวที่เหลือ**: สีสถานะ/ฟังก์ชัน (เขียว/ส้ม/แดง/น้ำเงิน/เหลือง/ชมพู — ยังใช้ได้ปกติกับธีมเขียวใหม่), การ์ดโน้ต 5 ธีม (จงใจเก็บไว้ต่างสีกันเพราะเป็นสีจัดหมวดของผู้ใช้ ไม่ใช่สีแบรนด์), ขาว/โปร่งแสงขาว
   - **แก้ `rgba(139,92,246,...)`/`rgba(167,139,250,...)` ที่ hardcode ไว้ 29 จุดทั่วทั้งไฟล์** (การ์ด, ปุ่ม, hero-panel, momentum, pie legend, search-result hover ฯลฯ) ให้เป็นค่า accent ใหม่ในเฉดเดียวกัน — จุดพวกนี้เป็น literal ที่ข้อ 24/0 ตั้งใจไม่แตะ (สโคปแค่ hex ตรงๆ) แต่รอบนี้ต้องแก้ด้วยเพราะมันคือค่า accent เดิมที่ยังไม่ได้เปลี่ยนตาม ถ้าไม่แก้จะเห็นแสงเรืองม่วงหลงเหลืออยู่ทั่วแอปทันทีที่ accent เปลี่ยนเป็นเขียว
   - **ไม่แตะสีเฉพาะหน้า Finance/Tracker ที่ยังไม่ถึงคิวรีดีไซน์** (เช่น pie legend "หนี้" ที่ยังเป็นสีม่วง/น้ำเงินเดิม) — ตั้งใจเก็บไว้ตามลำดับข้อ 24 (ข้อ 4/5/6 ค่อยจัดการ)

   **การตรวจสอบ:**
   - Babel parse ผ่าน (`@babel/core` + `@babel/preset-react` ในคอนเทนเนอร์), CSS parse ผ่าน (`css` npm package, 618 rules, brace สมดุล) — ไม่มี orphan reference เหลือของ `Sidebar`/`SIDEBAR_ITEMS`/`.sidebar-*`/`.topbar-title`
   - **รอบนี้ CDN ไม่ถูกบล็อก** (ต่างจากข้อ 26) → ติดตั้ง React 18.2.0/ReactDOM/prop-types/Recharts 2.15.0/Babel-standalone 7.24.7 แบบ local ในคอนเทนเนอร์ (เลียนแบบวิธีของ `smoke-test.js`) แล้วเปิดแอปจริงด้วย Playwright **เห็นภาพจริงเป็นครั้งแรก** — capsule nav ขึ้นครบ, สลับหน้าได้จริง (คลิก "Finance" แล้วสลับ active + เนื้อหาถูกต้อง), มือถือ (390px) ซ่อน nav-pill ถูกต้องและ PageNav ล่างทำงาน, hero-panel ซ่อนตามเดิมที่ <1200px, โทนสีทั้งหน้าเป็นเขียวเข้ม-ทองสอดคล้องกันหมด ไม่มีจุดม่วงหลงเหลือ (screenshot ส่งให้ ohm ดูแล้วในแชท)
   - **สิ่งที่ยังไม่ได้ทดสอบ**: การเชื่อมต่อ Google Drive จริง (ไม่มี token), การคลิกปุ่ม Quick Capture/ค้นหาแบบเต็มรูปแบบ (เทสแค่ว่า render ถูกต้อง ไม่ได้คลิกทุกปุ่ม), ข้อมูลจริงของ ohm (เทสด้วย localStorage ว่างเปล่า ไม่ใช่ seed data) — **ohm ควรเปิดแอปจริงเชื่อม Drive แล้วลองคลิกเมนู/ค้นหา/Quick Capture ให้ครบก่อน push**
   - **ยังไม่ push** — รวมกับ commit ค้างจากข้อ 24/25/26 ก่อนหน้า
   - **ขั้นต่อไปตามคิวข้อ 24 คือลำดับที่ 2: bento dashboard เต็มรูปแบบ** (ใช้ mockup ที่อนุมัติแล้วที่ `mockups/mockup-dark-emerald.html` เป็นต้นแบบ ย้ายเนื้อหา hero-panel เดิม — ทักทาย/MomentumCard/สถิติ/Quick Capture CTA/นัดถัดไป — เข้าไปอยู่ใน bento layout ใหม่)

28. **หลักการทั่วไปเพิ่มเติมสำหรับทุกหน้าที่จะรีดีไซน์ — ohm ระบุเพิ่ม (2026-08-26)** ต่อจากข้อ 23:
   - **กระทัดรัด ประหยัดพื้นที่ ไม่ต้องสกรอลล์เยอะตอนเปิดในคอม** — แต่ละส่วนของหน้าอยู่ในการ์ดที่กระชับ ดูง่ายในพื้นที่จอเดียว (ตอกย้ำกฎเดิมในข้อ 23 ที่บอกว่าเพจรายการยาวห้ามยืดจนใช้งานไม่ได้ — ข้อนี้ขยายให้ครอบคลุมทุกหน้า ไม่ใช่แค่ Expenses/Income)
   - **ข้อมูลที่เป็นรายการ/แถวยาวๆ ให้มีปุ่มย่อ/ขยายได้** (collapse/expand) แทนที่จะแสดงทุกแถวค้างตลอด — ใช้กับตาราง/ลิสต์ยาวในทุกหน้า (เช่น Expenses table, รายการ Tracker, ประวัติต่างๆ)
   - **นำไปใช้ตอนรีดีไซน์แต่ละหน้าจริง (ข้อ 24/2 เป็นต้นไป)** ยังไม่ได้แก้ mockup ปัจจุบันหรือโค้ดจริงเพื่อรองรับข้อนี้

29. **ข้อ 24/2 เสร็จแล้ว: Dashboard เป็น bento grid ผูกข้อมูลจริง (2026-08-26)** — ต่อจากข้อ 27 ตามคิวข้อ 24 แถวที่ 2 · ohm เลือก: เก็บ Notes/History ไว้เป็นการ์ดท้ายกริด · ทำ "สัปดาห์นี้" ผูก `events` จริงแทนการ์ด Schedule เดิม · ทำการ์ดสัดส่วนพอร์ตเลยโดยโชว์เท่าที่มีข้อมูล · **ยกค่าสีพื้นจาก mockup มาทั้งแอป** (ข้อ 24/1 ใช้วิธีหมุน hue จากธีมม่วง ทำให้พื้นหลังเป็น `#0d3a2a` เขียวอมสว่าง ไม่ตรง token `#0c1613` ในข้อ 23)

   **A) `styles.css` — ค่าสีและ CSS ใหม่:**
   - **แก้ค่า `:root` 25 ตัว** เฉพาะกลุ่มพื้นหลัง/พื้นผิว/เส้น/การ์ดโมเมนตัม/แผงฮีโร่ ให้ตรง token ข้อ 23 (`--bg-1 #0c1613`, `--surface-1 #172620`, `--surface-2 #1e2f28`, `--line #304a3f` ฯลฯ) — **ไม่แตะกลุ่มตัวอักษร (`--ink*`) และสีสถานะ** เพราะชื่อตัวแปรในแอปกับใน mockup ทำหน้าที่ไม่ตรงกัน (เช่น `--ink-3` ในแอปคือสีสว่าง แต่ใน mockup คือสีจาง) เปลี่ยนแล้วอ่านไม่ออกหลายหน้า
   - **พื้นหลังไล่สี 4 ชั้นตามข้อ 23** ทำเป็น `.app-bg` (`position:fixed;inset:0;z-index:0`) แล้วดัน `.app>*` ขึ้น `z-index:1` — ตามที่ข้อ 23 กำหนดว่าห้ามใช้ `background-attachment:fixed`
   - **เพิ่มบล็อก CSS bento ท้ายไฟล์ (~120 rule)** — **ทุกคลาสใช้ prefix `db-`** เพราะชื่อใน mockup ชนกับคลาสเดิมในไฟล์นี้หมด (`.card`, `.card-head`, `.ms-track`, `.ms-list`, `.ms-item`, `.hero-sub`, `.icon-btn`, `.brand`) · กริด `.db-bento` 4 คอลัมน์ → 2 (≤1200px) → 1 (≤760px)
   - `.db-card .mom-head{display:none}` ตัดหัวการ์ดโมเมนตัมที่ซ้ำกับหัว `.db-card` (สตรีค "X วันติดกัน" ย้ายไปเป็นตัวเลขใหญ่บนแถบฮีโร่แล้ว) · `.db-card .card`/`.card-head` ปรับให้ `HistoryPanel` ฝังในการ์ด bento ได้โดยเหลือแค่ปุ่มกรอง

   **B) `preview-dashboard.html` — JSX:**
   - **ลบ `.hero-panel` ทั้งบล็อกออก** (แผงข้างขวาเฉพาะหน้า Dashboard) เนื้อหาย้ายเข้ากริดหมด: ทักทาย+วันที่+ข้อความผู้ช่วย → แถบฮีโร่, การ์ดสถิติ 3 ช่อง → มิเตอร์ + ตัวเลขใหญ่, Quick Capture → ปุ่มในการ์ด "งานวันนี้", งานถัดไปวันนี้ → การ์ด "สัปดาห์นี้" · CSS ของ `.hero-*` เดิมยังอยู่ในไฟล์แต่ไม่มีใครอ้างแล้ว (ปล่อยไว้ ไม่ได้ลบ)
   - **คอมโพเนนต์ใหม่ 9 ตัว** วางไว้ก่อน `SecretaryDashboard`: `DashCollapse` (การ์ดพับได้ ตามกฎข้อ 28), `DashHero`, `DashTasksCard` (การ์ดเด่น grid-column 4 / row span 2), `DashMovementCard`, `DashMonthCard`, `DashDonut`, `DashPortfolioCard`, `DashQuickView`, `DashGoalCard`, `DashWeekCard` + helper `dbNum/dbShort/dbThaiMonth/dbNetWorth/dbBudgetPct`
   - **ผูกข้อมูลจริงทั้งหมด ไม่มีเลขสมมติเหลือ:** โมเมนตัม=`MomentumCard` เดิม (ยกมาทั้งดุ้น) · ความเคลื่อนไหว=ผลต่าง `progressOn()` รายวัน 7 วัน แท่งสูงสุดเป็นทอง แท่งวันนี้เป็นเขียว · เดือนนี้=`buildMonthReview(data,currentMonthKey())` (คำนวณครั้งเดียวที่ `SecretaryDashboard` ด้วย `useMemo` แล้วส่งเป็น prop ทั้งแถบฮีโร่และการ์ด) · สัดส่วนพอร์ต=`INVEST_TYPES` + `cryptoPortfolioValue()` · ดูเร็ว=หนี้/หมุดถัดไป/หนังสือ/เอกสาร กดแล้วเด้งไปหน้านั้น · เป้าหมายถัดไป=โปรเจกต์ที่ใกล้ถึงหมุดที่สุด + ขีดหมุดบนแถบ · สัปดาห์นี้=`data.events` จัดเป็นตาราง 7 วัน × ช่องเวลาที่มีจริง (ปุ่ม ‹ › เลื่อนสัปดาห์, กด event เปิดโมดัลแก้ไข)
   - **มูลค่าสุทธิ** = `totalCash + portfolioValue − totalDebtBalance` เป็นทอง ถ้าติดลบเปลี่ยนเป็นแดงนวล `#f2777a` อัตโนมัติ
   - **สีโดนัทพอร์ตใช้ชุดใหม่เฉพาะหน้านี้ (`DB_ALLOC_COLORS`)** เขียว-ทอง ไม่ได้แตะ `INVEST_TYPE_COLORS` เดิม (ยังม่วง/ชมพู) เพราะหน้า Investments อยู่คิวข้อ 24/3
   - แก้ `MomentumCard` สีวงแหวนสถานะ "warm" จาก `#8b5cf6` (ม่วงตกค้าง) → `#d9b26a` และ "cold" → `#4a6d5f`

   **C) บั๊กตกค้างจากข้อ 24/1 ที่เจอและแก้ไปด้วย (ไม่ได้อยู่ในสโคป 24/2 แต่ทำให้หน้าพัง):**
   - **`#driveBar` (แถบ Drive/Export/Import ที่เป็น HTML ธรรมดานอก React)** ยังตรึงไว้ที่ตำแหน่ง sidebar เก่า (`left:0;width:96px`) และยังเป็นสีม่วง `#221b38/#3a3155/#c9b8f0` → ลอยทับเนื้อหาด้านซ้าย · แก้เป็นแคปซูลแนวนอนมุมล่างซ้าย (`left:16px;bottom:16px`) โทนเขียว-ทอง · และเติม `!important` ให้ `@media(max-width:900px){#driveBar{display:none}}` เพราะ inline `display:flex` ชนะ rule ใน stylesheet มาตลอด (มือถือเคยเห็นแถบนี้ทับจอทั้งที่ตั้งใจซ่อน)
   - **`.page-nav` ล้นแนวนอนบนมือถือ** — ปุ่ม 7 อัน `font-size:20px` ไม่มี `min-width:0` ทำให้ `scrollWidth 519 > 390` **ทุกหน้า** (smoke test จับได้เฉพาะแท็บ Finance เลยดูเหมือนเป็นปัญหาของ Finance) · แก้เป็น `font-size:13px` + `min-width:0` + `text-overflow:ellipsis` + ลด padding เหลือ 8px → ไม่ล้นแล้วทุกหน้า **แต่ป้ายยาวยังถูกตัด ("Das…") — งานเก็บรายละเอียดมือถือยังเป็นของข้อ 24/10 ตามคิวเดิม**

   **การตรวจสอบ:**
   - Babel parse ผ่าน · CSS parse ผ่าน (`css` npm, 750+ rules)
   - **อัปเดต `smoke-test.js`**: หมวด `[ข้อ 19] การ์ดโมเมนตัม + แผงม่วง` (5 เช็ค ที่ตายเพราะไม่มี `.hero-panel` แล้ว) → `[ข้อ 24/2] Dashboard bento` **15 เช็คใหม่** (จำนวนการ์ด/คอลัมน์, แถบฮีโร่, วงแหวน+sparkline, แท่ง 7 วัน, การ์ดเด่น, การ์ดเดือนนี้, โดนัท, ดูเร็ว, ตารางสัปดาห์, โน้ต, การ์ดประวัติกางได้, ไม่มีซาก `.hero-panel`/`.sidebar`)
   - **รันจริงด้วย Chromium (Playwright) ผ่าน 53/53 · NO RUNTIME ERRORS** ทั้งข้อมูล seed ของเทสต์และไฟล์สำรองจริง `secretary-backup-2026-08-23.json` · เช็คมือถือ 390px ไม่ล้นแนวนอนทั้ง 3 แท็บที่เคย FAIL
   - **สิ่งที่ยังไม่ได้ทดสอบ**: Google Drive จริง (ไม่มี token), การกดปุ่มในการ์ด bento ทุกปุ่ม (เทสต์เช็คว่า render + กางการ์ดประวัติได้ ไม่ได้คลิกครบทุกจุด), หน้าจอ tablet 900–1200px ดูจากโค้ดอย่างเดียว
   - **ยังไม่ push** — รวมกับ commit ค้างจากข้อ 24/25/26/27 ก่อนหน้า
   - **ขั้นต่อไปตามคิวข้อ 24 คือลำดับที่ 3: Investments** (reskin สี/ระยะ ไม่เปลี่ยนโครง — ตอนนั้นค่อยเปลี่ยน `INVEST_TYPE_COLORS` ให้เข้าธีม)

30. **ข้อ 24/2 รอบแก้: ทำให้ตรง mockup จริงๆ (2026-08-26)** — ohm เปิด `mockup-dark-emerald_8.html` (ไฟล์เดียวกับ `mockups/mockup-dark-emerald.html` เป๊ะ md5 ตรงกัน) เทียบกับของจริงแล้วบอกว่า "ทำให้เป็นแบบนี้ที" · รอบข้อ 29 ยกแค่ *โครงและข้อมูล* มา แต่ยังไม่เหมือนตรงเปลือกนอก รอบนี้ไล่ให้ตรง

   - **"แผ่น" มุมโค้ง 34px ลอยบนพื้นดำ (`.sheet` ของ mockup)** — ก่อนหน้านี้พลาด: ข้อ 29 เขียน CSS `.app-bg` ไว้แต่**ไม่เคยใส่ `<div className="app-bg"/>` ใน JSX** พื้นหลังเลยเป็นสีเรียบ ไม่มีไล่สีเลยสักครั้ง · รอบนี้ลบ `.app-bg` ทิ้ง แล้วย้ายไล่สี 4 ชั้นไปไว้บน **`.main-wrap`** ซึ่งกลายเป็นตัว "แผ่น" (max-width 1280 · padding 26 · radius 34 · เงา) ส่วน `.app` เป็นพื้นดำ + padding 20px รอบแผ่น · กันไล่สียืดตามหน้ายาวๆ ด้วย `background-size:100% 1000px` (แทน `background-attachment:fixed` ที่ข้อ 23 ห้ามใช้) · `.topbar`/`.content-grid` ตัด padding ด้านข้างออกเพราะแผ่นมี padding แล้ว
   - **หัวข้อการ์ดเป็นอังกฤษตาม mockup**: Momentum · Daily Movement · This Month · Today's Tasks · Portfolio Allocation · Quick View · Next Goal · This Week · Notes · History (คำอธิบายใต้หัวข้อยังเป็นไทย ตามที่ตกลงไว้ในข้อ 23 ว่า "อังกฤษ/ไทย")
   - **หัวฮีโร่เป็นอังกฤษ** `Good afternoon, Ohm` 38px (`greetingFor()` เพิ่มฟิลด์ `en` ข้อความไทยเดิมยังอยู่ ไม่ได้ลบ) · บรรทัดรองเป็น `วันที่ · เวลา · ข้อความผู้ช่วย` (ช่องเดียวกับ "ซิงก์กับ Drive แล้ว 12:04 น." ใน mockup)
   - **การ์ด Momentum เขียนใหม่ตาม mockup** (`DashMomentumCard`): วงแหวน 110px r=46 stroke 9 + ตรงกลาง `39% / N โปรเจกต์` · ขวาเป็นป้าย `▲ x.x% / 7 วัน` + `เทียบเดือนก่อน` + `ขยับติดกัน` + sparkline polyline 120×34 · **ลบ `MomentumCard` + `MomentumSpark` เดิมทิ้งทั้งคู่** (การ์ด 4 ช่อง เมื่อวาน/อาทิตย์ก่อน/เดือนก่อน/ปีก่อน) ไม่มีที่อื่นเรียกแล้ว
   - **กริดตาม mockup เป๊ะ**: แถว 1 = Momentum · Daily Movement · This Month · Today's Tasks (คอลัมน์ 4 สูง 2 แถว) · แถว 2 = Portfolio · Quick View · Next Goal · แถว 3 = This Week เต็ม 4 คอลัมน์ (`.db-span4`) · แถว 4 = Notes + History (span2) · **ตัด `align-items:start` ออก** ให้การ์ดในแถวเดียวกันสูงเท่ากันแบบ mockup
   - **ช่องค้นหาเป็นปุ่มกลม ⌕ ตาม mockup** แล้วกดกางเป็นช่องกรอกแบบป๊อปอัป (`.search-pop`) — เดิมเป็นกล่อง input ยาวคาแถบเมนู · เมนูหน้าแรกเปลี่ยนชื่อ `Dashboard` → `Home` ทั้ง `PAGE_TITLES` และ `PageNav` (ตรง mockup + ป้ายมือถือสั้นลงไม่โดนตัด)
   - เพิ่มการ์ด Daily Movement ป้ายลอย (`.db-callout`) บอกวันที่ขยับมากสุด สีทอง ตาม mockup

   **การตรวจสอบ:** Babel + CSS parse ผ่าน · smoke test เพิ่มเช็ค "แผ่นมุมโค้งมีไล่สี" และแก้ selector ของการ์ดโมเมนตัม/History → **ผ่าน 54/54 · NO RUNTIME ERRORS** · มือถือ 390px ไม่ล้นแนวนอน

   **push ขึ้น GitHub Pages แล้ว 2026-08-26** (`c355fc2..9f365f8`) — ohm push เองจากเครื่อง เพราะ git ใน VM ของ Cowork ไม่มี credential ของ GitHub (fetch ได้เพราะ repo public แต่ push ไม่ได้) · **ครั้งต่อๆ ไปที่จบงานต้องบอก ohm ให้รัน `git push origin main` เอง** · หมายเหตุ: ข้อความ "ยังไม่ push" ในข้อ 26/27/29 ล้าสมัยแล้ว ณ ตอนนี้ทุก commit ขึ้นหมด working tree สะอาด

31. **ข้อ 24/2 รอบเก็บรายละเอียด: อัตราส่วนแถบบน + แถบ Drive แนวตั้ง (2026-08-26)** — ohm เทียบ mockup กับของจริงแล้วบอกว่า "อัตราส่วนด้านบนของตัวอย่างดีกว่า · แถบบนอยากให้ใกล้เคียงกว่านี้ · พื้นที่บนการ์ดเหลือเยอะเกินไป" + ขอให้ปุ่ม Drive/Export/Import กลับเป็นแนวตั้ง

   - **สาเหตุหลักที่ส่วนบนยืดกว่า mockup: `<h1 className="db-hero-title">` โดน margin ปริยายของเบราว์เซอร์** (`0.67em` = ~25px บน+ล่างที่ฟอนต์ 38px) — mockup มี `*{margin:0}` แต่ `styles.css` ของแอปรีเซ็ตแค่ `box-sizing` · ใส่ `margin:0` แล้วส่วนหัวสั้นลง ~50px ตรงกับ mockup (วัดจริง: topbar จบที่ y=124 · h1 เริ่ม y=124 · การ์ดแถวแรก y=299)
   - **ขนาดแถบเมนูเดิมใหญ่กว่า mockup** เพราะยกมาจากธีมม่วงเดิมที่ฟอนต์ทั้งแอป 17-21px · ปรับให้ตรง mockup: `.brand` 17px/700 → **14px/600** · `.nav-pill-btn` 15px/padding 8px 16px → **13px / 8px 15px** · ไอคอนในปุ่มกลม 18 → 16 · `.topbar-right` gap 12 → 8 · พื้นปุ่ม/แคปซูลใช้ `--surface-1` แทน `--sidebar-bg` · **ลบจุดเขียวมุมอวาตาร์** (ไม่มีใน mockup และเป็นแค่ CSS ไม่ได้บอกสถานะจริง)
   - **แก้ช่องว่างกองก้นการ์ด**: `.db-card` เป็น `flex-direction:column` แล้วให้เนื้อหาหลักของการ์ด Momentum (`.db-mom`) กับ Portfolio (`.db-donut-wrap`) `flex:1` — พอแถวสูงกว่าเนื้อหา ช่องว่างจะถูกแบ่งบน/ล่างแทนที่จะกองอยู่ข้างล่างก้อนเดียว
   - **การ์ด Momentum โชว์บรรทัด "เทียบเดือนก่อน" เสมอ** (ใส่ `—` เมื่อยังไม่มี `progressLog` ย้อนหลัง) — เดิมซ่อนทั้งบรรทัดทำให้คอลัมน์ขวาโล่งกว่า mockup
   - **`#driveBar` กลับเป็นแนวตั้ง** (`flex-direction:column`, padding 12px 7px, ป้ายสถานะ 9px กว้าง 52px จัดกลาง) ยังอยู่มุมล่างซ้ายและโทนเขียว-ทองเหมือนเดิม
   - หมายเหตุ: การ์ดที่ยัง "โล่ง" (Portfolio / Daily Movement / This Week) เป็นเพราะ**ข้อมูลจริงยังไม่มี** ไม่ใช่เรื่องเลย์เอาต์ — mockup เองก็มีช่องว่างก้นการ์ด Momentum พอๆ กัน

   **การตรวจสอบ:** Babel + CSS parse ผ่าน · smoke test **54/54 · NO RUNTIME ERRORS** · วัดตำแหน่งจริงด้วย Playwright ที่ viewport 1520px: แผ่นกว้าง 1280 จัดกลาง ตรงตาม mockup · **ยังไม่ push (ให้ ohm รัน `git push origin main` เอง)**

32. **ธรรมนูญดีไซน์: ทุกหน้าต้องสเกลตามหน้า Home (ohm สั่ง 2026-08-26 หลังจบข้อ 24/2)** — ohm บอกว่า "หน้า home ลงตัวมาก อยากให้ทุกหน้าสเกลสัมพันธ์กับหน้าโฮม" · **ข้อนี้เป็นข้อบังคับของงานข้อ 24/3 เป็นต้นไปทุกข้อ ไม่ใช่งานแยก** อ่านข้อนี้ก่อนเริ่มรีดีไซน์ทุกหน้า

   **สิ่งที่ ohm ขอ (4 ข้อ):**
   1. **แสดงข้อมูลเป็นการ์ดเหมือนหน้า Home** — ไม่ใช่ตารางเปล่าๆ/บล็อกยาวๆ (ยกเว้นหน้า Income/Expenses ที่ข้อ 24 ระบุไว้ชัดว่า **ห้ามรื้อเป็น bento** ต้องคงตารางความหนาแน่นสูง — ให้ reskin ให้เข้าชุดแทน)
   2. **ปุ่มเพิ่มข้อมูล/กรอกเองต้องรวมเป็นปุ่มเดียวต่อหน้า** — ตอนนี้หลายหน้ามีปุ่ม + กระจายตามการ์ดย่อย ให้รวบเป็นปุ่มเดียว (ถ้าหน้ามีหลายชนิดข้อมูล ให้ปุ่มเดียวแล้วเลือกชนิดในโมดัล แบบ Quick Capture)
   3. **ข้อมูลยาวต้องกดซ่อน/กางได้** — ใช้ `DashCollapse` ที่มีอยู่แล้ว หรือปุ่ม "อีก X รายการ" แบบการ์ด Today's Tasks
   4. **ขนาดตัวอักษรทุกหน้าต้องสัมพันธ์กับหน้า Home**

   **สเกลมาตรฐาน (ยกมาจากหน้า Home ที่ ohm อนุมัติแล้ว — ใช้ค่านี้เป็นความจริง):**

   | บทบาท | ขนาด | คลาส/หมายเหตุ |
   |---|---|---|
   | หัวข้อฮีโร่ของหน้า | 38px/600 `margin:0` | `.db-hero-title` — **ต้องใส่ `margin:0` เสมอ** `<h1>` โดน margin ปริยายเบราว์เซอร์ (ดูข้อ 31) |
   | ตัวเลขใหญ่สรุป | 40px/600 | `.db-bignum .n` |
   | ตัวเลขเด่นในการ์ด | 26px/600 | `.db-bignum-inline`, `.db-count` |
   | หัวการ์ด | 14px/600 | `.db-title` |
   | คำอธิบายใต้หัวการ์ด | 11px | `.db-note` |
   | เนื้อหา/แถวข้อมูล | 12.5px | `.db-row`, `.db-tname` |
   | รายการกดได้ | 13px | `.db-acc-row` |
   | ป้าย/คำอธิบายจาง | 10-11px | `.db-tsub`, `.db-blab`, `.db-ms-when` |
   | ตัวเลขทุกชนิด | ใส่ `db-mono` | IBM Plex Mono + `tabular-nums` |
   | แถบเมนูบน | brand 14px/600 · ปุ่มเมนู 13px | ห้ามกลับไปใหญ่กว่านี้ |

   **ชุดคลาสที่ต้องใช้ซ้ำ (มีอยู่แล้วท้าย `styles.css` — ตอนนี้ `db-` = design system ของทั้งแอป ไม่ใช่ของหน้า Dashboard อย่างเดียวแล้ว):**
   `.db-bento` (กริด 4 คอลัมน์ + `.db-span2/.db-span4`) · `.db-card` + `.db-head`/`.db-title`/`.db-note`/`.db-chip`/`.db-head-actions` · `.db-row` (แถวซ้าย-ขวา) · `.db-acc-row` (แถวกดได้) · `.db-btn`/`.db-btn.primary` · `.db-track`/`.db-fill`/`.db-tick` (แถบความคืบหน้า+หมุด) · `.db-empty` (สถานะว่าง) · `.db-legend`/`.db-lg` · `.db-mono` · คอมโพเนนต์ `DashCollapse` (การ์ดพับได้) และ `DashDonut` (โดนัท)

   **หนี้ที่ต้องทยอยล้างระหว่างรีดีไซน์แต่ละหน้า (อย่าทำรวดเดียวทั้งแอป จะพังเยอะ):**
   - `styles.css` ยังมี `font-size` ค่าเก่าของธีมม่วงเยอะมาก — **16px 32 จุด · 17px 28 · 15px 23 · 18px 19 · 20px 14 · 21px 6** (ที่เหลือ 19/23/24/26/27px อีกสิบกว่าจุด) ทั้งหมดนี้ใหญ่กว่าสเกลข้างบน 2-5px ทำให้หน้าอื่นดู "ใหญ่และหลวม" กว่าหน้า Home
   - `preview-dashboard.html` มี **inline `style={{}}` 458 จุด** ในนั้นมี `fontSize` ~130 จุด (15px 27 · 17px 24 · 16px 22 · 14px 20 · 20px 15 …) — **CSS ภายนอกชนะ inline ไม่ได้** ต้องไล่ลบ/ย้ายเฉพาะหน้าที่กำลังทำ
   - **วิธีทำที่ตกลงกันไว้:** แต่ละ session แก้เฉพาะหน้าที่ถึงคิว → ไล่ `fontSize` inline ของหน้านั้นออก → ห่อเนื้อหาด้วย `.db-card` → รวมปุ่มเพิ่มข้อมูลเป็นปุ่มเดียว → ห่อลิสต์ยาวด้วย `DashCollapse` → รัน `smoke-test.js` ก่อน commit

   **คิวยังเหมือนเดิม (ข้อ 24): 3 Investments → 4 Finance Overview → 5 Debts → 6 Tracker → 7 Finance Review → 8 Income+Expenses (reskin เท่านั้น) → 9 หน้าเล็กรวบทีเดียว → 10 มือถือ**
