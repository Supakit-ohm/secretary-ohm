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
 "bookQueue":[{"id":"bk1","title":"หนังสือทดสอบ","status":"reading"},{"id":"bk2","title":"อ่านจบแล้ว","status":"done","rating":9,"reviewText":"รีวิวทดสอบติดกับเล่ม"}],
 "mediaReviews":[{"id":"mr1","title":"รีวิวทดสอบ","type":"video","rating":9,"reviewText":"ทดสอบระบบรีวิว","date":"2026-07-01","link":""}],
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
  {"id":"t3","projectId":null,"title":"งานประจำวัน","note":"","status":"pending","dueDate":null,"recurrence":"daily","weight":1,"completions":{}},
  {"id":"t4","projectId":"p1","title":"ฝึกทุกวัน","note":"","status":"pending","dueDate":null,"recurrence":"daily","weight":1,"completions":{},"createdAt":"2026-08-01"}],
 "checkins":[
  {"id":"ck1","projectId":"p2","date":"2026-03-01","value":120000,"note":"ยกมา"},
  {"id":"ck2","projectId":"p2","date":"2026-08-01","value":180000,"note":""}],
 "ohmProfile":{"who":"เจ้าของร้าน","goals":"• วิ่ง 10K","values":"","focus":"","pending":[{"id":"pp1","section":"values","text":"ครอบครัวมาก่อน","at":"2026-09-01","by":"jack"},{"id":"pp2","section":"focus","text":"ทิ้งอันนี้","at":"2026-09-01","by":"jack"}]},
 "budgets":{"อาหาร":{"amount":8000,"type":"variable"}},"reviews":{},
 "progressLog":{"2026-07-25":30.5,"2026-08-20":38.2}
};

const CHECKUP_FIXTURE=[{"p": 1, "x": 340, "y": 506, "s": "ตาซาย 20/_______ CORR.to 20/_______ by _______"}, {"p": 1, "x": 303, "y": 521, "s": "การมองใกล ตาขวา 20/_______ CORR.to 20/_______ by _______"}, {"p": 1, "x": 303, "y": 219, "s": "อื่นๆ _________________________________________________________________"}, {"p": 1, "x": 276, "y": 570, "s": "10 /ul"}, {"p": 1, "x": 339, "y": 536, "s": "ตาซาย 20/_______ CORR.to 20/_______ by _______"}, {"p": 1, "x": 303, "y": 491, "s": "คําแนะนํา______________________________________________________________"}, {"p": 1, "x": 303, "y": 476, "s": "หมายเหตุ______________________________________________________________"}, {"p": 1, "x": 383, "y": 552, "s": "30"}, {"p": 1, "x": 383, "y": 537, "s": "25"}, {"p": 1, "x": 383, "y": 507, "s": "25"}, {"p": 1, "x": 522, "y": 550, "s": "ความดันลูกตา"}, {"p": 1, "x": 517, "y": 523, "s": "ซาย_______"}, {"p": 1, "x": 517, "y": 537, "s": "ขวา_______"}, {"p": 1, "x": 536, "y": 523, "s": "16.0"}, {"p": 1, "x": 536, "y": 537, "s": "15.1"}, {"p": 1, "x": 303, "y": 551, "s": "การมองไกล ตาขวา 20/_______ CORR.to 20/_______ by _______"}, {"p": 1, "x": 416, "y": 33, "s": "QF-ART-39 Rev.00 วันที่บังคับใช 01 เม.ย. 2564"}, {"p": 1, "x": 303, "y": 135, "s": "หายใจ (Respirtion)___________________ / min"}, {"p": 1, "x": 303, "y": 150, "s": "ชีพจร (pulse)_________________ / min"}, {"p": 1, "x": 440, "y": 150, "s": "อุณหภูมิ (Temp)_________________ c"}, {"p": 1, "x": 303, "y": 165, "s": "ความดันโลหิต (Blood pressure)_________________ / _________________ mmHg"}, {"p": 1, "x": 431, "y": 165, "s": "126"}, {"p": 1, "x": 504, "y": 165, "s": "79"}, {"p": 1, "x": 376, "y": 150, "s": "72"}, {"p": 1, "x": 28, "y": 140, "s": "กลูโคสในปสสาวะ"}, {"p": 1, "x": 28, "y": 170, "s": "ความเปนกรด-ดาง"}, {"p": 1, "x": 28, "y": 200, "s": "ความใสของปสสาวะ"}, {"p": 1, "x": 28, "y": 185, "s": "ความถวงจําเพาะ"}, {"p": 1, "x": 28, "y": 155, "s": "โปรตีนที่รั่วทางปสสาวะ"}, {"p": 1, "x": 28, "y": 125, "s": "คีโตนที่รั่วทางปสสาวะ"}, {"p": 1, "x": 29, "y": 110, "s": "ไนไตรทในปสสาวะ"}, {"p": 1, "x": 28, "y": 95, "s": "บิลิรูบินในปสสาวะ"}, {"p": 1, "x": 28, "y": 80, "s": "สารยูโรบิลิโนเจน"}, {"p": 1, "x": 239, "y": 50, "s": "Negative"}, {"p": 1, "x": 239, "y": 65, "s": "Negative"}, {"p": 1, "x": 239, "y": 80, "s": "Negative"}, {"p": 1, "x": 239, "y": 95, "s": "Negative"}, {"p": 1, "x": 239, "y": 110, "s": "Negative"}, {"p": 1, "x": 239, "y": 125, "s": "Negative"}, {"p": 1, "x": 239, "y": 140, "s": "Negative"}, {"p": 1, "x": 239, "y": 155, "s": "Negative"}, {"p": 1, "x": 239, "y": 170, "s": "4.6-8.0"}, {"p": 1, "x": 239, "y": 185, "s": "1.003-1.030"}, {"p": 1, "x": 28, "y": 215, "s": "สีปสสาวะ"}, {"p": 1, "x": 116, "y": 215, "s": "Color"}, {"p": 1, "x": 116, "y": 200, "s": "Clearity"}, {"p": 1, "x": 116, "y": 185, "s": "Sp.gravity"}, {"p": 1, "x": 116, "y": 170, "s": "PH"}, {"p": 1, "x": 116, "y": 155, "s": "Protein"}, {"p": 1, "x": 116, "y": 50, "s": "Blood"}, {"p": 1, "x": 116, "y": 65, "s": "Leukocyte"}, {"p": 1, "x": 116, "y": 80, "s": "Urobilinogen"}, {"p": 1, "x": 116, "y": 95, "s": "Bilirubin"}, {"p": 1, "x": 116, "y": 110, "s": "Nitrite"}, {"p": 1, "x": 116, "y": 125, "s": "Ketone"}, {"p": 1, "x": 116, "y": 140, "s": "Sugar"}, {"p": 1, "x": 202, "y": 50, "s": "Negative"}, {"p": 1, "x": 202, "y": 215, "s": "Amber"}, {"p": 1, "x": 202, "y": 200, "s": "Clear"}, {"p": 1, "x": 189, "y": 185, "s": "h"}, {"p": 1, "x": 202, "y": 185, "s": "1.034"}, {"p": 1, "x": 202, "y": 170, "s": "5.3"}, {"p": 1, "x": 202, "y": 155, "s": "Negative"}, {"p": 1, "x": 202, "y": 140, "s": "Negative"}, {"p": 1, "x": 202, "y": 125, "s": "Trace"}, {"p": 1, "x": 202, "y": 110, "s": "Negative"}, {"p": 1, "x": 202, "y": 95, "s": "Negative"}, {"p": 1, "x": 202, "y": 80, "s": "Normal"}, {"p": 1, "x": 202, "y": 65, "s": "Negative"}, {"p": 1, "x": 28, "y": 65, "s": "เม็ดเลือดขาว"}, {"p": 1, "x": 28, "y": 50, "s": "เม็ดเลือดแดง"}, {"p": 1, "x": 303, "y": 405, "s": "ขอชี้แนะ______________________________________________________________"}, {"p": 1, "x": 329, "y": 389, "s": "______________________________________________________________"}, {"p": 1, "x": 303, "y": 420, "s": "หูซาย________________________________________________________________"}, {"p": 1, "x": 303, "y": 436, "s": "หูขวา ________________________________________________________________"}, {"p": 1, "x": 329, "y": 421, "s": "การไดยินอยูในเกณฑปกติ (Normal hearing ability)"}, {"p": 1, "x": 329, "y": 437, "s": "การไดยินอยูในเกณฑปกติ (Normal hearing ability)"}, {"p": 1, "x": 303, "y": 348, "s": "ผลการตรวจ___________________________________________________________"}, {"p": 1, "x": 303, "y": 333, "s": "รายละเอียด___________________________________________________________"}, {"p": 1, "x": 346, "y": 348, "s": "Normal"}, {"p": 1, "x": 303, "y": 293, "s": "สภาพชองปาก__________________________________________________________"}, {"p": 1, "x": 303, "y": 278, "s": "สภาพเหงือก__________________________ สภาพฟน_________________________"}, {"p": 1, "x": 350, "y": 293, "s": "ปกติ"}, {"p": 1, "x": 344, "y": 278, "s": "เหงือกปกติ"}, {"p": 1, "x": 318, "y": 203, "s": "_________________________________________________________________"}, {"p": 1, "x": 303, "y": 234, "s": "_____________________________________________________________________"}, {"p": 1, "x": 303, "y": 249, "s": "_____________________________________________________________________"}, {"p": 1, "x": 303, "y": 262, "s": "การรักษาที่ควรไดรับ"}, {"p": 1, "x": 368, "y": 262, "s": "____________________________________________________"}, {"p": 1, "x": 302, "y": 96, "s": "น้ําหนัก (Weight)_________________kgs"}, {"p": 1, "x": 435, "y": 96, "s": "สวนสูง (Height)_________________cms"}, {"p": 1, "x": 302, "y": 81, "s": "รอบเอว (Wist line)______________________cms"}, {"p": 1, "x": 465, "y": 81, "s": "BMI =_____________________"}, {"p": 1, "x": 379, "y": 96, "s": "70.2"}, {"p": 1, "x": 514, "y": 81, "s": "24.01"}, {"p": 1, "x": 506, "y": 96, "s": "171.0"}, {"p": 1, "x": 396, "y": 81, "s": "82"}, {"p": 1, "x": 347, "y": 66, "s": "18.50-22.99 ทานมีน้ําหนักปกติ ควรดํารงน้ําหนักตัวใหอยูในระดับนี้"}, {"p": 1, "x": 302, "y": 66, "s": "แปลผล (BMI)__________________________________________________________"}, {"p": 1, "x": 302, "y": 51, "s": "_____________________________________________________________________"}, {"p": 1, "x": 68, "y": 232, "s": "การตรวจสอบ"}, {"p": 1, "x": 187, "y": 232, "s": "ผลการตรวจ"}, {"p": 1, "x": 254, "y": 232, "s": "คาปกติ"}, {"p": 1, "x": 283, "y": 576, "s": "3"}, {"p": 1, "x": 283, "y": 591, "s": "3"}, {"p": 1, "x": 283, "y": 561, "s": "3"}, {"p": 1, "x": 132, "y": 622, "s": "การตรวจเลือด"}, {"p": 1, "x": 116, "y": 570, "s": "RBC"}, {"p": 1, "x": 116, "y": 555, "s": "Platelet"}, {"p": 1, "x": 116, "y": 540, "s": "Hemoglobin"}, {"p": 1, "x": 116, "y": 525, "s": "Hematocrit"}, {"p": 1, "x": 116, "y": 495, "s": "Glucose"}, {"p": 1, "x": 117, "y": 510, "s": "HbA1c"}, {"p": 1, "x": 116, "y": 450, "s": "Uric"}, {"p": 1, "x": 116, "y": 465, "s": "Creatinine"}, {"p": 1, "x": 116, "y": 480, "s": "BUN"}, {"p": 1, "x": 116, "y": 270, "s": "Syphilis IgG"}, {"p": 1, "x": 116, "y": 585, "s": "WBC"}, {"p": 1, "x": 28, "y": 585, "s": "จํานวนเม็ดเลือดขาว"}, {"p": 1, "x": 28, "y": 540, "s": "โปรตีนในเม็ดเลือดแดง"}, {"p": 1, "x": 28, "y": 525, "s": "ความเขมขนเม็ดเลือดแดง"}, {"p": 1, "x": 28, "y": 510, "s": "ระดับน้ําตาลสะสม"}, {"p": 1, "x": 28, "y": 495, "s": "น้ําตาลในเลือด"}, {"p": 1, "x": 28, "y": 375, "s": "ไขมันเลวโดยตรง"}, {"p": 1, "x": 116, "y": 435, "s": "Total Cholesterol"}, {"p": 1, "x": 116, "y": 405, "s": "HDL-Cholesterol"}, {"p": 1, "x": 116, "y": 390, "s": "LDL-(Calculate)"}, {"p": 1, "x": 116, "y": 420, "s": "Triglyceride"}, {"p": 1, "x": 116, "y": 375, "s": "LDL-direct"}, {"p": 1, "x": 116, "y": 360, "s": "SGOT-AST"}, {"p": 1, "x": 116, "y": 345, "s": "SGPT-ALT"}, {"p": 1, "x": 116, "y": 330, "s": "Albumin"}, {"p": 1, "x": 117, "y": 315, "s": "ALP"}, {"p": 1, "x": 28, "y": 270, "s": "โรคซิฟลิส"}, {"p": 1, "x": 28, "y": 285, "s": "โปรตีนรวมในเลือด"}, {"p": 1, "x": 28, "y": 300, "s": "บิลิรูบินทั้งหมด"}, {"p": 1, "x": 28, "y": 315, "s": "เอนไซมที่ผลิตที่ตับ"}, {"p": 1, "x": 28, "y": 330, "s": "โปรตีนที่สรางจากตับ"}, {"p": 1, "x": 28, "y": 345, "s": "เอนไซมในตับ"}, {"p": 1, "x": 28, "y": 360, "s": "เอนไซมในตับ"}, {"p": 1, "x": 28, "y": 390, "s": "ไขมันเลว (สวนเกิน)"}, {"p": 1, "x": 28, "y": 405, "s": "ไขมันดี"}, {"p": 1, "x": 28, "y": 420, "s": "ไขมันสะสม"}, {"p": 1, "x": 28, "y": 435, "s": "คอเรสเตอรอลรวม"}, {"p": 1, "x": 29, "y": 450, "s": "ปริมาณกรดยูริก (เกาท)"}, {"p": 1, "x": 28, "y": 465, "s": "การทํางานของไต"}, {"p": 1, "x": 28, "y": 480, "s": "ปริมาณยูเรียในเลือด"}, {"p": 1, "x": 117, "y": 300, "s": "Total Bilirubin"}, {"p": 1, "x": 117, "y": 285, "s": "Total protein"}, {"p": 1, "x": 28, "y": 570, "s": "จํานวนเม็ดเลือดแดง"}, {"p": 1, "x": 28, "y": 555, "s": "เกล็ดเลือด"}, {"p": 1, "x": 202, "y": 271, "s": "Nonreactive"}, {"p": 1, "x": 202, "y": 286, "s": "7.6"}, {"p": 1, "x": 202, "y": 300, "s": "0.6"}, {"p": 1, "x": 202, "y": 315, "s": "61"}, {"p": 1, "x": 202, "y": 330, "s": "4.7"}, {"p": 1, "x": 202, "y": 345, "s": "25"}, {"p": 1, "x": 202, "y": 360, "s": "22"}, {"p": 1, "x": 189, "y": 376, "s": "h"}, {"p": 1, "x": 202, "y": 375, "s": "141"}, {"p": 1, "x": 202, "y": 405, "s": "48"}, {"p": 1, "x": 189, "y": 421, "s": "h"}, {"p": 1, "x": 202, "y": 420, "s": "168"}, {"p": 1, "x": 189, "y": 436, "s": "h"}, {"p": 1, "x": 202, "y": 435, "s": "212"}, {"p": 1, "x": 202, "y": 450, "s": "6.4"}, {"p": 1, "x": 202, "y": 465, "s": "1.02"}, {"p": 1, "x": 202, "y": 480, "s": "12"}, {"p": 1, "x": 202, "y": 495, "s": "91"}, {"p": 1, "x": 202, "y": 510, "s": "5.3"}, {"p": 1, "x": 202, "y": 525, "s": "44.80"}, {"p": 1, "x": 202, "y": 540, "s": "15.10"}, {"p": 1, "x": 201, "y": 555, "s": "250.00"}, {"p": 1, "x": 202, "y": 570, "s": "5.02"}, {"p": 1, "x": 202, "y": 585, "s": "7.10"}, {"p": 1, "x": 239, "y": 271, "s": "Negative"}, {"p": 1, "x": 238, "y": 300, "s": "01-1.2"}, {"p": 1, "x": 276, "y": 299, "s": "mg/dl"}, {"p": 1, "x": 238, "y": 315, "s": "34-104"}, {"p": 1, "x": 276, "y": 315, "s": "U/ L"}, {"p": 1, "x": 238, "y": 330, "s": "3.5-5.5"}, {"p": 1, "x": 276, "y": 330, "s": "g/dl"}, {"p": 1, "x": 238, "y": 285, "s": "6.4-8.3"}, {"p": 1, "x": 276, "y": 285, "s": "g/dl"}, {"p": 1, "x": 238, "y": 345, "s": "10-37"}, {"p": 1, "x": 276, "y": 345, "s": "U/ L"}, {"p": 1, "x": 238, "y": 360, "s": "10-37"}, {"p": 1, "x": 276, "y": 360, "s": "U/ L"}, {"p": 1, "x": 238, "y": 375, "s": "<100"}, {"p": 1, "x": 276, "y": 375, "s": "mg/dl"}, {"p": 1, "x": 238, "y": 390, "s": "90-130"}, {"p": 1, "x": 276, "y": 390, "s": "mg/dl"}, {"p": 1, "x": 238, "y": 405, "s": "35-80"}, {"p": 1, "x": 276, "y": 405, "s": "mg/dl"}, {"p": 1, "x": 238, "y": 420, "s": "50-155"}, {"p": 1, "x": 276, "y": 420, "s": "mg/dl"}, {"p": 1, "x": 238, "y": 435, "s": "155-200"}, {"p": 1, "x": 276, "y": 435, "s": "mg/dl"}, {"p": 1, "x": 238, "y": 450, "s": "2.3-8.2"}, {"p": 1, "x": 276, "y": 450, "s": "mg/dl"}, {"p": 1, "x": 238, "y": 465, "s": "0.6-1.5"}, {"p": 1, "x": 276, "y": 465, "s": "mg/dl"}, {"p": 1, "x": 238, "y": 480, "s": "2-23"}, {"p": 1, "x": 276, "y": 480, "s": "mg/dl"}, {"p": 1, "x": 238, "y": 495, "s": "75-115"}, {"p": 1, "x": 276, "y": 495, "s": "mg/dl"}, {"p": 1, "x": 238, "y": 510, "s": "4.4 - 6.4"}, {"p": 1, "x": 276, "y": 510, "s": "%"}, {"p": 1, "x": 238, "y": 525, "s": "39.00-50.00%"}, {"p": 1, "x": 238, "y": 540, "s": "13.00-19.00g/dl"}, {"p": 1, "x": 238, "y": 555, "s": "140.00-400 10 /ul"}, {"p": 1, "x": 238, "y": 570, "s": "4.20-6.30"}, {"p": 1, "x": 238, "y": 585, "s": "5.00-10.00 10 /ul"}, {"p": 1, "x": 73, "y": 602, "s": "การตรวจสอบ"}, {"p": 1, "x": 187, "y": 602, "s": "ผลการตรวจ"}, {"p": 1, "x": 254, "y": 602, "s": "คาปกติ"}, {"p": 1, "x": 394, "y": 568, "s": "การตรวจการมองเห็น"}, {"p": 1, "x": 399, "y": 456, "s": "การตรวจการไดยิน"}, {"p": 1, "x": 387, "y": 369, "s": "การตรวจคลื่นไฟฟาหัวใจ"}, {"p": 1, "x": 386, "y": 312, "s": "การตรวจฟนและชองปาก"}, {"p": 1, "x": 385, "y": 183, "s": "สัญญานชีพ (Vital signs)"}, {"p": 1, "x": 347, "y": 113, "s": "ประมวลผลภาวะน้ําหนักเกินและโรคอวนลงพุง"}, {"p": 1, "x": 125, "y": 252, "s": "การตรวจปสสาวะ"}, {"p": 1, "x": 302, "y": 739, "s": "Chest :"}, {"p": 1, "x": 302, "y": 727, "s": "Chest film is within normal limit."}, {"p": 1, "x": 302, "y": 690, "s": "====== [Conclusion] ======"}, {"p": 1, "x": 302, "y": 678, "s": "IMPRESSION : Normal study."}, {"p": 1, "x": 302, "y": 654, "s": "Doctor A. MD."}, {"p": 1, "x": 390, "y": 756, "s": "การตรวจเอ็กซเรยทรวงอก"}, {"p": 1, "x": 149, "y": 660, "s": "วันที่ตรวจ :"}, {"p": 1, "x": 198, "y": 661, "w": 41, "s": "15/03/2568"}, {"p": 1, "x": 544, "y": 807, "s": "หนา 1/2"}, {"p": 1, "x": 383, "y": 522, "s": "25"}, {"p": 2, "x": 409, "y": 761, "s": "คําแนะนํา"}, {"p": 2, "x": 305, "y": 740, "s": "ไขมันในเลือดสูงเล็กน้อย ลดอาหารทอด"}, {"p": 2, "x": 305, "y": 726, "s": "ออกกําลังกายสม่ําเสมอ"}];
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
  /* "deoptimised the styling … exceeds the max of 500KB" = Babel แจ้งว่าไฟล์ใหญ่เกิน 500KB เลยไม่จัดรูปโค้ดที่แปลงแล้ว (ขั้นที่ 7B) — ไม่ใช่ error ไม่กระทบการทำงาน */
  p.on('console',m=>{ if(m.type()==='error'&&!/favicon|manifest|sw\.js|Failed to load resource|net::|deoptimised the styling/i.test(m.text())) errs.push('CONSOLE: '+m.text().slice(0,300)); });
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
      bignums:document.querySelectorAll('.book-page .db-hero .db-bignum .n').length, // ข้อ 50: สโคปเฉพาะฮีโร่ เพราะการ์ด "สถิติการอ่าน" ใหม่ก็ใช้ .db-bignum เหมือนกัน
      addBtns:[...document.querySelectorAll('.book-page button')].filter(b=>/เพิ่มข้อมูล/.test(b.textContent||'')).map(b=>b.textContent.trim()),
      legacy:document.querySelectorAll('.book-page .card, .book-page .empty, .book-page .text-btn').length,
      shelfItems:document.querySelectorAll('.book-page .book-shelf-item').length,
      covers:document.querySelectorAll('.book-page .book-shelf-cover').length,
      dots:[...document.querySelectorAll('.book-page .book-shelf-dot')].map(d=>d.className.replace('book-shelf-dot','').trim()),
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
  check('รายการหนังสือทั้งหมด (ข้อ 24/9b: shelf) แสดงครบ 2 เล่มจาก seed พร้อมปก+จุดสถานะ',bq.shelfItems===2&&bq.covers===2&&bq.dots.length===2,`shelf ${bq.shelfItems} ใบ · ปก ${bq.covers} · จุด ${bq.dots.length}`);
  check('จุดสถานะสีตรงกับ seed (bk1=reading, bk2=done)',bq.dots[0]==='reading'&&bq.dots[1]==='done',bq.dots.join(', '));
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
  const bqEdit=p.locator('.book-page .book-shelf-item .db-chip[title="แก้ไข"]').first();
  if(await bqEdit.count()){
    await bqEdit.click(); await p.waitForTimeout(800);
    const ed=await p.evaluate(()=>{
      const m=document.querySelector('.modal-backdrop .modal');
      return m?{head:m.querySelector('.modal-head span')?.textContent.trim(),title:m.querySelector('input')?.value}:null;
    });
    check('ปุ่มแก้ไขเปิดโมดัลพร้อมค่าเดิม',!!ed&&/แก้ไข/.test(ed.head||'')&&!!ed.title,ed?`${ed.head} · ${ed.title}`:'');
    await p.locator('.modal-close').first().click().catch(()=>{}); await p.waitForTimeout(500);
  } else check('ปุ่มแก้ไขเปิดโมดัลพร้อมค่าเดิม',false,'ไม่เจอปุ่มแก้ไข');
  // ข้อ 24/9e: อัปโหลดปกเอง — เปิดแก้ไขเล่มเดิม ใส่รูปเทส เช็คว่า preview ขึ้น + บันทึกลง localStorage จริง
  const bqEditForCover=p.locator('.book-page .book-shelf-item .db-chip[title="แก้ไข"]').first();
  if(await bqEditForCover.count()){
    await bqEditForCover.click(); await p.waitForTimeout(800);
    const TEST_PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
    await p.locator('.modal-backdrop input[type="file"]').setInputFiles({name:'cover.png',mimeType:'image/png',buffer:TEST_PNG});
    await p.waitForTimeout(600);
    const hasPreview=await p.evaluate(()=>{
      const img=document.querySelector('.modal-backdrop .book-cover-picker-preview img');
      return !!img&&img.src.startsWith('data:image');
    });
    const hasResetBtn=await p.evaluate(()=>[...document.querySelectorAll('.modal-backdrop button')].some(b=>/กลับไปดึงอัตโนมัติ/.test(b.textContent||'')));
    check('อัปโหลดปกเองแล้วขึ้น preview ทันที',hasPreview,hasPreview?'มี preview data:image':'ไม่มี');
    check('มีปุ่ม "กลับไปดึงอัตโนมัติ" โผล่มาหลังอัปโหลด',hasResetBtn);
    await p.locator('.modal-backdrop .modal-btn-save').click(); await p.waitForTimeout(1000);
    const savedBook=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).bookQueue.find(b=>b.coverManual===true));
    check('บันทึกปกที่อัปโหลดเองลง localStorage จริง (coverManual+coverUrl เป็น data URI)',
      !!savedBook&&typeof savedBook.coverUrl==='string'&&savedBook.coverUrl.startsWith('data:image'),
      savedBook?`coverManual=${savedBook.coverManual} coverUrl เริ่มด้วย ${(savedBook.coverUrl||'').slice(0,20)}...`:'ไม่เจอ');
  } else { check('อัปโหลดปกเองแล้วขึ้น preview ทันที',false,'ไม่เจอปุ่มแก้ไข'); check('มีปุ่ม "กลับไปดึงอัตโนมัติ" โผล่มาหลังอัปโหลด',false); check('บันทึกปกที่อัปโหลดเองลง localStorage จริง (coverManual+coverUrl เป็น data URI)',false); }
  // ข้อ 45/2: รีวิว+คะแนนติดกับหนังสือเล่มนั้นตรงๆ (bk2 seed มี rating:9/reviewText อยู่แล้ว) — เช็คว่าโชว์บนชั้นหนังสือ + แก้ไข/บันทึกได้จริง
  const shelfRatingText=await p.evaluate(()=>{
    const item=[...document.querySelectorAll('.book-page .book-shelf-item')].find(el=>el.textContent.includes('อ่านจบแล้ว'));
    return item?(item.querySelector('.db-tsub')?.textContent||''):'';
  });
  check('ชั้นหนังสือโชว์คะแนนที่ติดกับเล่ม (seed bk2 rating=9)',/★ 9\/10/.test(shelfRatingText),shelfRatingText);
  const bqRatingEdit=p.locator('.book-page .book-shelf-item:has-text("อ่านจบแล้ว") .db-chip[title="แก้ไข"]').first();
  if(await bqRatingEdit.count()){
    await bqRatingEdit.click(); await p.waitForTimeout(800);
    const prefill=await p.evaluate(()=>{
      const m=document.querySelector('.modal-backdrop .modal');
      const numInput=m?.querySelector('input[type="number"]');
      const ta=m?.querySelector('textarea');
      return {rating:numInput?numInput.value:'',reviewText:ta?ta.value:''};
    });
    check('เปิดแก้ไขหนังสือแล้ว rating/reviewText เดิมขึ้นในฟอร์ม',prefill.rating==='9'&&/รีวิวทดสอบติดกับเล่ม/.test(prefill.reviewText),`rating=${prefill.rating} · "${prefill.reviewText}"`);
    await p.locator('.modal-backdrop input[type="number"]').first().fill('7');
    await p.locator('.modal-backdrop .modal-btn-save').click(); await p.waitForTimeout(1000);
    const updated=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).bookQueue.find(b=>b.id==='bk2')?.rating);
    check('แก้คะแนนหนังสือแล้วบันทึกจริงลง localStorage',updated===7,`rating=${updated}`);
  } else { check('เปิดแก้ไขหนังสือแล้ว rating/reviewText เดิมขึ้นในฟอร์ม',false,'ไม่เจอปุ่มแก้ไข'); check('แก้คะแนนหนังสือแล้วบันทึกจริงลง localStorage',false); }
  // ลบเล่มหนึ่งออกจากรายการทั้งหมด → หายจริงใน localStorage
  const beforeDel=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).bookQueue.length);
  const bqDel=p.locator('.book-page .book-shelf-item .db-chip[title="ลบ"]').first();
  if(await bqDel.count()){
    await bqDel.click(); await p.waitForTimeout(1000);
    const afterDel=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).bookQueue.length);
    check('ลบหนังสือออกจากรายการได้จริง',afterDel===beforeDel-1,`${beforeDel} → ${afterDel}`);
  } else check('ลบหนังสือออกจากรายการได้จริง',false,'ไม่เจอปุ่มลบ');

  console.log('\n[ข้อ 50 - Book Queue] แท็ก/ตัวกรอง + สถิติการอ่าน + คำคม (ไอเดียเสริมที่ค้างจากสเปกเดิม)');
  // เพิ่มหนังสือใหม่พร้อมแท็ก (คั่นด้วยจุลภาค) ผ่าน TagsField
  await p.locator('.book-page .inv-add-btn').first().click(); await p.waitForTimeout(600);
  await p.locator('.modal-backdrop input').first().fill('หนังสือทดสอบข้อ 50');
  await p.locator('.modal-backdrop input[placeholder="เช่น ธุรกิจ, แรงบันดาลใจ"]').fill('แท็กทดสอบ50, อีกแท็ก');
  await p.locator('.modal-backdrop .modal-btn-save').click(); await p.waitForTimeout(800);
  const savedTags=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).bookQueue.find(b=>b.title==='หนังสือทดสอบข้อ 50')?.tags);
  check('เพิ่มหนังสือพร้อมแท็กบันทึกเป็น array ถูกต้อง (2 แท็ก)',Array.isArray(savedTags)&&savedTags.length===2&&savedTags.includes('แท็กทดสอบ50')&&savedTags.includes('อีกแท็ก'),JSON.stringify(savedTags));

  // ตัวกรองแท็ก — ชิปใหม่ต้องโผล่ กดกรองแล้วเหลือเฉพาะเล่มที่มีแท็กนั้น
  const tagChip=p.locator('.book-page .tag-filter-chip',{hasText:'แท็กทดสอบ50'}).first();
  check('ชิปตัวกรองแท็กใหม่โผล่ในแถบตัวกรอง',await tagChip.count()>0);
  await tagChip.click(); await p.waitForTimeout(400);
  const filteredTitles=await p.evaluate(()=>[...document.querySelectorAll('.book-page .book-shelf-info .db-tname')].map(el=>el.textContent));
  check('กรองด้วยแท็กแล้วเหลือเฉพาะเล่มที่มีแท็กนั้น',filteredTitles.length===1&&filteredTitles[0].includes('หนังสือทดสอบข้อ 50'),filteredTitles.join(' | '));
  await tagChip.click(); await p.waitForTimeout(300); // กดชิปซ้ำ = ล้างตัวกรองกลับ

  // เดินสถานะ to-read → reading → done ผ่านปุ่มจริง → ต้องตั้ง startedDate/finishedDate อัตโนมัติ (ข้อ 50)
  const startBtn=p.locator('.book-page .db-row',{hasText:'หนังสือทดสอบข้อ 50'}).locator('button',{hasText:'เริ่มอ่าน'}).first();
  if(await startBtn.count()) await startBtn.click(); await p.waitForTimeout(600);
  const finishBtn=p.locator('.book-page .db-row',{hasText:'หนังสือทดสอบข้อ 50'}).locator('button',{hasText:'อ่านจบแล้ว'}).first();
  if(await finishBtn.count()) await finishBtn.click(); await p.waitForTimeout(600);
  const today=new Date().toISOString().slice(0,10);
  const advancedBook=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).bookQueue.find(b=>b.title==='หนังสือทดสอบข้อ 50'));
  check('กด "เริ่มอ่าน"/"อ่านจบแล้ว" แล้วตั้ง startedDate/finishedDate อัตโนมัติ',
    !!advancedBook&&advancedBook.status==='done'&&advancedBook.startedDate===today&&advancedBook.finishedDate===today,
    JSON.stringify(advancedBook&&{status:advancedBook.status,startedDate:advancedBook.startedDate,finishedDate:advancedBook.finishedDate}));

  // การ์ดสถิติการอ่านต้องนับเล่มที่เพิ่งอ่านจบนี้เข้าไปด้วย
  const statsTiles=await p.evaluate(()=>{
    const card=[...document.querySelectorAll('.book-page .db-card')].find(c=>/สถิติการอ่าน/.test(c.textContent||''));
    return card?[...card.querySelectorAll('.db-bignum')].map(t=>({n:t.querySelector('.n')?.textContent.trim(),l:t.querySelector('.l')?.textContent.trim()})):null;
  });
  const monthTile=statsTiles&&statsTiles.find(t=>t.l==='อ่านจบเดือนนี้');
  check('การ์ดสถิติการอ่านนับเล่มที่อ่านจบเดือนนี้ได้ถูกต้อง (≥1)',!!monthTile&&Number(monthTile.n)>=1,JSON.stringify(monthTile));

  // เพิ่มคำคมผ่านฟอร์มแก้ไข แล้วต้องโผล่ในคลังคำคม
  const editForQuote=p.locator('.book-page .book-shelf-item',{hasText:'หนังสือทดสอบข้อ 50'}).locator('.db-chip[title="แก้ไข"]').first();
  await editForQuote.click(); await p.waitForTimeout(700);
  await p.locator('.modal-backdrop textarea[placeholder="พิมพ์คำคมที่ประทับใจ..."]').fill('ประโยคทดสอบคำคม 50');
  await p.locator('.modal-backdrop button',{hasText:'+ เพิ่มคำคม'}).click(); await p.waitForTimeout(300);
  const quoteInFormList=await p.evaluate(()=>!!document.querySelector('.modal-backdrop .quote-item'));
  check('กด "+ เพิ่มคำคม" แล้วคำคมโผล่ในลิสต์ของฟอร์มทันที',quoteInFormList);
  await p.locator('.modal-backdrop .modal-btn-save').click(); await p.waitForTimeout(800);
  const savedQuote=await p.evaluate(()=>{
    const b=JSON.parse(localStorage.getItem('secretary-dashboard-v1')).bookQueue.find(x=>x.title==='หนังสือทดสอบข้อ 50');
    return b&&b.quotes&&b.quotes[0];
  });
  check('บันทึกคำคมลง localStorage จริง',!!savedQuote&&savedQuote.text==='ประโยคทดสอบคำคม 50',JSON.stringify(savedQuote));

  const quotesHead=p.locator('.book-page .db-head',{hasText:'คลังคำคม'}).first();
  await quotesHead.click(); await p.waitForTimeout(400);
  const libraryText=await p.evaluate(()=>{
    const card=[...document.querySelectorAll('.book-page .db-card')].find(c=>/คลังคำคม/.test(c.textContent||''));
    return card?card.textContent:'';
  });
  check('เปิดคลังคำคมแล้วเห็นคำคมที่เพิ่งเพิ่มพร้อมชื่อหนังสือ',/ประโยคทดสอบคำคม 50/.test(libraryText)&&/หนังสือทดสอบข้อ 50/.test(libraryText),libraryText.replace(/\s+/g,' ').slice(0,200));

  const quoteDelBtn=p.locator('.book-page .db-card',{hasText:'คลังคำคม'}).locator('.db-row',{hasText:'ประโยคทดสอบคำคม 50'}).locator('.db-chip[title="ลบ"]').first();
  if(await quoteDelBtn.count()){
    await quoteDelBtn.click(); await p.waitForTimeout(500);
    const afterDelQuote=await p.evaluate(()=>{
      const b=JSON.parse(localStorage.getItem('secretary-dashboard-v1')).bookQueue.find(x=>x.title==='หนังสือทดสอบข้อ 50');
      return b?(b.quotes||[]).length:null;
    });
    check('ลบคำคมจากคลังคำคมได้จริง',afterDelQuote===0,`เหลือ ${afterDelQuote} คำคม`);
  } else check('ลบคำคมจากคลังคำคมได้จริง',false,'ไม่เจอปุ่มลบ');

  console.log('\n[ข้อ 45 v2] แท็บย่อย "Playback" ในหน้า Books (วิดีโอ/พอดแคสต์ — ไม่ใช่เมนูบนแยก ตามที่ ohm ขอ)');
  // อยู่ในหน้า Books อยู่แล้ว (routing ข้อ 5) — สลับแท็บย่อยด้วย .fin-tab-btn เหมือน FinancePage
  await p.locator('.fin-tab-btn:has-text("Playback")').first().click(); await p.waitForTimeout(1500);
  const pb=await p.evaluate(()=>{
    const h=document.querySelector('.playback-page .db-hero-title');
    return {
      page:!!document.querySelector('.playback-page'),
      hero:h?h.textContent.trim():'',
      bignums:document.querySelectorAll('.playback-page .db-hero .db-bignum .n').length, // ข้อ 50: สโคปเฉพาะฮีโร่ เพราะการ์ด "สถิติการดู/ฟัง" ใหม่ก็ใช้ .db-bignum เหมือนกัน
      addBtns:[...document.querySelectorAll('.playback-page button')].filter(b=>/เพิ่มข้อมูล/.test(b.textContent||'')).map(b=>b.textContent.trim()),
      shelfItems:document.querySelectorAll('.playback-page .pb-shelf-item').length, // ข้อ 48: เปลี่ยนจาก db-row เป็นชั้นวาง .pb-shelf-item
    };
  });
  check('แท็บ Playback แสดงฮีโร่ถูกต้อง',pb.page&&/Playback/.test(pb.hero),pb.hero);
  check('ตัวเลขใหญ่สรุป 2 ตัว (วิดีโอ/พอดแคสต์ เท่านั้น ไม่มีหนังสือ)',pb.bignums===2,`${pb.bignums} ตัว`);
  check('ปุ่มเพิ่มข้อมูลเหลือปุ่มเดียว (ข้อ 32/2)',pb.addBtns.length===1,pb.addBtns.join(' | ')||'ไม่เจอปุ่มเลย');
  check('รายการรีวิวจาก seed แสดงเป็นการ์ดในชั้นวาง (ข้อ 48)',pb.shelfItems>=1,`${pb.shelfItems} การ์ด`);
  // ปุ่มเดียว → PlaybackFormModal เปิด แล้วเพิ่มรีวิวใหม่ได้จริง (type เหลือแค่วิดีโอ/พอดแคสต์)
  const pbAddBtn=p.locator('.playback-page .inv-add-btn').first();
  if(await pbAddBtn.count()){
    await pbAddBtn.click(); await p.waitForTimeout(800);
    const typeOptions=await p.evaluate(()=>[...document.querySelectorAll('.modal-backdrop #pb-type-select option')].map(o=>o.value));
    check('ตัวเลือกประเภทเหลือแค่ video/podcast (ไม่มี book)',typeOptions.length===2&&typeOptions.includes('video')&&typeOptions.includes('podcast')&&!typeOptions.includes('book'),typeOptions.join(','));
    const hasModal=await p.evaluate(()=>!!document.querySelector('.modal-backdrop .modal-head'));
    check('ปุ่มเพิ่มข้อมูลเปิด PlaybackFormModal ได้',hasModal);
    if(hasModal){
      await p.locator('.modal-backdrop input').first().fill('เพิ่มรีวิวทดสอบ 45');
      await p.locator('.modal-backdrop .modal-btn-save').click(); await p.waitForTimeout(1000);
      const added=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).mediaReviews.some(r=>r.title==='เพิ่มรีวิวทดสอบ 45'));
      check('เพิ่มรีวิวใหม่จากโมดัลได้จริง',added);
    } else check('เพิ่มรีวิวใหม่จากโมดัลได้จริง',false,'ไม่มีโมดัล');
  } else { check('ตัวเลือกประเภทเหลือแค่ video/podcast (ไม่มี book)',false); check('ปุ่มเพิ่มข้อมูลเปิด PlaybackFormModal ได้',false,'ไม่เจอปุ่ม'); }
  // ปุ่มแก้ไข → โมดัลเดิมพร้อมค่าเก่า
  const pbEdit=p.locator('.playback-page .db-chip[title="แก้ไข"]').first();
  if(await pbEdit.count()){
    await pbEdit.click(); await p.waitForTimeout(800);
    const ed=await p.evaluate(()=>{
      const m=document.querySelector('.modal-backdrop .modal');
      return m?{head:m.querySelector('.modal-head span')?.textContent.trim(),title:m.querySelector('input')?.value}:null;
    });
    check('ปุ่มแก้ไขเปิดโมดัลพร้อมค่าเดิม (Playback)',!!ed&&/แก้ไข/.test(ed.head||'')&&!!ed.title,ed?`${ed.head} · ${ed.title}`:'');
    await p.locator('.modal-close').first().click().catch(()=>{}); await p.waitForTimeout(500);
  } else check('ปุ่มแก้ไขเปิดโมดัลพร้อมค่าเดิม (Playback)',false,'ไม่เจอปุ่มแก้ไข');
  // ข้อ 45/3: อัปโหลดปกวิดีโอ/พอดแคสต์เอง (ไม่มี auto-fetch) — เปิดแก้ไข ใส่รูปเทส เช็ค preview + บันทึกลง localStorage จริง
  const pbEditForCover=p.locator('.playback-page .db-chip[title="แก้ไข"]').first();
  if(await pbEditForCover.count()){
    await pbEditForCover.click(); await p.waitForTimeout(800);
    const TEST_PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
    await p.locator('.modal-backdrop input[type="file"]').setInputFiles({name:'cover.png',mimeType:'image/png',buffer:TEST_PNG});
    await p.waitForTimeout(600);
    const hasPreview=await p.evaluate(()=>{
      const img=document.querySelector('.modal-backdrop .pb-cover-picker-preview img');
      return !!img&&img.src.startsWith('data:image');
    });
    check('อัปโหลดปกวิดีโอ/พอดแคสต์แล้วขึ้น preview ทันที',hasPreview,hasPreview?'มี preview data:image':'ไม่มี');
    await p.locator('.modal-backdrop .modal-btn-save').click(); await p.waitForTimeout(1000);
    const savedReview=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).mediaReviews.find(r=>typeof r.coverUrl==='string'&&r.coverUrl.startsWith('data:image')));
    check('บันทึกปกที่อัปโหลดเองลง localStorage จริง',!!savedReview,savedReview?`coverUrl เริ่มด้วย ${(savedReview.coverUrl||'').slice(0,20)}...`:'ไม่เจอ');
    const thumbShows=await p.evaluate(()=>!!document.querySelector('.playback-page .pb-shelf-cover img'));
    check('ชั้นรายการ Playback โชว์รูปปกที่อัปโหลด',thumbShows);
  } else { check('อัปโหลดปกวิดีโอ/พอดแคสต์แล้วขึ้น preview ทันที',false,'ไม่เจอปุ่มแก้ไข'); check('บันทึกปกที่อัปโหลดเองลง localStorage จริง',false); check('ชั้นรายการ Playback โชว์รูปปกที่อัปโหลด',false); }
  // ลบรีวิวออกจากรายการ → หายจริงใน localStorage
  const beforeDelRv=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).mediaReviews.length);
  const pbDel=p.locator('.playback-page .db-chip[title="ลบ"]').first();
  if(await pbDel.count()){
    await pbDel.click(); await p.waitForTimeout(1000);
    const afterDelRv=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).mediaReviews.length);
    check('ลบรีวิวออกจากรายการได้จริง',afterDelRv===beforeDelRv-1,`${beforeDelRv} → ${afterDelRv}`);
  } else check('ลบรีวิวออกจากรายการได้จริง',false,'ไม่เจอปุ่มลบ');

  console.log('\n[ข้อ 48] ชั้นวาง Playback แบบโฟลเดอร์ (ช่อง/เพลย์ลิสต์) — ตามที่ ohm ขอให้ทำเหมือน shelf หนังสือ');
  // เพิ่ม 2 ตอนที่กรอกชื่อ "ช่อง/เพลย์ลิสต์" ตรงกัน → ต้องถูกรวมเป็นการ์ดโฟลเดอร์ใบเดียวในชั้นวาง
  // ข้อ 49: เลือกช่องผ่าน dropdown #pb-channel-select — ถ้ายังไม่มีตัวเลือกนี้ ใช้ "+ สร้างช่องใหม่..." แล้วพิมพ์ชื่อ, ถ้ามีแล้วเลือกจากลิสต์ตรงๆ
  const addPbWithChannel=async(title,channel)=>{
    await p.locator('.playback-page .inv-add-btn').first().click(); await p.waitForTimeout(600);
    await p.locator('.modal-backdrop input').first().fill(title);
    const select=p.locator('.modal-backdrop #pb-channel-select');
    const hasOption=await select.locator(`option[value="${channel}"]`).count();
    if(hasOption) await select.selectOption(channel);
    else {
      await select.selectOption('__new__');
      await p.locator('.modal-backdrop input[placeholder="ตั้งชื่อช่อง/เพลย์ลิสต์ใหม่"]').fill(channel);
    }
    await p.locator('.modal-backdrop .modal-btn-save').click(); await p.waitForTimeout(800);
  };
  await addPbWithChannel('EP.10 ทดสอบ A','ช่องทดสอบ 48');
  await addPbWithChannel('EP.11 ทดสอบ B','ช่องทดสอบ 48');
  const afterAddChannel=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).mediaReviews.filter(r=>r.channel==='ช่องทดสอบ 48').length);
  check('เพิ่มรายการพร้อมกรอกช่อง/เพลย์ลิสต์ได้จริง (2 ตอน)',afterAddChannel===2,`${afterAddChannel} ตอน`);

  const folderState=await p.evaluate(()=>{
    const cards=[...document.querySelectorAll('.playback-page .pb-shelf-item.pb-folder')];
    const card=cards.find(c=>/ช่องทดสอบ 48/.test(c.textContent||''));
    return card?{found:true,badge:card.querySelector('.pb-folder-badge')?.textContent.trim()}:{found:false};
  });
  check('การ์ดโฟลเดอร์ปรากฏในชั้นวางเมื่อชื่อช่องตรงกัน',folderState.found,JSON.stringify(folderState));
  check('การ์ดโฟลเดอร์แสดง badge จำนวนตอนถูกต้อง (2)',folderState.badge==='2',folderState.badge||'ไม่มี badge');

  // กดการ์ดโฟลเดอร์ → ต้องขยายลงมาเป็นแผง .pb-folder-panel แสดงครบ 2 แถว (ข้อ 48: ขยายในหน้าเดิม ไม่เปิด modal)
  const folderCard=p.locator('.playback-page .pb-shelf-item.pb-folder',{hasText:'ช่องทดสอบ 48'}).first();
  await folderCard.click(); await p.waitForTimeout(600);
  const panelRows=await p.evaluate(()=>{
    const panel=[...document.querySelectorAll('.pb-folder-panel')].find(x=>/ช่องทดสอบ 48/.test(x.textContent||''));
    return panel?panel.querySelectorAll('.db-row').length:0;
  });
  check('กดการ์ดโฟลเดอร์แล้วขยายลงมาแสดงรายการครบ 2 ตอน',panelRows===2,`${panelRows} แถว`);

  // ปุ่ม "เพิ่มตอนในช่องนี้" ในแผงที่ขยาย ต้อง prefill ชื่อช่องให้อัตโนมัติ (ข้อ 49: prefill เป็นค่าที่เลือกไว้ใน dropdown)
  const addInPanel=p.locator('.pb-folder-panel',{hasText:'ช่องทดสอบ 48'}).locator('button',{hasText:'เพิ่มตอนในช่องนี้'}).first();
  if(await addInPanel.count()){
    await addInPanel.click(); await p.waitForTimeout(600);
    const prefilled=await p.evaluate(()=>document.querySelector('.modal-backdrop #pb-channel-select')?.value||'');
    check('ปุ่ม "เพิ่มตอนในช่องนี้" ตั้งชื่อช่องให้อัตโนมัติ',prefilled==='ช่องทดสอบ 48',prefilled||'ว่างเปล่า');
    await p.locator('.modal-close').first().click().catch(()=>{}); await p.waitForTimeout(400);
  } else check('ปุ่ม "เพิ่มตอนในช่องนี้" ตั้งชื่อช่องให้อัตโนมัติ',false,'ไม่เจอปุ่ม');

  // รายการที่ไม่มีช่อง (เพิ่มรีวิวทดสอบ 45 จากรอบก่อนหน้า) ต้องยังเป็นการ์ดเดี่ยว ไม่ถูกจัดเข้าโฟลเดอร์ไหน
  const standaloneTexts=await p.evaluate(()=>[...document.querySelectorAll('.playback-page .pb-shelf-item:not(.pb-folder)')].map(x=>x.textContent));
  const standaloneOk=standaloneTexts.some(t=>/รีวิวทดสอบ/.test(t||''));
  check('รายการที่ไม่มีช่อง/เพลย์ลิสต์ยังแสดงเป็นการ์ดเดี่ยวตามปกติ',standaloneOk,`${standaloneTexts.length} การ์ดเดี่ยว`);

  console.log('\n[ข้อ 49] ช่อง/เพลย์ลิสต์เปลี่ยนเป็น dropdown บังคับเลือก กันพิมพ์ชื่อเพี้ยนแล้วแยกกลุ่มโดยไม่ตั้งใจ');
  // dropdown ต้องมีตัวเลือก "ช่องทดสอบ 48" ที่เพิ่งสร้างไว้แล้ว ให้เลือกได้ตรงๆ ไม่ต้องพิมพ์ใหม่
  await p.locator('.playback-page .inv-add-btn').first().click(); await p.waitForTimeout(600);
  const channelSelectOptions=await p.evaluate(()=>[...document.querySelectorAll('.modal-backdrop #pb-channel-select option')].map(o=>o.value));
  check('dropdown ช่อง/เพลย์ลิสต์มีตัวเลือกช่องที่เคยสร้างไว้ + ตัวเลือก "สร้างใหม่"',
    channelSelectOptions.includes('ช่องทดสอบ 48')&&channelSelectOptions.includes('__new__')&&channelSelectOptions.includes(''),
    channelSelectOptions.join(' | '));
  await p.locator('.modal-backdrop #pb-channel-select').selectOption('ช่องทดสอบ 48');
  const noFreeTextAfterSelect=await p.evaluate(()=>!document.querySelector('.modal-backdrop input[placeholder="ตั้งชื่อช่อง/เพลย์ลิสต์ใหม่"]'));
  check('เลือกช่องที่มีอยู่แล้วจาก dropdown ไม่เด้งช่องพิมพ์ข้อความใหม่ขึ้นมา',noFreeTextAfterSelect);
  await p.locator('.modal-backdrop input').first().fill('EP.12 ทดสอบเลือกจาก dropdown');
  await p.locator('.modal-backdrop .modal-btn-save').click(); await p.waitForTimeout(800);
  const groupAfterDropdownPick=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).mediaReviews.filter(r=>r.channel==='ช่องทดสอบ 48').length);
  check('บันทึกรายการที่เลือกช่องจาก dropdown แล้วเข้ากลุ่มเดียวกันจริง (3 ตอน)',groupAfterDropdownPick===3,`${groupAfterDropdownPick} ตอน`);

  // กด "+ สร้างช่องใหม่..." ต้องโชว์ช่องพิมพ์ข้อความ พิมพ์ชื่อใหม่แล้วกด "ยกเลิก" ต้องกลับเป็น dropdown + ค่าว่าง
  await p.locator('.playback-page .inv-add-btn').first().click(); await p.waitForTimeout(600);
  await p.locator('.modal-backdrop #pb-channel-select').selectOption('__new__');
  const newModeShown=await p.evaluate(()=>!!document.querySelector('.modal-backdrop input[placeholder="ตั้งชื่อช่อง/เพลย์ลิสต์ใหม่"]'));
  check('เลือก "+ สร้างช่องใหม่..." แล้วโชว์ช่องพิมพ์ข้อความ',newModeShown);
  await p.locator('.modal-backdrop input[placeholder="ตั้งชื่อช่อง/เพลย์ลิสต์ใหม่"]').fill('ช่องทดสอบ 49 ใหม่');
  await p.locator('.modal-backdrop .pb-channel-new-cancel').click(); await p.waitForTimeout(300);
  const backToSelect=await p.evaluate(()=>{
    const sel=document.querySelector('.modal-backdrop #pb-channel-select');
    return {shown:!!sel,value:sel?sel.value:null,freeTextGone:!document.querySelector('.modal-backdrop input[placeholder="ตั้งชื่อช่อง/เพลย์ลิสต์ใหม่"]')};
  });
  check('กด "ยกเลิก" ตอนสร้างช่องใหม่แล้วกลับเป็น dropdown ค่าว่าง',backToSelect.shown&&backToSelect.value===''&&backToSelect.freeTextGone,JSON.stringify(backToSelect));
  await p.locator('.modal-close').first().click().catch(()=>{}); await p.waitForTimeout(400);

  console.log('\n[ข้อ 50 - Playback] แท็ก/ตัวกรอง (ประเภท+แท็ก) + สถิติการดู/ฟัง + คำคม');
  // เพิ่มรีวิวใหม่พร้อมแท็ก
  await p.locator('.playback-page .inv-add-btn').first().click(); await p.waitForTimeout(600);
  await p.locator('.modal-backdrop input').first().fill('รีวิวทดสอบข้อ 50');
  await p.locator('.modal-backdrop input[placeholder="เช่น ธุรกิจ, แรงบันดาลใจ"]').fill('แท็กพีบี50');
  await p.locator('.modal-backdrop .modal-btn-save').click(); await p.waitForTimeout(800);
  const savedPbTags=await p.evaluate(()=>JSON.parse(localStorage.getItem('secretary-dashboard-v1')).mediaReviews.find(r=>r.title==='รีวิวทดสอบข้อ 50')?.tags);
  check('เพิ่มรีวิวพร้อมแท็กบันทึกเป็น array ถูกต้อง',Array.isArray(savedPbTags)&&savedPbTags.includes('แท็กพีบี50'),JSON.stringify(savedPbTags));

  // ตัวกรองแท็ก
  const pbTagChip=p.locator('.playback-page .tag-filter-chip',{hasText:'แท็กพีบี50'}).first();
  check('ชิปตัวกรองแท็กใหม่โผล่ในแถบตัวกรอง Playback',await pbTagChip.count()>0);
  await pbTagChip.click(); await p.waitForTimeout(400);
  const pbFilteredTitles=await p.evaluate(()=>[...document.querySelectorAll('.playback-page .pb-shelf-item .db-tname')].map(el=>el.textContent));
  check('กรองด้วยแท็กแล้วเหลือเฉพาะรีวิวที่มีแท็กนั้น',pbFilteredTitles.length===1&&pbFilteredTitles[0].includes('รีวิวทดสอบข้อ 50'),pbFilteredTitles.join(' | '));
  await pbTagChip.click(); await p.waitForTimeout(300);

  // ตัวกรองประเภท: เพิ่มรีวิวใหม่ประเภทพอดแคสต์ แล้วกรอง "วิดีโอ" ต้องไม่เห็นตัวใหม่นี้
  await p.locator('.playback-page .inv-add-btn').first().click(); await p.waitForTimeout(600);
  await p.locator('.modal-backdrop input').first().fill('พอดแคสต์ทดสอบข้อ 50');
  await p.locator('.modal-backdrop #pb-type-select').selectOption('podcast');
  await p.locator('.modal-backdrop .modal-btn-save').click(); await p.waitForTimeout(800);
  await p.locator('.playback-page .tag-filter-chip',{hasText:'วิดีโอ'}).first().click(); await p.waitForTimeout(400);
  const videoOnlyTitles=await p.evaluate(()=>[...document.querySelectorAll('.playback-page .pb-shelf-item .db-tname')].map(el=>el.textContent));
  check('ตัวกรองประเภท "วิดีโอ" ซ่อนรายการพอดแคสต์ที่เพิ่งเพิ่ม',!videoOnlyTitles.some(t=>t.includes('พอดแคสต์ทดสอบข้อ 50')),videoOnlyTitles.join(' | '));
  await p.locator('.playback-page .tag-filter-chip',{hasText:'ทั้งหมด'}).first().click(); await p.waitForTimeout(300);

  // คำคมสำหรับ Playback
  const pbEditForQuote=p.locator('.playback-page .pb-shelf-item',{hasText:'รีวิวทดสอบข้อ 50'}).locator('.db-chip[title="แก้ไข"]').first();
  await pbEditForQuote.click(); await p.waitForTimeout(700);
  await p.locator('.modal-backdrop textarea[placeholder="พิมพ์คำคมที่ประทับใจ..."]').fill('คำคมทดสอบ Playback 50');
  await p.locator('.modal-backdrop button',{hasText:'+ เพิ่มคำคม'}).click(); await p.waitForTimeout(300);
  await p.locator('.modal-backdrop .modal-btn-save').click(); await p.waitForTimeout(800);
  const pbSavedQuote=await p.evaluate(()=>{
    const r=JSON.parse(localStorage.getItem('secretary-dashboard-v1')).mediaReviews.find(x=>x.title==='รีวิวทดสอบข้อ 50');
    return r&&r.quotes&&r.quotes[0];
  });
  check('บันทึกคำคมของ Playback ลง localStorage จริง',!!pbSavedQuote&&pbSavedQuote.text==='คำคมทดสอบ Playback 50',JSON.stringify(pbSavedQuote));

  const pbQuotesHead=p.locator('.playback-page .db-head',{hasText:'คลังคำคม'}).first();
  await pbQuotesHead.click(); await p.waitForTimeout(400);
  const pbLibraryText=await p.evaluate(()=>{
    const card=[...document.querySelectorAll('.playback-page .db-card')].find(c=>/คลังคำคม/.test(c.textContent||''));
    return card?card.textContent:'';
  });
  check('เปิดคลังคำคม Playback แล้วเห็นคำคมที่เพิ่งเพิ่ม',/คำคมทดสอบ Playback 50/.test(pbLibraryText)&&/รีวิวทดสอบข้อ 50/.test(pbLibraryText),pbLibraryText.replace(/\s+/g,' ').slice(0,200));

  const pbStatsTiles=await p.evaluate(()=>{
    const card=[...document.querySelectorAll('.playback-page .db-card')].find(c=>/สถิติการดู\/ฟัง/.test(c.textContent||''));
    return card?[...card.querySelectorAll('.db-bignum')].map(t=>({n:t.querySelector('.n')?.textContent.trim(),l:t.querySelector('.l')?.textContent.trim()})):null;
  });
  const pbMonthTile=pbStatsTiles&&pbStatsTiles.find(t=>t.l==='รีวิวเดือนนี้');
  check('การ์ดสถิติการดู/ฟังนับรีวิวเดือนนี้ได้ถูกต้อง (≥1)',!!pbMonthTile&&Number(pbMonthTile.n)>=1,JSON.stringify(pbMonthTile));

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
  /* ข้อ 56 ขั้นที่ 2: มือถือไม่มีแถบล่างแล้ว — เปลี่ยนหน้าผ่านเมนู Jack (กดหัว → เลือกหน้า) */
  const mobileGo=async(label)=>{ await p.locator('.brand-trigger').click(); await p.waitForTimeout(450); await p.locator(`.jm-item:has-text("${label}")`).click(); await p.waitForTimeout(500); };
  await mobileGo('Finance'); await p.waitForTimeout(1200);
  for(const t of ['Overview','Review','Investments','Debts']){
    await p.locator(`button:has-text("${t}")`).first().click().catch(()=>{});
    await p.waitForTimeout(1500);
    const o=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:window.innerWidth}));
    check(`มือถือ · แท็บ ${t} ไม่ล้นแนวนอน`,o.sw<=o.iw+2,`scrollWidth ${o.sw} vs ${o.iw}`);
  }
  await mobileGo('Tracker'); await p.waitForTimeout(1600);
  const mTrk=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:window.innerWidth}));
  check('มือถือ · หน้า Tracker ไม่ล้นแนวนอน',mTrk.sw<=mTrk.iw+2,`scrollWidth ${mTrk.sw} vs ${mTrk.iw}`);
  await p.locator('.prj-card').first().click().catch(()=>{}); await p.waitForTimeout(1600);
  const mDet=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:window.innerWidth}));
  check('มือถือ · หน้ารายละเอียดโปรเจกต์ไม่ล้นแนวนอน',mDet.sw<=mDet.iw+2,`scrollWidth ${mDet.sw} vs ${mDet.iw}`);

  console.log('\n[ข้อ 56 ขั้นที่ 3] การ์ด "วันนี้" จัดกลุ่มตาม target + หลุดจังหวะ');
  await mobileGo('Home'); await p.waitForTimeout(800);
  const td=await p.evaluate(()=>{
    const c=document.querySelector('.db-feature'); if(!c) return null;
    const groups=[...c.querySelectorAll('.td-group')].map(g=>({name:g.querySelector('.td-gname').textContent,items:[...g.querySelectorAll('.db-tname')].map(x=>x.textContent),left:g.querySelector('.td-gleft').textContent}));
    const off=[...c.querySelectorAll('.td-off-row')].map(r=>r.innerText.replace(/\s+/g,' ').trim());
    return {title:c.querySelector('.db-title').textContent,groups,off,count:c.querySelector('.db-count').innerText,sw:document.documentElement.scrollWidth,iw:window.innerWidth,
      subs:[...c.querySelectorAll('.db-tsub')].map(x=>x.textContent)};
  });
  check('การ์ด "วันนี้": หัวการ์ดชื่อ วันนี้',td&&td.title==='วันนี้',JSON.stringify(td&&td.title));
  const gn=td?td.groups.map(g=>g.name):[];
  check('การ์ด "วันนี้": จัดกลุ่มตาม target (โปรเจกต์ก่อน · "ไม่มี target" ท้ายสุด)',gn.includes('โปรเจกต์กำหนดเอง')&&gn.includes('โปรเจกต์แบบงาน')&&gn[gn.length-1]==='ไม่มี target'&&td.groups.find(g=>g.name==='โปรเจกต์กำหนดเอง').items.includes('ฝึกทุกวัน')&&td.groups.find(g=>g.name==='ไม่มี target').items.includes('งานประจำวัน')&&td.groups.find(g=>g.name==='โปรเจกต์แบบงาน').items.includes('งานยังไม่เสร็จ')&&!JSON.stringify(td.groups).includes('งานเสร็จแล้ว'),JSON.stringify(td&&td.groups));
  check('การ์ด "วันนี้": เตือนหลุดจังหวะ (งานประจำที่มี createdAt แต่ไม่เคยทำ) · งานเก่าไม่มี createdAt ไม่เตือน',td&&td.off.length===1&&/โปรเจกต์กำหนดเอง/.test(td.off[0])&&/ฝึกทุกวัน/.test(td.off[0])&&/ไม่ได้ทำมา \d+ วัน/.test(td.off[0])&&!td.off.some(x=>/งานประจำวัน/.test(x)),JSON.stringify(td&&td.off));
  check('การ์ด "วันนี้": งานเลยกำหนดบอกวันที่ · งานประจำบอกความถี่ · มือถือไม่ล้น',td&&td.subs.some(x=>/^เลยกำหนด/.test(x))&&td.subs.some(x=>/^ทุกวัน/.test(x))&&td.sw<=td.iw+2,JSON.stringify(td&&[td.subs,td.sw]));
  const beforeLeft=td.groups.find(g=>g.name==='โปรเจกต์กำหนดเอง').left;
  await p.evaluate(()=>{ const row=[...document.querySelectorAll('.db-feature .db-trow')].find(r=>r.querySelector('.db-tname').textContent==='ฝึกทุกวัน'); row.querySelector('.db-tcheck').click(); });
  await p.waitForTimeout(700);
  const td2=await p.evaluate(()=>{ const c=document.querySelector('.db-feature'); const g=[...c.querySelectorAll('.td-group')].find(g=>g.querySelector('.td-gname').textContent==='โปรเจกต์กำหนดเอง'); const row=[...g.querySelectorAll('.db-trow')].find(r=>r.querySelector('.db-tname').textContent==='ฝึกทุกวัน');
    return {left:g.querySelector('.td-gleft').textContent,done:row.classList.contains('done'),off:c.querySelectorAll('.td-off-row').length,saved:(()=>{try{const d=JSON.parse(localStorage.getItem('secretaryData')||'null');return d&&(d.tasks||[]).find(t=>t.id==='t4');}catch(e){return 'x';}})()}; });
  check('การ์ด "วันนี้": แตะติ๊ก → เสร็จ + ตัวนับกลุ่มเปลี่ยน (ติ๊กวันนี้ไม่ลบว่าพลาดวันก่อนๆ)',td2.done&&td2.left!==beforeLeft&&td2.off===1,JSON.stringify([beforeLeft,td2.left,td2.done,td2.off]));
  await p.evaluate(()=>{ const row=[...document.querySelectorAll('.db-feature .db-trow')].find(r=>r.querySelector('.db-tname').textContent==='ฝึกทุกวัน'); row.querySelector('.db-tcheck').click(); });
  await p.waitForTimeout(500);

  console.log('\n[ข้อ 56 ขั้นที่ 4] XP / Level 3 ด้าน');
  await mobileGo('Home'); await p.waitForTimeout(800);
  const lvRead=()=>p.evaluate(()=>[...document.querySelectorAll('.xp-card .xp-row')].map(r=>({side:r.querySelector('.xp-side').textContent,lv:r.querySelector('.xp-lv').textContent,sub:r.querySelector('.xp-sub').textContent,week:(r.querySelector('.xp-week')||{}).textContent||""})));
  const lv0=await lvRead();
  /* xp.start = วันที่เทสต์รัน → ของที่เทสต์ก่อนหน้าทำ "วันนี้" (หนังสือจบ/รีวิว/Journal/งาน) ได้ XP จริง · ของใน seed ที่ลงวันที่ก่อนหน้าไม่ได้ */
  const num=(x)=>{const m=x.sub.match(/^([\d,]+) \/ ([\d,]+)/);return [Number(x.lv.replace(/\D/g,'')),Number(m[1].replace(/,/g,''))];};
  check('Level: การ์ด 3 ด้าน Wealth/Health/Growth · Wealth/Health เริ่ม 0 (seed เก่าไม่ backfill)',lv0.length===3&&lv0.map(x=>x.side).join()==='Wealth,Health,Growth'&&lv0[0].sub.startsWith('0 / 100')&&lv0[1].sub.startsWith('0 / 100'),JSON.stringify(lv0));
  const chip=await p.evaluate(()=>{ const row=[...document.querySelectorAll('.db-feature .db-trow')].find(r=>r.querySelector('.db-tname').textContent==='งานประจำวัน'); return row&&(row.querySelector('.td-xp')||{}).textContent; });
  check('การ์ดวันนี้: งานที่ยังไม่ติ๊กบอก +XP',chip==='+5',String(chip));
  await p.evaluate(()=>{ const row=[...document.querySelectorAll('.db-feature .db-trow')].find(r=>r.querySelector('.db-tname').textContent==='งานประจำวัน'); row.querySelector('.db-tcheck').click(); });
  await p.waitForTimeout(700);
  const lv1=await lvRead();
  const toastTxt=await p.evaluate(()=>[...document.querySelectorAll('.xp-toast .ms-toast-title')].map(x=>x.textContent));
  check('ติ๊กงานประจำ (ไม่มี target) → Growth +5 · สัปดาห์นี้ +5 · toast +5 XP',num(lv1[2])[1]===num(lv0[2])[1]+5&&num(lv1[2])[0]===num(lv0[2])[0]&&Number(lv1[2].week)===Number(lv0[2].week||0)+5&&lv1[0].sub.startsWith('0 /')&&toastTxt.some(t=>t==='+5 XP · Growth'),JSON.stringify([lv1,toastTxt]));
  await p.evaluate(()=>{ const row=[...document.querySelectorAll('.db-feature .db-trow')].find(r=>r.querySelector('.db-tname').textContent==='งานประจำวัน'); row.querySelector('.db-tcheck').click(); });
  await p.waitForTimeout(700);
  const lv2=await lvRead();
  check('ยกเลิกติ๊ก → XP หักคืน (กลับเท่าเดิม)',lv2[2].sub===lv0[2].sub&&lv2[2].week===lv0[2].week,JSON.stringify([lv0[2],lv2[2]]));
  await p.locator('.xp-card .db-chip').click(); await p.waitForTimeout(600);
  const md=await p.evaluate(()=>({open:!!document.querySelector('.xp-modal'),badges:document.querySelectorAll('.xp-badge').length,got:document.querySelectorAll('.xp-badge.got').length,rules:!!document.querySelector('.xp-rules'),start:document.querySelector('.xp-modal').innerText.includes('เริ่มนับ'),sw:document.documentElement.scrollWidth,iw:window.innerWidth}));
  check('หน้าต่างประวัติ XP: เหรียญ 9 อัน + กติกา + วันเริ่มนับ · มือถือไม่ล้น',md.open&&md.badges===9&&md.got>=1&&md.rules&&md.start&&md.sw<=md.iw+2,JSON.stringify(md));
  await p.locator('.xp-modal .modal-close').click(); await p.waitForTimeout(300);
  const U=await p.evaluate(()=>{
    const T=todayISO(), d=(n)=>shiftISO(T,{d:n}), out={};
    const L=(n)=>{const x=xpLevel(n);return [x.level,x.into,x.need];};
    out.levels=[L(0),L(99),L(100),L(299),L(300),L(600),L(1000)];
    const base={xp:{start:d(-20)},projects:[{id:"pf",title:"เงิน",category:"finance",milestones:[{id:"a",pct:25,reachedAt:d(-3)},{id:"b",pct:50,reachedAt:d(-40)}],xpDoneAt:d(-1)},{id:"ph",title:"ร่างกาย",category:"health",xpDoneAt:"before"}],
      tasks:[],bookQueue:[],mediaReviews:[],journal:[],finance:{income:[],expenses:[],investments:[]},reviews:{}};
    const comp={}; for(let i=-10;i<=0;i++) if(i!==-2) comp[d(i)]=true;                // ขาด d(-2) → ช่วงติด 7 วัน = d(-1)..d(-7)? ไม่ถึง / d(-10..-3)=8 วัน ได้โบนัส 1
    base.tasks=[{id:"r",projectId:"ph",title:"วิ่ง",recurrence:"daily",completions:{...comp,[d(-30)]:true}},
      {id:"o1",projectId:"pf",title:"จ่ายหนี้",recurrence:"none",status:"done",completedAt:new Date(d(-1)+"T10:00:00").toISOString()},
      {id:"o2",projectId:null,title:"เก่า",recurrence:"none",status:"done",completedAt:new Date(d(-25)+"T10:00:00").toISOString()},
      {id:"o3",projectId:null,title:"ไม่เสร็จ",recurrence:"none",status:"pending"}];
    base.bookQueue=[{id:"b1",title:"A",status:"done",finishedDate:d(-5),rating:8,reviewText:"1\n2\n3"},{id:"b2",title:"B",status:"done",finishedDate:d(-4),rating:8,reviewText:"สั้น"},
      {id:"b3",title:"C",status:"done",finishedDate:d(-4),rating:0,quotes:[{id:"q"}]},{id:"b4",title:"D",status:"done",finishedDate:d(-4),rating:7,reviewText:"x",quotes:[{id:"q"}]},{id:"b5",title:"E",status:"done",finishedDate:d(-60),rating:9,reviewText:"1\n2\n3"},{id:"b6",title:"F",status:"reading",finishedDate:d(-1)}];
    base.mediaReviews=[1,2,3].map(i=>({id:"m"+i,title:"ep"+i,type:"podcast",reviewText:"ดี",date:d(-2)})).concat([{id:"m4",title:"ไม่มีรีวิว",type:"video",reviewText:"",date:d(-1)},{id:"m5",title:"อนาคต",type:"video",reviewText:"x",date:d(3)}]);
    base.journal=[{date:d(-1),entry:"x"},{date:d(-1),entry:"ซ้ำวันเดิม"},{date:d(-2),entry:"  "},{date:d(-2),mood:3},{date:d(-3),parts:{lesson:"กรอกแค่หัวข้อ"}},{date:d(-30),entry:"เก่า"}];
    const X=computeXP(base,T);
    const by=(src)=>X.events.filter(e=>e.src===src);
    out.routine=by("routine").length; out.streak=by("streak").map(e=>e.date); out.task=by("task").map(e=>e.side+":"+e.pts);
    out.ms=by("milestone").map(e=>e.side); out.proj=by("project").map(e=>e.side);
    out.book=by("book").length; out.sum=by("bookSummary").map(e=>e.label).sort();
    out.media=by("media").length; out.journal=by("journal").length;
    out.sides=X.sides.map(s=>[s.key,s.total]);
    const sumSide=(k)=>X.events.filter(e=>e.side===k).reduce((a,e)=>a+e.pts,0);
    out.consistent=X.sides.every(s=>s.total===sumSide(s.key));
    out.badges=X.badges.filter(b=>b.got).map(b=>b.key);
    // Wealth รายเดือน
    const cm=T.slice(0,7), m1=shiftISO(cm+"-01",{m:-1}).slice(0,7), m2=shiftISO(cm+"-01",{m:-2}).slice(0,7);
    const W={xp:{start:m2+"-01",savingRateTarget:20,snapshots:{[m2]:{nw:100000,debt:50000},[m1]:{nw:120000,debt:40000},[cm]:{nw:90000,debt:45000}}},projects:[],tasks:[],
      finance:{income:[{id:"i",date:m1+"-25",month:m1,amount:30000}],expenses:[{id:"e",date:m1+"-05",amount:-20000,category:"อาหาร"}],investments:[{id:"v",date:m1+"-25",amount:3000,type:"retirement"}]},
      reviews:{[m1]:{rating:4,updatedAt:new Date(m1+"-28T09:00:00").toISOString()}}};
    const XW=computeXP(W,T);
    out.wealth=XW.events.filter(e=>e.src==="wealth").map(e=>e.m+"|"+e.label.split(" ")[0]).sort();
    out.w4=XW.badges.find(b=>b.key==="wealth4").got;
    W.xp.savingRateTarget=40; out.wealthHi=computeXP(W,T).events.filter(e=>e.src==="wealth").length;
    // syncXpMeta: เปิดระบบครั้งแรก → start=วันนี้, โปรเจกต์ที่ครบแล้ว = before · ครั้งถัดไปครบ = วันนี้ · ลดลง = ลบ
    const S0={projects:[{id:"p",title:"x",measureType:"manual",manualValue:100,category:"personal"},{id:"q",title:"y",measureType:"manual",manualValue:50}],tasks:[],finance:{debts:[],cashAccounts:[{balance:1000}],investmentValues:{},cryptoHoldings:[],fxRate:{}}};
    const s1=syncXpMeta(S0,T);
    out.sync1=[s1.xp.start,s1.projects[0].xpDoneAt,s1.projects[1].xpDoneAt,JSON.stringify(s1.xp.snapshots)];
    const S1={...S0,xp:s1.xp,projects:[s1.projects[0],{...s1.projects[1],manualValue:100}]};
    const s2=syncXpMeta(S1,T); out.sync2=s2.projects[1].xpDoneAt;
    const s3=syncXpMeta({...S1,projects:s2.projects},T); out.sync3=s3;             // ไม่มีอะไรเปลี่ยน = null (กัน persist วน)
    const s4=syncXpMeta({...S1,projects:[s2.projects[0],{...s2.projects[1],manualValue:80}]},T); out.sync4="xpDoneAt" in s4.projects[1];
    return out;
  });
  check('XP: สูตรเลเวล 100 × เลเวลปัจจุบัน',JSON.stringify(U.levels)===JSON.stringify([[1,0,100],[1,99,100],[2,0,200],[2,199,200],[3,0,300],[4,0,400],[5,0,500]]),JSON.stringify(U.levels));
  check('XP: งานประจำนับเฉพาะหลังวันเริ่ม (10 วัน) · โบนัส 7 วันติดได้ครั้งเดียวต่อช่วง',U.routine===10&&U.streak.length===1,JSON.stringify([U.routine,U.streak]));
  check('XP: งานครั้งเดียว +10 ตามหมวด (การเงิน→wealth) · เสร็จก่อนเริ่ม/ยังไม่เสร็จไม่นับ',JSON.stringify(U.task)==='["wealth:10"]',JSON.stringify(U.task));
  check('XP: หมุด +50 เฉพาะที่ถึงหลังเริ่ม · ปิดโปรเจกต์ +150 ("before" ไม่นับ)',JSON.stringify(U.ms)==='["wealth"]'&&JSON.stringify(U.proj)==='["wealth"]',JSON.stringify([U.ms,U.proj]));
  check('XP: หนังสือจบ +30 (จบก่อนเริ่มไม่นับ) · สรุป = ดาว + (รีวิว ≥3 บรรทัด หรือคำคม)',U.book===4&&JSON.stringify(U.sum)==='["สรุปหนังสือ · A","สรุปหนังสือ · D"]',JSON.stringify([U.book,U.sum]));
  check('XP: รีวิววิดีโอ/พอดแคสต์ ≤2/วัน · ต้องมีรีวิว · อนาคตไม่นับ · Journal 5/วัน (ว่าง/มีแต่อารมณ์ไม่นับ · กรอกแค่หัวข้อนับ)',U.media===2&&U.journal===2,JSON.stringify([U.media,U.journal]));
  check('XP: ผลรวมแต่ละด้านตรงกับประวัติ · ได้เหรียญก้าวแรก/ติดกัน/ปิดจ๊อบ/นักสรุป',U.consistent&&['first','streak','project','book'].every(k=>U.badges.includes(k)),JSON.stringify([U.sides,U.badges]));
  check('XP Wealth รายเดือน: ออมถึงเป้า + net worth เพิ่ม + หนี้ลด (เดือนที่ปิดแล้ว) + รีวิวเดือน · เดือนนี้ที่ nw ลดไม่นับ · เหรียญเดือนทอง',U.wealth.length===4&&U.wealth.every(x=>x.startsWith(U.wealth[0].slice(0,7)))&&U.w4,JSON.stringify(U.wealth));
  check('XP Wealth: ปรับเป้าอัตราออมสูงขึ้น (40%) → ข้อออมไม่ผ่าน',U.wealthHi===3,String(U.wealthHi));
  check('syncXpMeta: เปิดครั้งแรกตั้ง start + โปรเจกต์ที่ครบอยู่แล้ว=before + จด net worth · ครบทีหลัง=วันนี้ · ไม่มีอะไรเปลี่ยน=null · ต่ำกว่า 100% = ลบวัน',U.sync1[1]==='before'&&U.sync1[2]===undefined&&/"nw":1000/.test(U.sync1[3])&&/^\d{4}-/.test(U.sync2)&&U.sync3===null&&U.sync4===false,JSON.stringify([U.sync1,U.sync2,U.sync3,U.sync4]));

  console.log('\n[ข้อ 56 ขั้นที่ 5] แฟ้มตัวโอม');
  await mobileGo('Home'); await p.waitForTimeout(600);
  const bn=await p.evaluate(()=>(document.querySelector('.pf-banner')||{}).innerText||'');
  check('Home: มีแถบ "Jack เสนอเพิ่มแฟ้มตัวโอม 2 ข้อ" เมื่อมีข้อเสนอรอ',/เสนอเพิ่มแฟ้มตัวโอม 2 ข้อ/.test(bn),bn);
  await p.locator('.acct-btn').click(); await p.waitForTimeout(300);
  const mi=await p.evaluate(()=>{const b=[...document.querySelectorAll('.acct-item')].find(x=>x.innerText.includes('แฟ้มตัวโอม'));return b?b.innerText:'';});
  check('เมนู O มี "แฟ้มตัวโอม" + ตัวเลขข้อเสนอรอ',/แฟ้มตัวโอม\s*2/.test(mi),mi);
  await p.evaluate(()=>[...document.querySelectorAll('.acct-item')].find(x=>x.innerText.includes('แฟ้มตัวโอม')).click()); await p.waitForTimeout(500);
  const pm=await p.evaluate(()=>({open:!!document.querySelector('.pf-modal'),rows:document.querySelectorAll('.pf-prow').length,areas:[...document.querySelectorAll('.pf-text')].map(t=>t.value),labels:[...document.querySelectorAll('.pf-modal .field-label')].map(l=>l.childNodes[0].textContent.trim()),sw:document.documentElement.scrollWidth,iw:window.innerWidth}));
  check('หน้าต่างแฟ้มตัวโอม: 4 หัวข้อ + ค่าเดิม + ข้อเสนอ 2 ข้อ · มือถือไม่ล้น',pm.open&&pm.rows===2&&pm.areas.length===4&&pm.areas[0]==='เจ้าของร้าน'&&pm.areas[1]==='• วิ่ง 10K'&&pm.labels.join('|')==='ฉันคือใคร|เป้าหมายปีนี้|ค่านิยม / หลักที่ยึด|โปรเจกต์ / เรื่องที่โฟกัส'&&pm.sw<=pm.iw+2,JSON.stringify(pm));
  await p.locator('.pf-prow').first().locator('.pf-ok').click(); await p.waitForTimeout(400);
  await p.locator('.pf-prow').first().locator('button:has-text("ไม่ต้อง")').click(); await p.waitForTimeout(400);
  const pm2=await p.evaluate(()=>({rows:document.querySelectorAll('.pf-prow').length,values:document.querySelectorAll('.pf-text')[2].value,focus:document.querySelectorAll('.pf-text')[3].value}));
  check('กด "ลงแฟ้ม" → ต่อท้ายหัวข้อ (• ข้อความ) · กด "ไม่ต้อง" → ทิ้ง ไม่ลงแฟ้ม',pm2.rows===0&&pm2.values==='• ครอบครัวมาก่อน'&&pm2.focus==='',JSON.stringify(pm2));
  await p.locator('.pf-text').nth(3).fill('ขยายร้านออนไลน์'); await p.locator('.pf-modal .modal-btn-save').click(); await p.waitForTimeout(400);
  await p.locator('.pf-modal .modal-close').click(); await p.waitForTimeout(300);
  await p.locator('.acct-btn').click(); await p.waitForTimeout(300);
  await p.evaluate(()=>[...document.querySelectorAll('.acct-item')].find(x=>x.innerText.includes('แฟ้มตัวโอม')).click()); await p.waitForTimeout(500);
  const pm3=await p.evaluate(()=>({focus:document.querySelectorAll('.pf-text')[3].value,banner:!!document.querySelector('.pf-banner')}));
  check('แก้แล้วบันทึก → เปิดใหม่ยังอยู่ · ไม่มีข้อเสนอรอ = แถบบน Home หาย',pm3.focus==='ขยายร้านออนไลน์'&&!pm3.banner,JSON.stringify(pm3));
  await p.locator('.pf-modal .modal-close').click(); await p.waitForTimeout(300);

  console.log('\n[ข้อ 56 ขั้นที่ 6] Journal ปฏิทินอารมณ์ + หัวข้อนำ');
  await mobileGo('Journal'); await p.waitForTimeout(800);
  const jc=await p.evaluate(()=>{ const t=new Date(); const y=t.getFullYear(),m=t.getMonth(); const days=new Date(y,m+1,0).getDate(), lead=new Date(y,m,1).getDay();
    return {cells:document.querySelectorAll('.jr-cell:not(.empty)').length,empty:document.querySelectorAll('.jr-cell.empty').length,days,lead,today:!!document.querySelector('.jr-cell.today.sel'),
      parts:[...document.querySelectorAll('.jr-part .field-label')].map(x=>x.textContent),moods:document.querySelectorAll('.jr-mood').length,refl:(document.querySelector('.jr-refl .db-note')||{}).textContent||'',
      sum:document.querySelectorAll('.jr-sum-item').length,sw:document.documentElement.scrollWidth,iw:window.innerWidth}; });
  check('Journal: ปฏิทินเดือนนี้ครบทุกวัน (เริ่มวันอาทิตย์) · วันนี้ถูกเลือกไว้ · มือถือไม่ล้น',jc.cells===jc.days&&jc.empty===jc.lead&&jc.today&&jc.sw<=jc.iw+2,JSON.stringify(jc));
  check('Journal: หัวข้อนำ 4 ข้อ + ปุ่มอารมณ์ 5 + แถบสรุปเดือน + การ์ดสะท้อนสัปดาห์ (ว่าง = บอกว่า Jack สรุปคืนวันอาทิตย์)',jc.parts.join('|')==='📍 วันนี้ทำอะไร|✨ เจออะไร/เรื่องเด่น|💭 รู้สึกยังไง|💡 บทเรียนวันนี้'&&jc.moods===5&&jc.sum===4&&/คืนวันอาทิตย์/.test(jc.refl),JSON.stringify(jc));
  await p.locator('.jr-mood').nth(3).click(); await p.waitForTimeout(600);
  const jm1=await p.evaluate(()=>({emo:(document.querySelector('.jr-cell.today .jr-emo')||{}).textContent,on:(document.querySelector('.jr-mood.on span')||{}).textContent,avg:document.querySelectorAll('.jr-sum-item b')[1].textContent}));
  check('กดอารมณ์ 🙂 → บันทึกทันที · ปฏิทินวันนี้ขึ้น 🙂 · ค่าเฉลี่ยเดือนอัปเดต',jm1.emo==='🙂'&&jm1.on==='🙂'&&jm1.avg==='4.0',JSON.stringify(jm1));
  await p.locator('.jr-part textarea').nth(3).fill('ทำทีละอย่างดีกว่า'); await p.locator('.jr-part textarea').nth(0).fill('ทดสอบระบบ');
  await p.locator('.jr-actions .modal-btn-save').click(); await p.waitForTimeout(600);
  await p.locator('.jr-lessons .db-head').click(); await p.waitForTimeout(300);
  const jm2=await p.evaluate(()=>({lessons:[...document.querySelectorAll('.jr-lesson-text')].map(x=>x.textContent),written:document.querySelectorAll('.jr-sum-item b')[0].textContent,btn:document.querySelector('.jr-actions .modal-btn-save').disabled,did:!!document.querySelector('.jr-did-lab')}));
  check('กรอกหัวข้อแล้วบันทึก → คลังบทเรียนมีบทเรียนใหม่ · นับเป็นวันที่เขียน · มีส่วน "สิ่งที่ทำจริงวันนั้น"',jm2.lessons.includes('ทำทีละอย่างดีกว่า')&&jm2.written==='1'&&jm2.btn&&jm2.did,JSON.stringify(jm2));
  await p.locator('.jr-nav .db-chip').first().click(); await p.waitForTimeout(400);
  const jm3=await p.evaluate(()=>({month:document.querySelector('.jr-month').textContent,back:[...document.querySelectorAll('.jr-top > .db-chip')].some(b=>b.textContent==='วันนี้')}));
  await p.evaluate(()=>[...document.querySelectorAll('.jr-top > .db-chip')].find(b=>b.textContent==='วันนี้').click()); await p.waitForTimeout(400);
  const jm4=await p.evaluate(()=>({today:!!document.querySelector('.jr-cell.today.sel'),part:document.querySelectorAll('.jr-part textarea')[0].value}));
  check('เลื่อนเดือนก่อน → มีปุ่ม "วันนี้" · กดกลับมาแล้วเห็นบันทึกวันนี้เดิม',jm3.back&&jm4.today&&jm4.part==='ทดสอบระบบ',JSON.stringify([jm3,jm4]));

  console.log('\n[ข้อ 56 ขั้นที่ 7A] Health');
  await mobileGo('Home'); await p.waitForTimeout(500);
  const hx0=await lvRead();
  await mobileGo('Health'); await p.waitForTimeout(800);
  const hp=await p.evaluate(()=>({titles:[...document.querySelectorAll('.hl-page .db-title')].map(x=>x.textContent),bars:document.querySelectorAll('.hl-bar').length,sw:document.documentElement.scrollWidth,iw:window.innerWidth}));
  check('Health: การ์ดสุขภาพวันนี้ / 7 วัน / ทดสอบสมรรถนะ / ตรวจประจำปี · กราฟ 3 แถว × 7 วัน · มือถือไม่ล้น',hp.titles.join('|')==='สุขภาพวันนี้|7 วันล่าสุด|ทดสอบสมรรถนะ (ทุก 3 เดือน)|ตรวจสุขภาพประจำปี'&&hp.bars===21&&hp.sw<=hp.iw+2,JSON.stringify(hp));
  await p.locator('.hl-day .db-chip:has-text("+500 มล.")').click(); await p.waitForTimeout(300);
  await p.locator('.hl-day .db-chip:has-text("+500 มล.")').click(); await p.waitForTimeout(300);
  await p.locator('.hl-day .db-chip:has-text("+ เพิ่ม")').click(); await p.waitForTimeout(300);
  await p.locator('.hl-day .hl-num').nth(0).fill('8'); await p.locator('.hl-day .jr-actions .modal-btn-save').click(); await p.waitForTimeout(500);
  const hday=await p.evaluate(()=>({water:document.querySelector('.hl-water').textContent,ex:[...document.querySelectorAll('.hl-ex')].map(x=>x.innerText.replace(/\s+/g,' ')),ok:[...document.querySelectorAll('.hl-ok')].map(x=>x.textContent)}));
  check('น้ำ +500 ×2 = 1 ลิตร (บันทึกทันที) · เพิ่มออกกำลังกาย วิ่ง 30 นาที · นอน 8 ชม. ถึงเป้า',/^1 /.test(hday.water)&&hday.ex.length===1&&/วิ่ง 30 นาที/.test(hday.ex[0])&&hday.ok.includes('✓ ถึงเป้า'),JSON.stringify(hday));
  await p.locator('.hl-fit .db-chip:has-text("บันทึกผลทดสอบ")').click(); await p.waitForTimeout(400);
  const nf=await p.evaluate(()=>document.querySelectorAll('.hl-test-modal .hl-test-grid input').length);
  await p.locator('.hl-test-modal input[type=date]').fill(await p.evaluate(()=>shiftISO(todayISO(),{d:-100})));
  await p.locator('.hl-test-modal .hl-test-grid input').nth(1).fill('20'); await p.locator('.hl-test-modal .hl-test-grid input').nth(3).fill('60'); await p.locator('.hl-test-modal .hl-test-grid input').nth(11).fill('62');
  await p.locator('.hl-test-modal .modal-btn-save').click(); await p.waitForTimeout(400);
  await p.locator('.hl-fit .db-chip:has-text("บันทึกผลทดสอบ")').click(); await p.waitForTimeout(400);
  const ph=await p.evaluate(()=>document.querySelectorAll('.hl-test-modal .hl-test-grid input')[1].placeholder);
  await p.locator('.hl-test-modal .hl-test-grid input').nth(1).fill('25'); await p.locator('.hl-test-modal .hl-test-grid input').nth(11).fill('58'); await p.locator('.hl-test-modal .hl-test-grid input').nth(12).fill('71');
  await p.locator('.hl-test-modal .modal-btn-save').click(); await p.waitForTimeout(500);
  const ft=await p.evaluate(()=>({polys:document.querySelectorAll('.hl-radar-first,.hl-radar-latest').length,rows:[...document.querySelectorAll('.hl-fit-row')].map(r=>r.innerText.replace(/\s+/g,' ')),tests:[...document.querySelectorAll('.hl-test')].map(x=>x.innerText.replace(/\s+/g,' ')),note:document.querySelector('.hl-fit .db-note').textContent}));
  check('ทดสอบสมรรถนะ: ฟอร์ม 14 ค่า · ครั้งที่ 2 เห็นค่าครั้งก่อนเป็น placeholder',nf===14&&ph==='ครั้งก่อน 20',JSON.stringify([nf,ph]));
  check('ทดสอบสมรรถนะ: กราฟใยแมงมุมครั้งแรก vs ล่าสุด · ตารางเทียบ (วิดพื้น +5 ดี · ชีพจร −4 ดี) · รายการ 2 ครั้ง "ดีขึ้น 2" · ครั้งถัดไปอีก 90 วัน',ft.polys===2&&ft.rows.some(r=>/วิดพื้น.*20 → 25.*\+5/.test(r))&&ft.rows.some(r=>/ชีพจร.*62 → 58.*-4/.test(r))&&ft.tests.length===2&&/ดีขึ้น 2/.test(ft.tests[0])&&/อีก 90 วัน/.test(ft.note),JSON.stringify(ft));
  await mobileGo('Home'); await p.waitForTimeout(600);
  const hx1=await lvRead();
  check('XP Health: ออกกำลังกาย +15 · นอนถึงเป้า +10 · ทดสอบดีขึ้น 2 ค่า +60 (น้ำยังไม่ถึงเป้า 2L) = +85',num(hx1[1])[1]===num(hx0[1])[1]+85&&num(hx1[1])[0]===num(hx0[1])[0],JSON.stringify([hx0[1],hx1[1]]));
  const HU=await p.evaluate(()=>{
    const imp=fitnessImprovements({values:{pushup:10,rhr:60,weight:70,waist:90,plank:30}},{values:{pushup:12,rhr:62,weight:68,waist:88,plank:30}}).map(f=>f.k);
    const m1=migrateOldHealth({health:[{id:"h1",date:"2026-08-14",weight:70,sleep:8},{id:"h2",date:"2026-08-15",weight:70,sleep:7},{id:"z",date:"2026-08-20",weight:73,sleep:6.5}],healthDaily:[]});
    const m2=migrateOldHealth({healthMigrated:true,health:[{id:"z",date:"2026-08-20",weight:73}]});
    return {imp,m1:m1.healthDaily.map(h=>[h.date,h.weight,h.sleepMin]),flag:m1.healthMigrated,m2};
  });
  check('fitnessImprovements: มากดีกว่า/น้อยดีกว่า (ชีพจร รอบเอว) · น้ำหนักไม่นับ · เท่าเดิมไม่นับ',JSON.stringify(HU.imp)==='["pushup","waist"]',JSON.stringify(HU.imp));
  check('ย้าย health เก่า → healthDaily ครั้งเดียว (ข้ามแถวตัวอย่าง h1/h2 น้ำหนัก 70)',JSON.stringify(HU.m1)==='[["2026-08-20",73,390]]'&&HU.flag&&HU.m2===null,JSON.stringify(HU));

  console.log('\n[ข้อ 56 ขั้นที่ 7B] นำเข้าผลตรวจสุขภาพ PDF');
  /* CHECKUP_FIXTURE = ตำแหน่งข้อความจาก pdf.js ของฟอร์ม QF-ART-39 จริง แต่ "ค่าทั้งหมดเป็นค่าสมมติ" และตัดข้อมูลระบุตัวตนออกแล้ว (ห้ามใส่ไฟล์/ค่าจริงของโอมใน repo — repo เป็นสาธารณะ) */
  const CK=await p.evaluate((fx)=>{
    const withId=fx.concat([{p:1,x:65,y:728,s:"ชื่อ ทดสอบ ระบุตัวตน"},{p:1,x:227,y:757,s:"123456789"},{p:1,x:228,y:710,s:"01/01/2530"}]);
    const r=parseCheckupItems(withId);
    const bad=parseCheckupItems(fx.filter(t=>!/QF-ART/.test(t.s)));
    return {ok:r.ok,form:r.form,date:r.date,nb:r.blood.length,nu:r.urine.length,vit:r.vitals,xray:r.xray.impression,ekg:r.ekg,hear:r.hearing.right,advice:r.advice,warn:r.warnings,
      wbc:r.blood.find(x=>x.code==="WBC"),tc:r.blood.find(x=>x.code==="Total Cholesterol"),sg:r.urine.find(x=>x.code==="Sp.gravity"),ldlc:r.blood.find(x=>x.code==="LDL-(Calculate)"),
      ast:r.blood.find(x=>x.code==="SGOT-AST"),pua:fixThaiPua("ปสสาวะ ซาย ฟลิส ป เปน เกาท"),
      leak:/ระบุตัวตน|123456789|01\/01\/2530/.test(JSON.stringify(r)),badWarn:bad.warnings};
  },CHECKUP_FIXTURE);
  check('parseCheckupItems: วันที่ พ.ศ.→ค.ศ. · ผลเลือด 22 · ปัสสาวะ 12 · สัญญาณชีพครบ 7 ค่า · ไม่มีคำเตือน',CK.ok&&CK.form&&CK.date==='2025-03-15'&&CK.nb===22&&CK.nu===12&&JSON.stringify(CK.vit)==='{"bpSys":126,"bpDia":79,"pulse":72,"weight":70.2,"height":171,"waist":82,"bmi":24.01}'&&CK.warn.length===0,JSON.stringify(CK));
  check('parseCheckupItems: ค่า/ธง h/ช่วงปกติ/หน่วย (10³/ul, U/L) · ค่าว่างเก็บว่าง · ข้อความผลปัสสาวะ',JSON.stringify([CK.wbc.value,CK.wbc.num,CK.wbc.range,CK.wbc.unit])==='["7.10",7.1,"5.00-10.00","10³/ul"]'&&CK.tc.flag==='h'&&CK.tc.num===212&&CK.tc.range==='155-200'&&CK.sg.flag==='h'&&CK.ldlc.value===''&&CK.ast.unit==='U/L',JSON.stringify([CK.wbc,CK.tc,CK.sg,CK.ldlc,CK.ast]));
  check('parseCheckupItems: สรุปเอกซเรย์/EKG/การได้ยิน/คำแนะนำ · แก้ตัวอักษรไทย PUA ของฟอนต์ PDF',CK.xray==='Normal study.'&&CK.ekg==='Normal'&&/ปกติ/.test(CK.hear)&&/ออกกำลังกาย/.test(CK.advice)&&CK.pua==='ปัสสาวะ ซ้าย ฟิลิส ปี เป็น เก๊าท์',JSON.stringify([CK.xray,CK.ekg,CK.hear,CK.advice,CK.pua]));
  check('parseCheckupItems: ไม่อ่านข้อมูลระบุตัวตน (ชื่อ/HN/วันเกิด) · ไม่มีรหัสฟอร์ม → เตือน',!CK.leak&&CK.badWarn.some(w=>/QF-ART-39/.test(w)),JSON.stringify([CK.leak,CK.badWarn]));
  await mobileGo('Home'); await p.waitForTimeout(400);
  const ck0=await lvRead();
  await mobileGo('Health'); await p.waitForTimeout(700);
  await p.evaluate((fx)=>{ window.extractPdfItems=async()=>fx; },CHECKUP_FIXTURE);   // ในเทสต์ไม่มี pdf.js (ออฟไลน์) → ส่งรายการข้อความให้ตรงๆ
  await p.locator('.hl-check .db-chip:has-text("นำเข้า PDF")').click(); await p.waitForTimeout(300);
  await p.locator('.ck-modal input[type=file]').setInputFiles({name:'checkup.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 test')}); await p.waitForTimeout(700);
  const rv=await p.evaluate(()=>({rows:document.querySelectorAll('.ck-modal .ck-rrow').length,flagged:document.querySelectorAll('.ck-modal .ck-rrow.ck-h').length,date:document.querySelector('.ck-modal input[type=date]').value,vit:[...document.querySelectorAll('.ck-vit input')].map(i=>i.value),sw:document.documentElement.scrollWidth,iw:window.innerWidth}));
  check('หน้ายืนยัน: 34 แถว (ธง h 4 แถวเป็นสีส้ม) · วันที่ · สัญญาณชีพแก้ได้ · มือถือไม่ล้น',rv.rows===34&&rv.flagged===4&&rv.date==='2025-03-15'&&rv.vit.join()==='126,79,72,70.2,171,82,24.01'&&rv.sw<=rv.iw+2,JSON.stringify(rv));
  await p.locator('.ck-modal .ck-rv').first().fill('7.3');
  await p.locator('.ck-modal input[type=date]').fill(await p.evaluate(()=>todayISO()));
  await p.locator('.ck-modal .modal-btn-save').click(); await p.waitForTimeout(700);
  const cc=await p.evaluate(()=>({modal:!!document.querySelector('.ck-modal'),note:document.querySelector('.hl-check .db-note').textContent,chips:[...document.querySelectorAll('.hl-check .ck-chip')].map(x=>x.textContent),head:[...document.querySelectorAll('.hl-check .ck-cmp-h')].map(x=>x.children.length),
    wbc:([...document.querySelectorAll('.hl-check .ck-cmp-row')].find(r=>/เม็ดเลือดขาว/.test(r.textContent)&&/10³/.test(r.textContent))||{}).textContent||'',fl:document.querySelectorAll('.hl-check .ck-cmp-row .ck-flag').length}));
  check('บันทึกแล้ว: การ์ดบอก 1 ครั้ง + นอกเกณฑ์ 4 (เลือด 3 + ปัสสาวะ 1) · ชิปธงสีส้ม + เอกซเรย์/EKG/การได้ยิน · ตารางเทียบ (ค่าที่แก้ 7.3)',!cc.modal&&/1 ครั้ง/.test(cc.note)&&/นอกเกณฑ์ 4/.test(cc.note)&&cc.chips.some(c=>/คอเลสเตอรอลรวม 212 ↑/.test(c))&&cc.chips.some(c=>/เอกซเรย์: Normal study/.test(c))&&cc.chips.some(c=>/EKG: Normal/.test(c))&&/7\.3/.test(cc.wbc),JSON.stringify(cc));
  await mobileGo('Home'); await p.waitForTimeout(500);
  const ck1=await lvRead();
  check('XP Health: นำเข้าผลตรวจ (วันที่ตรวจ = วันนี้) +100',num(ck1[1])[0]*1000+num(ck1[1])[1]!==num(ck0[1])[0]*1000+num(ck0[1])[1],JSON.stringify([ck0[1],ck1[1]]));

  console.log('\n[ข้อ 56 ขั้นที่ 2] ส่วนหัวมือถือแถวเดียว + เมนู Jack + เปลี่ยนชื่อ');
  await mobileGo('Home'); await p.waitForTimeout(600);
  const hd=await p.evaluate(()=>{
    const r=s=>{const e=document.querySelector(s); if(!e) return null; const b=e.getBoundingClientRect(); return {t:b.top,b:b.bottom,l:b.left,r:b.right,w:b.width,h:b.height,vis:getComputedStyle(e).display!=='none'};};
    return {brand:r('.brand-trigger'),right:r('.topbar-right'),plus:r('.topbar-right .nav-icon-btn[title="Quick Capture"]'),avatar:r('.acct-btn'),search:r('.search-wrap'),
      pageNav:!!document.querySelector('.page-nav'),navPill:getComputedStyle(document.querySelector('.nav-pill')).display,
      name:document.querySelector('.brand-name').textContent,page:document.querySelector('.brand-page').textContent,title:document.title,sw:document.documentElement.scrollWidth,iw:window.innerWidth,
      bodyPad:parseFloat(getComputedStyle(document.querySelector('.app')).paddingBottom)};
  });
  check('ส่วนหัวมือถือ: ชื่อ = Jack · ข้างๆ = ชื่อหน้า · <title> = Jack',hd.name==='Jack'&&hd.page==='Home'&&hd.title==='Jack',JSON.stringify([hd.name,hd.page,hd.title]));
  check('ส่วนหัวมือถือ: อยู่แถวเดียว (Jack ซ้าย · 🔍 ＋ O ขวา) ไม่ล้น',hd.brand&&hd.search&&hd.plus&&hd.avatar&&Math.abs(hd.brand.t-hd.avatar.t)<12&&hd.brand.r<=hd.search.l+2&&hd.search.l<hd.plus.l&&hd.plus.l<hd.avatar.l&&hd.avatar.r<=hd.iw&&hd.sw<=hd.iw+2,JSON.stringify(hd));
  check('มือถือ: ไม่มีแถบล่าง .page-nav · ไม่เว้นที่ล่างของ .app · แถบแคปซูลถูกซ่อน',!hd.pageNav&&hd.bodyPad<=24&&hd.navPill==='none',JSON.stringify([hd.pageNav,hd.bodyPad,hd.navPill]));
  const closedVis=await p.evaluate(()=>getComputedStyle(document.querySelector('.jm-layer')).visibility);
  check('เมนู Jack: ปิดอยู่ตอนเปิดหน้า (ไม่บังหน้า)',closedVis==='hidden',closedVis);
  await p.locator('.brand-trigger').click(); await p.waitForTimeout(700);
  const mo=await p.evaluate(()=>{
    const items=[...document.querySelectorAll('.jm-item')]; const pan=document.querySelector('.jm-panel').getBoundingClientRect(); const br=document.querySelector('.brand-trigger').getBoundingClientRect();
    return {labels:items.map(i=>i.textContent),active:items.filter(i=>i.classList.contains('active')).map(i=>i.textContent),op:items.map(i=>+getComputedStyle(i).opacity),panTop:pan.top,panB:pan.bottom,panR:pan.right,brB:br.bottom,ih:window.innerHeight,iw:window.innerWidth,
      caret:getComputedStyle(document.querySelector('.brand-caret')).transform,exp:document.querySelector('.brand-trigger').getAttribute('aria-expanded'),vis:getComputedStyle(document.querySelector('.jm-layer')).visibility,
      bf:getComputedStyle(document.querySelector('.jm-backdrop')).backdropFilter||getComputedStyle(document.querySelector('.jm-backdrop')).webkitBackdropFilter};
  });
  check('เมนู Jack: 7 หน้าครบตามลำดับ · หน้าปัจจุบันไฮไลต์',JSON.stringify(mo.labels)===JSON.stringify(['Home','Finance','Tracker','Health','Documents','Books','Journal'])&&JSON.stringify(mo.active)==='["Home"]',JSON.stringify([mo.labels,mo.active]));
  check('เมนู Jack: เลื่อนลงจากหัว (ติดใต้ปุ่ม Jack) · รายการไล่โผล่ครบ · อยู่ในจอ',mo.vis==='visible'&&mo.panTop>=mo.brB-2&&mo.panTop<=mo.brB+24&&mo.panB<=mo.ih&&mo.panR<=mo.iw&&mo.op.every(o=>o>0.95)&&mo.exp==='true',JSON.stringify(mo));
  check('เมนู Jack: ▾ หมุน · หน้าเดิมข้างหลังเบลอ/มืด',mo.caret&&mo.caret!=='none'&&/blur/.test(mo.bf||''),JSON.stringify([mo.caret,mo.bf]));
  await p.mouse.click(mo.iw-8,mo.ih-8); await p.waitForTimeout(500);
  const outVis=await p.evaluate(()=>getComputedStyle(document.querySelector('.jm-layer')).visibility);
  check('เมนู Jack: แตะนอกเมนู → หุบ',outVis==='hidden',outVis);
  await p.locator('.brand-trigger').click(); await p.waitForTimeout(500);
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  check('เมนู Jack: กด Esc → หุบ',await p.evaluate(()=>getComputedStyle(document.querySelector('.jm-layer')).visibility)==='hidden');
  await p.locator('.brand-trigger').click(); await p.waitForTimeout(500);
  await p.locator('.jm-item:has-text("Journal")').click(); await p.waitForTimeout(800);
  const jp=await p.evaluate(()=>({page:document.querySelector('.brand-page').textContent,vis:getComputedStyle(document.querySelector('.jm-layer')).visibility}));
  check('เมนู Jack: เลือก Journal → เปลี่ยนหน้า + ชื่อหน้าข้าง Jack เปลี่ยนตาม + เมนูหุบ',jp.page==='Journal'&&jp.vis==='hidden',JSON.stringify(jp));
  const man=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'),'utf8'));
  check('manifest: name/short_name = Jack',man.name==='Jack'&&man.short_name==='Jack',JSON.stringify([man.name,man.short_name]));
  check('apple-mobile-web-app-title = Jack',/apple-mobile-web-app-title" content="Jack"/.test(fs.readFileSync(path.join(__dirname,'preview-dashboard.html'),'utf8')));
  await p.setViewportSize({width:1440,height:950}); await p.waitForTimeout(600);
  const dk=await p.evaluate(()=>({pill:getComputedStyle(document.querySelector('.nav-pill')).display,caret:getComputedStyle(document.querySelector('.brand-caret')).display,pg:getComputedStyle(document.querySelector('.brand-page')).display,jm:getComputedStyle(document.querySelector('.jm-layer')).display,name:document.querySelector('.brand-name').textContent}));
  check('คอม: ยังใช้แถบแคปซูลเดิม · ชื่อ Jack ไม่มี ▾/ชื่อหน้า · เมนูมือถือถูกซ่อน',dk.pill==='flex'&&dk.caret==='none'&&dk.pg==='none'&&dk.jm==='none'&&dk.name==='Jack',JSON.stringify(dk));

  /* ───────── สรุป ───────── */
  const failed=results.filter(r=>!r.ok);
  console.log('\n════════ สรุป ════════');
  console.log(`ผ่าน ${results.length-failed.length}/${results.length}`);
  if(failed.length) console.log('ไม่ผ่าน:\n'+failed.map(r=>'  · '+r.name+(r.detail?'  ('+r.detail+')':'')).join('\n'));
  console.log(errs.length?('\nRUNTIME ERRORS:\n'+errs.join('\n')):'\nNO RUNTIME ERRORS');
  await b.close();
  process.exit(failed.length||errs.length?1:0);
})();
