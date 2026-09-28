// ==========================================================
// ตั้งค่าแอป — ต้องแก้ก่อนใช้งานจริง
// ==========================================================
// นำ Client ID ที่ได้จาก Google Cloud Console (OAuth 2.0 Client ID
// ประเภท "Web application") มาใส่แทนค่าด้านล่างนี้
// ดูขั้นตอนทั้งหมดได้ในไฟล์ SETUP.md
window.APP_CONFIG = {
  CLIENT_ID: "1034065613880-ufoc34mqhi69a2lb841elmevaebarqhk.apps.googleusercontent.com",
  DRIVE_FOLDER_NAME: "SecretaryOhmApp",
  DATA_FILE_NAME: "data.json",

  // ข้อ 55: Firebase (ค่าสาธารณะ ใส่ในโค้ดได้ — ความปลอดภัยอยู่ที่ Security Rules ใน firestore.rules)
  FIREBASE: {
    apiKey: "AIzaSyAM79AirX9NG5yLBGc6L_ANiCJvFscTOKI",
    authDomain: "personal-os-505713.firebaseapp.com",
    projectId: "personal-os-505713",
    storageBucket: "personal-os-505713.firebasestorage.app",
    messagingSenderId: "1034065613880",
    appId: "1:1034065613880:web:4f33ce95bac549380502cd"
  },
  // บัญชีที่ใช้แอปได้ (ต้องตรงกับใน firestore.rules) — บัญชีอื่นล็อกอินแล้วจะถูกออกจากระบบทันที
  ALLOWED_EMAILS: ["supakit6906@gmail.com"]
};
