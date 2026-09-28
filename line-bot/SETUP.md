# ติดตั้ง Jack (บอต LINE) — ข้อ 55 ขั้นที่ 6 (+ ขั้นที่ 7 ท้ายไฟล์)

ใช้เวลาราว 15–20 นาที · ทำบนคอม · ล็อกอิน Google ด้วย **supakit6906@gmail.com** (บัญชีเดียวกับเจ้าของ Firebase)

ไฟล์ในโฟลเดอร์ `line-bot/` นี้:

| ไฟล์ | คืออะไร |
|---|---|
| `appsscript.json` | ตั้งค่าโปรเจกต์ Apps Script (สิทธิ์ที่ใช้, เขตเวลา, web app) |
| `Config.gs` | ตั้งค่าที่แก้ได้: รุ่น AI, ราคา, เพดาน $5 |
| `Persona.gs` | บุคลิกของ Jack — แก้ได้ตามใจ |
| `Bot.gs` | โค้ดหลัก (ปกติไม่ต้องแตะ) |
| `test/bot-test.js` | เทสต์บนคอม (ไม่ต้องอัปขึ้น Apps Script) |

---

## 1. สร้างโปรเจกต์ Apps Script

1. เปิด https://script.new → ตั้งชื่อโปรเจกต์ (มุมซ้ายบน) ว่า **Jack LINE bot**
2. ไอคอนเฟือง ⚙️ **Project Settings** (แถบซ้าย)
   - ติ๊ก ✅ **Show "appsscript.json" manifest file in editor**
3. กลับไปหน้า **Editor** (ไอคอน `< >`)

## 2. วางโค้ด 4 ไฟล์

เปิดแต่ละไฟล์ในโฟลเดอร์นี้ด้วย Notepad → Ctrl+A → Ctrl+C แล้ววางทับ/สร้างใน editor:

| ใน editor | วางจากไฟล์ |
|---|---|
| `appsscript.json` (มีอยู่แล้ว — ลบของเดิมทั้งหมดก่อนวาง) | `appsscript.json` |
| `Code.gs` (มีอยู่แล้ว) → กด ⋮ → **Rename** เป็น `Bot` แล้ววางทับ | `Bot.gs` |
| ปุ่ม **+** → Script → ชื่อ `Config` | `Config.gs` |
| ปุ่ม **+** → Script → ชื่อ `Persona` | `Persona.gs` |

กด 💾 Save (Ctrl+S)

## 3. ใส่ค่าลับ (Script Properties)

⚙️ **Project Settings** → เลื่อนลงล่างสุด **Script Properties** → **Add script property** ทีละตัว (คัดลอกค่าจาก `secrets.local.txt`):

| Property | ค่า |
|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | ค่าในบรรทัด LINE_CHANNEL_ACCESS_TOKEN |
| `LINE_CHANNEL_SECRET` | ค่าในบรรทัด LINE_CHANNEL_SECRET (ยังไม่ได้ใช้ เก็บไว้ก่อน) |
| `OPENAI_API_KEY` | ค่าในบรรทัด OPENAI_API_KEY (ขึ้นต้น `sk-`) |

กด **Save script properties**

## 4. รัน `setup` (ให้สิทธิ์ + เช็กทุกอย่าง)

1. หน้า Editor → เปิดไฟล์ `Bot.gs` → ช่องเลือกฟังก์ชันด้านบน เลือก **setup** → กด ▶ **Run**
2. จะมีหน้าขอสิทธิ์ → **Review permissions** → เลือกบัญชี supakit6906
   → ขึ้น "Google hasn't verified this app" → กด **Advanced** → **Go to Jack LINE bot (unsafe)** → **Allow**
   (ปกติสำหรับสคริปต์ที่เราเขียนเอง — สิทธิ์ที่ขอคือ "เรียก URL ภายนอก" กับ "Cloud Datastore/Firestore")
3. ดู **Execution log** ด้านล่าง ต้องได้ ✅ ครบ 3 บรรทัด + 🎉:
   ```
   ✅ Firestore: uid ... · งานในระบบ N รายการ
   ✅ LINE: บอตชื่อ "Jack" (@...)
   ✅ OpenAI (gpt-6-luna...): "พร้อม"
   🎉 พร้อมทุกอย่าง
   ```
   ถ้ามี ❌ ดูหัวข้อ **แก้ปัญหา** ท้ายไฟล์ · แก้แล้วรัน `checkAll` ซ้ำได้เรื่อยๆ (ไม่ต้องรัน setup ใหม่)

## 5. Deploy เป็น Web app

1. ปุ่มสีน้ำเงิน **Deploy** (ขวาบน) → **New deployment**
2. เฟือง ⚙️ ข้าง "Select type" → **Web app**
3. ตั้งค่า:
   - Description: `Jack v1`
   - Execute as: **Me (supakit6906@gmail.com)**
   - Who has access: **Anyone**  ← ต้องเป็น Anyone ไม่งั้น LINE ส่งเข้ามาไม่ได้ (กันคนอื่นด้วยรหัสลับใน URL + ล็อก LINE ของโอม)
4. **Deploy** → คัดลอก **Web app URL** (ลงท้าย `/exec`)

## 6. ต่อ LINE เข้ากับ Jack

1. ⚙️ Project Settings → Script Properties → เพิ่ม `WEBAPP_URL` = URL ที่คัดลอกมา → Save
2. Editor → เลือกฟังก์ชัน **showWebhookUrl** → ▶ Run → ต้องขึ้น `✅ ตั้ง Webhook URL ใน LINE ให้แล้ว`
   (โค้ดตั้งให้ผ่าน LINE API เลย ไม่ต้องไปวางเองใน LINE Developers)
3. เช็กใน [LINE Developers Console](https://developers.line.biz/console/) → channel ของ Jack → แท็บ **Messaging API**:
   - **Use webhook** = เปิด
   - **Webhook redelivery** = ปิด
   - ⚠️ ถ้ากดปุ่ม **Verify** แล้วขึ้น error `302 Found` — **ไม่ต้องสนใจ** เป็นเรื่องปกติของ Apps Script (ข้อความจริงยังเข้าบอตได้)

## 7. ทดลองใน LINE

1. เปิดแชท Jack → พิมพ์ **สวัสดี** → Jack ตอบว่าจำ LINE ของโอมไว้แล้ว (ข้อความแรกใช้ผูกบัญชีเท่านั้น)
2. ลองต่อ:
   - `ข้าวมันไก่ 60` → จดรายจ่าย + ปุ่ม **แก้ / ยกเลิก**
   - `กาแฟ 55 กับขนม 40` → จด 2 รายการ
   - `เพิ่มงาน โทรหาซัพพลายเออร์ พรุ่งนี้`
   - `วันนี้มีงานอะไรบ้าง`
   - `journal วันนี้ขายดี ลูกค้าประจำมาเยอะ`
   - `เดือนนี้ใช้ไปเท่าไหร่ หมวดไหนเกินงบ`
   - `ช่วยวิเคราะห์การใช้เงินเดือนนี้หน่อย` → ใช้รุ่นกลาง (แพงกว่า ~20 เท่า)
3. เปิดแอปเลขา (คอม/iPhone) → รายการที่จดต้องขึ้นเองภายในไม่กี่วินาที (ประวัติการกระทำมีคำว่า "(LINE)")

**คำสั่งพิเศษ** (ไม่เสียค่า AI): `สถานะ jack` = ดูค่า AI เดือนนี้/error ล่าสุด · `ลืมบทสนทนา` = ล้างความจำแชท

---

## อัปเดตโค้ดครั้งถัดไป (สำคัญ)

แก้ไฟล์ไหนก็ตาม (รวม Persona.gs) → Save → **Deploy → Manage deployments → ✏️ (Edit) → Version: New version → Deploy**
URL เดิมไม่เปลี่ยน ไม่ต้องตั้ง webhook ใหม่ · ถ้าข้ามขั้นนี้ LINE จะยังใช้โค้ดเก่า

## เพดาน $5 ทำงานยังไง

- ทุกครั้งที่เรียก OpenAI โค้ดคำนวณค่าใช้จ่ายจาก token จริง แล้วบวกสะสมใน Script Properties (`usage_YYYY-MM`)
- ถึง $5 → เลิกเรียก AI จนต้นเดือนใหม่ · ระหว่างนั้นยังจดแบบ `ข้าว 50` ได้ (ตัวแยกคำง่ายๆ ไม่ใช้ AI)
- ใช้ไปเกิน 80% → คำถามวิเคราะห์ถูกลดไปใช้รุ่นเล็กแทน
- ตัวหยุดจริงอีกชั้นคือเครดิต $5 ที่เติมไว้ + ปิด auto-recharge (ทำไว้แล้ว)
- ปรับตัวเลขได้ที่ `Config.gs` (`MONTHLY_CAP_USD`, `PRICES`)

## แก้ปัญหา

| อาการ | ทำอะไร |
|---|---|
| ❌ Firestore: `403 ... has not been used in project` หรือ `PERMISSION_DENIED` | ทำ **ทางสำรอง: Service account** ด้านล่าง |
| ❌ Firestore: `หา uid อัตโนมัติไม่ได้` | Firebase Console → Authentication → Users → คัดลอก **User UID** ของ supakit6906 → เพิ่ม Script Property `FIREBASE_UID` |
| ❌ LINE: 401 | token ผิด/หมดอายุ → LINE Developers → Messaging API → **Channel access token (long-lived)** → Reissue → ใส่ใหม่ |
| ❌ OpenAI: 401 | key ผิด → platform.openai.com → API keys (โปรเจกต์ secretary-jack) → สร้างใหม่ |
| ❌ OpenAI: 429 | เครดิตหมด หรือเรียกถี่เกิน |
| ❌ OpenAI: 400 พูดถึง `include` / `reasoning` | แก้ `Config.gs` → `EFFORT_SMALL: "none"` แล้ว Deploy เวอร์ชันใหม่ |
| ส่ง LINE แล้ว Jack เงียบ | (1) ลืม Deploy เวอร์ชันใหม่? (2) Apps Script → **Executions** (แถบซ้าย) ดูว่ามี doPost เข้ามาไหม/มี error อะไร (3) พิมพ์ `สถานะ jack` |
| Jack ตอบคนอื่น/ผูกผิดคน | รันฟังก์ชัน `resetOwner` แล้วส่งข้อความจาก LINE ของโอมใหม่ |

### ทางสำรอง: Service account (ถ้า Firestore ❌)

ปกติ Jack ใช้สิทธิ์ของโอมเอง (เจ้าของโปรเจกต์) — ถ้าใช้ไม่ได้ ให้สร้างบัญชีบริการแทน:

1. https://console.cloud.google.com → เลือกโปรเจกต์ **personal-os** (`personal-os-505713`)
2. IAM & Admin → **Service Accounts** → **+ Create service account** → ชื่อ `jack-bot` → Create and continue
3. Role: **Cloud Datastore User** → Continue → Done
4. คลิก `jack-bot@...` → แท็บ **Keys** → Add key → Create new key → **JSON** → ไฟล์ดาวน์โหลดลงเครื่อง
5. เปิดไฟล์ JSON ด้วย Notepad → คัดลอกทั้งหมด → Apps Script Script Property ใหม่ `SERVICE_ACCOUNT_JSON` = วางทั้งก้อน
6. รัน `checkAll` อีกครั้ง → ✅ · **ลบไฟล์ JSON ที่ดาวน์โหลดทิ้ง** (อย่าใส่ในโฟลเดอร์ git)

---

## Jack เขียนข้อมูลตรงไหน (สำหรับ AI ที่มาทำต่อ)

- `users/{uid}/parts/fg.expenses.<YYYY-MM>` รายจ่าย (amount ติดลบ, `source:"manual"`, `via:"line"`)
- `fg.income.<YYYY-MM>` รายรับ (บวก + `month`) · `f.investments` เงินสะสม กบข./กสจ. (`type:"retirement"`)
- `k.tasks` งาน · `g.journal.<YYYY>` Journal (ต่อท้ายวันเดิม) · `k.notes` โน้ต · `k.activity` ประวัติ (ข้อความลงท้าย "(LINE)")
- `k.jackMemory` ความจำระยะยาว `[{id:"m1", text, at}]` (ขั้นที่ 7 — key บนสุดของข้อมูลแอป แอปถือไว้เฉยๆ)
- เขียนแบบ `commit` + precondition `updateTime` (แอปเขียนแทรก → อ่านใหม่ทำซ้ำ ≤4 รอบ) · json เป็น `JSON.stringify` ไม่มีเว้นวรรค ตรงกับ `SecretaryParts` · ท่อน `~2` ถ้าเกิน 400KB
- บอตผ่าน IAM (ไม่ผ่าน firestore.rules) · แอปไม่ต้องแก้อะไร
- เทสต์: `node test/bot-test.js ../preview-dashboard.html <backup.json>` (51 ข้อ — ใช้ SecretaryParts ของแอปจริงตรวจรูปแบบเอกสาร)

---

## Rich Menu — ปุ่มลัด 6 ปุ่มล่างแชท (เพิ่ม 2026-09-28)

| ปุ่ม | ทำอะไร | ใช้ AI? |
|---|---|---|
| งานวันนี้ | รายการงานเลยกำหนด/วันนี้/งานประจำ + ปุ่ม ✓ ติ๊กเสร็จทีละงาน (มีปุ่มยกเลิก) | ไม่ (ฟรี ทันที) |
| ยอดเดือนนี้ | รายจ่ายเทียบงบ, รายรับ, ออม, หมวดที่ใช้มากสุด, งบเหลือต่อวัน + ปุ่ม "วิเคราะห์ให้หน่อย" | ไม่ (ปุ่มวิเคราะห์ใช้) |
| จดรายจ่าย | เปิดคีย์บอร์ดให้พิมพ์ เช่น `ข้าว 60` | ใช้ตอนพิมพ์ส่ง |
| เพิ่มงาน | เปิดคีย์บอร์ดพร้อมคำว่า `เพิ่มงาน ` | ใช้ตอนพิมพ์ส่ง |
| เขียนบันทึก | เปิดคีย์บอร์ดพร้อมคำว่า `journal วันนี้ ` | ใช้ตอนพิมพ์ส่ง |
| เปิดแอป | เปิดเลขา Ohm ใน Safari | — |

**ติดตั้ง (ทำตามลำดับ):**
1. `git push` ก่อน — รูปเมนู `line-bot/assets/richmenu.png` ต้องขึ้น GitHub Pages (รอ 1–2 นาที)
2. Apps Script: วาง `Bot.gs` และ `Config.gs` ใหม่ทับของเดิม → Save
3. **การทำให้ใช้งานได้ → จัดการการทำให้ใช้งานได้ → ✏️ → เวอร์ชัน: เวอร์ชันใหม่ → ทำให้ใช้งานได้** (ปุ่มงานวันนี้/ยอดเดือนนี้ต้องใช้โค้ดใหม่)
4. เลือกฟังก์ชัน **setupRichMenu** → ▶ เรียกใช้ → ต้องขึ้น `✅ ติดตั้งเมนู Jack แล้ว`
5. ใน LINE ปิดแชท Jack แล้วเปิดใหม่ → แถบ "เมนู Jack" อยู่ล่างจอ

เปลี่ยนรูป: แก้ `assets/make_richmenu.py` → รันสร้างรูปใหม่ → push → รัน `setupRichMenu` อีกครั้ง (ลบเมนูเก่าให้เอง) · เอาเมนูออก: รัน `removeRichMenu`

---

## ขั้นที่ 7 — ความจำระยะยาว + ทักก่อน 07:00 / 20:00 (เพิ่ม 2026-09-28)

**ได้อะไร**
- **ความจำระยะยาว:** พิมพ์ `จำไว้ว่า…` → Jack จำถาวร (ข้ามวัน/ข้ามเดือน) · ถ้าโอมเล่าเรื่องที่น่าจำ Jack จะ**ถามก่อน** "ให้ Jack จำไว้ไหมครับ" พร้อมปุ่ม จำไว้เลย / ไม่ต้องจำ · ดูทั้งหมด: `jack จำอะไรบ้าง` (ฟรี มีปุ่มลืมทีละข้อ) · ลืม: `ลืมข้อ 3` หรือ `ลืมเรื่อง…` · เก็บสูงสุด 60 ข้อ · ไม่จำรหัสผ่าน/เลขบัญชี/เลขบัตร
  - เก็บที่ Firestore `parts/k.jackMemory` → ติดไปกับ Export JSON และสำรอง Drive ของแอปด้วย (แอปไม่แสดง แต่ไม่ลบ)
  - `ลืมบทสนทนา` ล้างแค่แชท 6 รอบล่าสุด ความจำระยะยาวยังอยู่
- **07:00 สรุปเช้า:** งานเลยกำหนด/วันนี้/งานประจำ · นัดวันนี้ (+พรุ่งนี้) · งบเดือนนี้ที่เหลือ + เฉลี่ยต่อวัน · หมวดที่เกิน/ใกล้เต็มงบ · เขียนสไตล์ Jack ด้วย gpt-6-luna (~฿1/เดือน) · เพดานเต็ม/AI ล่ม → ใช้แม่แบบตายตัวแทน ยังส่งตามปกติ · มีปุ่ม 📋 งานวันนี้ / 💰 ยอดเดือนนี้
- **20:00 ชวนเขียน Journal:** บอกยอดใช้วันนี้ + งานที่เสร็จ + คำถามชวนคิด (สลับทุกวัน) · ปุ่ม ✍️ เขียนเลย / ข้ามวันนี้ · **ถ้าวันนั้นเขียน Journal แล้ว (ในแอปหรือ LINE) = ไม่ทัก** · ตอบกลับเป็นเรื่องเล่าได้เลย Jack จดลง Journal ให้
- ใช้ LINE push ~60 ข้อความ/เดือน (ฟรี ~300) · `สถานะ jack` บอกจำนวนที่ส่งไป + โควตาที่ใช้

**ติดตั้ง (ทำตามลำดับ):**
1. Apps Script: วาง **`Bot.gs`, `Config.gs`, `appsscript.json`** ใหม่ทับของเดิม → 💾 Save
   (`appsscript.json` เพิ่มสิทธิ์ `script.scriptapp` = สิทธิ์ตั้งเวลา — ถ้าไม่เห็นไฟล์นี้: ⚙️ ตั้งค่าโปรเจกต์ → ติ๊ก "แสดงไฟล์ Manifest 'appsscript.json' ในเครื่องมือแก้ไข")
2. **การทำให้ใช้งานได้ → จัดการการทำให้ใช้งานได้ → ✏️ → เวอร์ชัน: เวอร์ชันใหม่ → ทำให้ใช้งานได้** (ความจำใช้ผ่าน LINE ต้องใช้โค้ดใหม่) · ❗ห้ามกด "การทำให้ใช้งานได้รายการใหม่"
3. เลือกฟังก์ชัน **setupSchedules** → ▶ เรียกใช้ → Google ขอสิทธิ์เพิ่ม ("จัดการทริกเกอร์") → อนุญาต → ต้องขึ้น `✅ ตั้งเวลาแล้ว: สรุปเช้า 07:00 · ชวนเขียน Journal 20:00`
4. ลองก่อนไม่ต้องรอ: รัน **previewMorning** (ดูข้อความในบันทึกการดำเนินการ ไม่ส่ง) · รัน **testMorningPush** / **testJournalPush** = ส่งเข้า LINE จริงเดี๋ยวนี้
5. ใน LINE ลองพิมพ์ `จำไว้ว่าเราไม่กินเผ็ด` → แล้ว `jack จำอะไรบ้าง`

หมายเหตุ: ทริกเกอร์เวลาใช้**โค้ดล่าสุดที่ Save** (ไม่ต้อง deploy) แต่ข้อความที่โอมพิมพ์ใน LINE ใช้เวอร์ชันที่ deploy — แก้โค้ดแล้วทำข้อ 2 เสมอ · Apps Script ยิงคลาดได้ ±15 นาที (07:00 อาจมา 06:50–07:15)

**ปรับแต่ง (Config.gs):** `MORNING_HOUR` / `JOURNAL_HOUR` (แก้แล้วรัน setupSchedules ใหม่) · `MORNING_USE_AI: false` = แม่แบบฟรี · `MORNING_PUSH` / `JOURNAL_PUSH: false` ปิดทีละอัน (แล้วรัน setupSchedules) · ปิดทั้งหมด: รัน **removeSchedules**

**ถ้าไม่ทัก:** พิมพ์ `สถานะ jack` → ดูบรรทัด "ทักก่อน" (ปิดอยู่ = รัน setupSchedules) และ "error ล่าสุด" · Apps Script → ⏰ ทริกเกอร์ (เมนูซ้าย) → ดูประวัติการรัน/ข้อผิดพลาด
