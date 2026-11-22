/* ==========================================================
   products.js — إعدادات موقع شاورما الأفندي والمنتجات (عدّل هنا فقط)
   كل الصور والفيديوهات عبارة عن روابط (URL) وليست ملفات.
   ========================================================== */
window.SITE = {

  /* ---------- الواجهة الرئيسية ----------
     type: "video" → فيديو من رابط   |   type: "image" → صورة من رابط */
  hero: {
    type: "video",
    video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    image: ""
  },

  logo: "",

  /* ---------- التواصل ---------- */
  whatsappNumber: "963956921971",      /* رقم الطلب */
  supportText: "+963956921971",
  qrTarget: "whatsapp",                /* "whatsapp" = الـ QR يفتح واتساب المحل | "site" = يفتح الموقع */

  /* حقوق المطوّر (الشريط الأزرق في آخر الصفحة) */
  devName: "السكب للتطوير البرمجي",
  devWhatsapp: "963992147669",
  instagram: "https://instagram.com/_alskb?exln=MTZ5cndod3N3d3cxcg%3D%3D",
  tiktok: "https://www.tiktok.com/@alsakb_1?_r=1&_t=ZS-9AWedIdANDI",

  siteUrl: "",
  currency: "$",

  /* ---------- المنتجات (by = التصنيف، notes = المكوّنات) ---------- */
  products: [
    { id: 1, name: "شاورما دجاج", by: "ساندويش", price: 3.5, img: "",
      desc: "شرائح دجاج متبّلة على الفحم مع ثوم ومخلل وبطاطا داخل خبز صاج طازج.",
      notes: ["دجاج", "ثوم", "مخلل"] },
    { id: 2, name: "شاورما لحم", by: "ساندويش", price: 4.5, img: "",
      desc: "لحم عجل مشوي على السيخ مع طحينة وبقدونس وبصل بالسماق.",
      notes: ["لحم", "طحينة", "سماق"] },
    { id: 3, name: "وجبة شاورما عربي", by: "وجبات", price: 7.5, img: "",
      desc: "صحن شاورما مع بطاطا مقلية ومخللات وصوص الثوم وخبز طازج.",
      notes: ["شاورما", "بطاطا", "ثوم"] },
    { id: 4, name: "فروج مشوي", by: "وجبات", price: 9.99, img: "",
      desc: "نصف فروج مشوي على الفحم مع أرز وسلطة وثوم.",
      notes: ["فروج", "أرز", "ثوم"] },
    { id: 5, name: "برغر لحم", by: "برغر", price: 5.99, img: "",
      desc: "قطعة لحم مشوية مع جبنة وخس وطماطم وصوص خاص وبطاطا.",
      notes: ["لحم", "جبنة", "بطاطا"] },
    { id: 6, name: "بيتزا مشكّلة", by: "بيتزا", price: 8.5, img: "",
      desc: "عجينة طازجة مع جبنة موزاريلا وخضار ولحوم مشكّلة.",
      notes: ["موزاريلا", "خضار", "لحم"] },
    { id: 7, name: "فلافل وحمص", by: "مقبلات", price: 2.99, img: "",
      desc: "فلافل مقرمشة مع حمص بالطحينة وخضار ومخلل.",
      notes: ["فلافل", "حمص", "طحينة"] },
    { id: 8, name: "بطاطا مقلية", by: "مقبلات", price: 1.99, img: "",
      desc: "بطاطا ذهبية مقرمشة مع صوص الثوم أو الكاتشب.",
      notes: ["بطاطا", "ثوم"] }
  ]
};

/* صور احتياطية مدمجة (تُستخدم فقط إذا كان حقل الرابط فارغاً أو الرابط لا يعمل) */
window.SITE_FALLBACK = {
  logo: "data:image/png;base64,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"
};
