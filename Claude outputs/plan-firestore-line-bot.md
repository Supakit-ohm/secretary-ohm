
---

## ข้อ 55 (2026-09-28) — แผนใหญ่: ย้ายไป Firestore + Drive แล้วทำเลขาคุยผ่าน LINE (ohm ยืนยันทุกข้อแล้ว)

### การตัดสินใจที่ ohm ยืนยันแล้ว (อย่าเปลี่ยนโดยไม่ถาม)

| เรื่อง | ตัดสินใจ |
|---|---|
| ที่เก็บข้อมูล | **ผสม**: ข้อความ/การเงิน/งาน/Journal → **Firebase Firestore** · รูป/ไฟล์หนัก → **Google Drive** (Firestore เก็บแค่ `driveFileId` + `webViewLink` + รูปย่อ ~10KB แยกเอกสาร ห้ามใส่ในก้อนหลัก) |
| ลำดับ | **Firestore ก่อน** แล้วค่อยทำบอต (ไม่ทำระบบ inbox.json บน Drive — จะเป็นโค้ดทิ้ง) |
| ช่องทางแชท | **LINE** (LINE OA + Messaging API) — ตอบกลับฟรีไม่จำกัด, push ฟรี ~300/เดือน (ไทย) ต้องคุมจำนวน |
| ตัวรับ webhook | **Google Apps Script** (ใส่รหัสลับใน query ของ webhook URL เพราะ Apps Script อ่าน header ลายเซ็น LINE ไม่ได้ + ตอบเฉพาะ userId ของ ohm) |
| AI | **OpenAI API** (ohm ชอบ ChatGPT) — รุ่นเล็กเป็นหลัก รุ่นกลางเฉพาะคำถามวิเคราะห์ · เขียนให้สลับ provider ได้ในจุดเดียว (เผื่อ Gemini API แบบจ่ายเงิน) · API แยกจากแพ็ก ChatGPT Plus ต้องเติมเครดิตเอง |
| เพดานค่า AI ต่อเดือน | **ยังไม่ตัดสินใจ — ถาม ohm อีกครั้ง** (ตัวเลือกที่เสนอ: $2 / $5 / $10) |
| บุคลิกเลขา | **เพื่อนสนิทที่พูดตรง** · **ผู้ชาย ลงท้าย "ครับ"** · เรียก ohm ว่า **"โอห์ม"** · **ชื่อยังไม่ได้ตั้ง — เสนอ 3 ชื่อให้ ohm เลือก** |
| ทักก่อน (push) | **07:00 สรุปเช้า** (งานวันนี้/นัด/งบที่เหลือ) · **20:00 ชวนเขียน Journal** · เรื่องอื่น (เตือนงบ 80%, งานค้าง, DCA) **ไว้ถามใหม่ภายหลัง** |
| บอตเฟสแรกทำได้ | จดรายจ่าย/รายรับ · เพิ่มงาน/ถามงานค้าง · เขียน Journal/จดโน้ต · ถามยอดเงิน/งบ/พอร์ต |
| บอตไม่แน่ใจหมวด/ยอด | **บันทึกเลย แล้วตอบพร้อมปุ่ม Quick Reply "แก้ / ยกเลิก"** |

### ข้อเท็จจริงที่เช็กแล้ว (2026-09-28)

- Firestore แพ็ก Spark (ไม่ผูกบัตร): 1 GiB, อ่าน 50k/วัน, เขียน 20k/วัน, ส่งออก 10 GiB/เดือน, เอกสารละไม่เกิน 1 MiB — ใช้คนเดียวไม่ถึง 5% ยกเว้น "ส่งออก" กับ "ขนาดเอกสาร" ที่ต้องจับตาถ้าเก็บทั้งก้อนเป็นเอกสารเดียว (ข้อมูลตอนนี้ ~110KB) → เฟส 2 แยกเป็นหลายเอกสาร + แอปเตือนเมื่อเกิน 700KB
- **ล็อกอิน Google บน iPhone (แอปหน้าจอหลัก) ใช้ได้แล้ว** (ทดสอบข้อ 54) → ล็อกอิน Firebase ให้ใช้ GIS ID token → `signInWithCredential(GoogleAuthProvider.credential(idToken))` **ห้ามใช้ signInWithRedirect/Popup ของ Firebase** (ติด cookie ข้ามโดเมนบน iOS)
- Cloud Storage for Firebase ต้องแพ็ก Blaze → เก็บไฟล์บน Drive ถูกต้องแล้ว
- Cloud Functions ต้อง Blaze → บอตใช้ Apps Script + Firestore REST แทน
- แอปมีสิทธิ์ Drive แบบ `drive.file` → ลบไฟล์ที่ Apps Script สร้างไม่ได้ (ดูผ่านลิงก์ได้) → ให้ Apps Script เป็นคนลบ
- ตั้ง Firestore location = `asia-southeast1` (เปลี่ยนภายหลังไม่ได้) · ใช้โปรเจกต์ Google Cloud `personal-os` เดิม

### ลำดับงาน (1 session ต่อ 1 ขั้น)

1. **[ohm ทำเอง ~15 นาที ตามขั้นตอนที่ AI เขียนให้]** เปิด Firebase บนโปรเจกต์ `personal-os` → Firestore (asia-southeast1) → Authentication เปิด Google → เพิ่ม authorized domain `supakit-ohm.github.io`
2. เปลี่ยน `window.storage` ให้ใช้ Firestore (เฟสแรก: เอกสารเดียว `users/{uid}/app/data`) + `onSnapshot` realtime + offline cache (persistentLocalCache + multi-tab) + กัน echo loop + `ignoreUndefinedProperties` + ย้ายข้อมูลจาก Drive ครั้งแรก + Security Rules เฉพาะ uid ของ ohm (ทดสอบด้วยบัญชีอื่น) + Drive เหลือเป็น backup รายสัปดาห์ · bump sw.js
3. ทดสอบคอม + iPhone พร้อมกัน แล้วเลิกใช้ปุ่มเชื่อมต่อ Drive แบบเดิม
4. แยกข้อมูลเป็นหลายเอกสาร (รายจ่ายตามเดือน, tasks, journal ฯลฯ)
5. **[ohm ทำเอง]** สร้าง LINE OA + Messaging API channel · สมัคร OpenAI API + เติมเครดิต + ตั้งเพดาน
6. บอตเฟส 1: Apps Script webhook + persona (ไฟล์แก้ได้) + tool calling (add_expense/add_income/add_task/list_tasks/add_journal/add_note/get_summary) เขียนลง Firestore ตรง · โค้ดใส่เครื่องหมายเงินเอง (รายจ่ายติดลบ, กบข./กสจ. = investments) · loading animation · Quick Reply แก้/ยกเลิก
7. บอตเฟส 2: ความจำระยะยาว + push 07:00 สรุปเช้า + 20:00 ชวนเขียน Journal (time-driven trigger)
8. แนบไฟล์: จากแอป + รูปที่ส่งใน LINE → Drive + ผูกรายการใน Firestore
9. ภายหลัง: ข้อความเสียง, อ่านรูปใบเสร็จ, Rich Menu, แจ้งเตือนเพิ่มเติม (ถาม ohm ก่อน)
