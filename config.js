/* Vercel Function — يقرأ متغيرات firebase.env ويُرجعها للمتصفح.
   إن لم تُضبط المتغيرات لا يغيّر شيئاً (تبقى قيم firebase-config.js). */
module.exports = (req, res) => {
  const e = process.env;
  const cfg = {
    apiKey: e.FIREBASE_API_KEY, authDomain: e.FIREBASE_AUTH_DOMAIN, projectId: e.FIREBASE_PROJECT_ID,
    storageBucket: e.FIREBASE_STORAGE_BUCKET, messagingSenderId: e.FIREBASE_MESSAGING_SENDER_ID,
    appId: e.FIREBASE_APP_ID, measurementId: e.FIREBASE_MEASUREMENT_ID
  };
  Object.keys(cfg).forEach(k => { if (!cfg[k]) delete cfg[k]; });
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).send(cfg.apiKey && cfg.projectId
    ? "window.FIREBASE_CONFIG=Object.assign(window.FIREBASE_CONFIG||{},{enabled:true}," + JSON.stringify(cfg) + ");"
    : "");
};
