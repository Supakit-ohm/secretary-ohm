// ============================================================
// Jack — เลขาของโอมใน LINE · ไฟล์ตั้งค่า (แก้ได้)
// ค่าลับ (token/key) ไม่อยู่ที่นี่ — ใส่ใน Project Settings → Script Properties
//   LINE_CHANNEL_ACCESS_TOKEN · LINE_CHANNEL_SECRET · OPENAI_API_KEY
//   WEBHOOK_KEY (รันฟังก์ชัน setup() ครั้งแรกจะสร้างให้เอง)
// ============================================================
var CONFIG = {
  // ---- Firebase / Firestore ----
  FIREBASE_PROJECT_ID: "personal-os-505713",

  // ---- AI ----
  // จุดเดียวที่สลับ provider (ตอนนี้มีแค่ "openai" — จะเพิ่ม "gemini" ก็เขียน adapter ใน Bot.gs ฟังก์ชัน llmCall_)
  PROVIDER: "openai",
  MODEL_SMALL: "gpt-6-luna",   // ใช้เป็นหลัก — จดรายจ่าย เพิ่มงาน ถามยอด
  MODEL_MID: "gpt-6-sol",      // ใช้เฉพาะคำถามวิเคราะห์ (ดู ANALYSIS_WORDS)
  EFFORT_SMALL: "low",         // none | low | medium — none ถูกและเร็วสุด
  EFFORT_MID: "medium",
  MAX_OUTPUT_TOKENS: 1500,
  MAX_TOOL_ROUNDS: 5,          // กันวนเรียกเครื่องมือไม่จบ

  // ราคา USD ต่อ 1 ล้าน token (เช็กแล้ว 2026-09-28) — ใช้คำนวณเพดานเอง เพราะงบในหน้า OpenAI แค่ส่งเมลเตือน ไม่ตัดจริง
  PRICES: {
    "gpt-6-luna": { input: 0.10, cached: 0.01, output: 0.50 },
    "gpt-6-sol":  { input: 2.00, cached: 0.20, output: 10.00 }
  },

  // ---- เพดานค่า AI ----
  MONTHLY_CAP_USD: 5,          // ถึงแล้วหยุดใช้ AI จนต้นเดือนใหม่ (ยังจดรายจ่ายแบบ "ข้าว 60" ได้ด้วยตัวแยกคำง่ายๆ)
  MID_MODEL_MAX_SHARE: 0.8,    // ใช้ไปเกิน 80% ของเพดานแล้ว → คำถามวิเคราะห์ก็ใช้รุ่นเล็กแทน

  // คำที่ทำให้ใช้รุ่นกลาง (คำถามวิเคราะห์)
  ANALYSIS_WORDS: ["วิเคราะห์", "ควรจะ", "ควรไหม", "ดีไหม", "แนะนำ", "เปรียบเทียบ", "ทำไม", "วางแผน", "ประเมิน", "คุ้มไหม", "มีปัญหาตรงไหน", "ปรับยังไง"],

  // ---- ความจำระยะสั้น ----
  HISTORY_TURNS: 6,            // จำบทสนทนาล่าสุดกี่รอบ (เก็บ 6 ชม.)

  // ---- ความจำระยะยาว (เก็บใน Firestore parts/k.jackMemory — ติดไปกับ Export/สำรอง Drive ของแอปด้วย) ----
  // โอมสั่ง "จำไว้ว่า…" หรือ Jack ถามก่อนแล้วโอมตกลง · ดู/ลบ: พิมพ์ "jack จำอะไรบ้าง"
  MEMORY_MAX_ITEMS: 60,        // เต็มแล้วต้องลบของเก่าก่อน (กัน prompt บวม)
  MEMORY_MAX_CHARS: 200,       // ยาวสุดต่อข้อ

  // ---- ทักก่อน (push) — แก้เวลาแล้วต้องรัน setupSchedules() ใหม่ ----
  MORNING_PUSH: true,          // สรุปเช้า
  MORNING_HOUR: 7,             // 07:00 (Apps Script ยิงคลาดได้ ±15 นาที)
  MORNING_USE_AI: true,        // true = gpt-6-luna เขียนสไตล์ Jack (~฿1/เดือน) · false = แม่แบบตายตัว ฟรี
  JOURNAL_PUSH: true,          // ชวนเขียน Journal (ถ้าวันนั้นเขียนแล้ว = ไม่ทัก)
  JOURNAL_HOUR: 20,            // 20:00

  // ---- LINE ----
  QUICK_REPLY: true,           // แนบปุ่ม "แก้ / ยกเลิก" หลังบันทึก

  // ---- ไฟล์แนบ (ขั้นที่ 8) — รูป/PDF ที่ส่งใน LINE → Drive SecretaryOhmApp/files-line ----
  ATTACH_WINDOW_MIN: 10,       // ส่งรูปภายในกี่นาทีหลังจดรายการ → แนบให้เอง (และรูปที่ส่งก่อน รอรายการได้กี่นาที)
  FILE_MAX_MB: 20,             // PDF ใหญ่สุดที่รับ (UrlFetch ของ Apps Script รับได้ถึง 50MB)

  // ---- Rich Menu (ปุ่มลัดล่างแชท) — ติดตั้งด้วยฟังก์ชัน setupRichMenu() ----
  APP_URL: "https://supakit-ohm.github.io/secretary-ohm/preview-dashboard.html",
  RICHMENU_IMAGE_URL: "https://supakit-ohm.github.io/secretary-ohm/line-bot/assets/richmenu.png"
};
