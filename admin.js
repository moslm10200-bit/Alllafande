/* admin.js — لوحة أدمن شاورما الأفندي (Firebase Auth + Firestore) */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  function say(id, text, ok) { var m = $(id); m.textContent = text; m.className = "msg " + (ok ? "ok" : "err"); }
  var cur = window.SITE.currency;

  var cfg = Object.assign({}, window.FIREBASE_CONFIG); delete cfg.enabled;
  if (!cfg.apiKey) { say("loginMsg", "إعدادات Firebase ناقصة", false); return; }
  firebase.initializeApp(cfg);
  var auth = firebase.auth(), db = firebase.firestore();
  var products = [], editing = null, imgData = "";

  /* ---------- الدخول ---------- */
  $("btnIn").onclick = function () {
    auth.signInWithEmailAndPassword($("em").value.trim(), $("pw").value)
      .catch(function () { say("loginMsg", "البريد أو كلمة السر غير صحيحة", false); });
  };
  $("pw").addEventListener("keydown", function (e) { if (e.key === "Enter") $("btnIn").click(); });
  $("btnOut").onclick = function () { auth.signOut(); };
  auth.onAuthStateChanged(function (u) {
    $("loginBox").hidden = !!u; $("panel").hidden = !u;
    if (u) { $("who").textContent = u.email; loadProducts(); loadOrders(); loadSettings(); }
  });

  document.querySelectorAll(".tabs button").forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll(".tabs button").forEach(function (x) { x.classList.toggle("on", x === b); });
      ["tProducts", "tOrders", "tSettings"].forEach(function (t) { $(t).hidden = t !== b.dataset.tab; });
    };
  });

  /* ---------- المنتجات ---------- */
  function loadProducts() {
    db.collection("products").orderBy("id").get().then(function (s) {
      products = s.docs.map(function (d) { return d.data(); });
      $("btnSeed").hidden = products.length > 0;
      $("pList").innerHTML = products.length ? products.map(function (p) {
        var th = p.img ? ' style="background-image:url(\'' + esc(p.img) + '\')"' : "";
        return '<div class="item"><div class="thumb"' + th + '>' + (p.img ? "" : "<i></i>") + '</div>' +
          '<div class="t"><b>' + esc(p.name) + '</b><small>' + esc(cur + p.price) + (p.by ? " · " + esc(p.by) : "") + '</small></div>' +
          '<button data-e="' + p.id + '">تعديل</button><button class="del" data-d="' + p.id + '">حذف</button></div>';
      }).join("") : '<p class="empty">لا منتجات في Firebase بعد — الموقع يعرض القائمة الافتراضية.</p>';
    }).catch(function (e) { say("pMsg", "تعذر التحميل: " + e.code, false); });
  }
  /* رفع الصورة: تُصغَّر داخل المتصفح وتُحفظ مع المنتج (بدون رابط وبدون Storage) */
  function showPrev() {
    var pv = $("upPrev"); pv.style.backgroundImage = imgData ? "url('" + imgData + "')" : "none"; pv.classList.toggle("has", !!imgData);
  }
  function shrink(file, cb) {
    var rd = new FileReader();
    rd.onload = function () {
      var im = new Image();
      im.onload = function () {
        var max = 700, r = Math.min(1, max / Math.max(im.width, im.height)), cv = document.createElement("canvas");
        cv.width = Math.round(im.width * r); cv.height = Math.round(im.height * r);
        cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
        var q = 0.8, out = cv.toDataURL("image/jpeg", q);
        while (out.length > 300000 && q > 0.3) { q -= 0.1; out = cv.toDataURL("image/jpeg", q); }
        cb(out);
      };
      im.onerror = function () { say("fMsg", "تعذر قراءة الصورة", false); };
      im.src = rd.result;
    };
    rd.readAsDataURL(file);
  }
  $("pFile").onchange = function () {
    var f = this.files[0]; if (!f) return;
    shrink(f, function (d) { imgData = d; showPrev(); });
    this.value = "";
  };
  $("btnNoImg").onclick = function () { imgData = ""; showPrev(); };

  function openForm(p) {
    editing = p ? p.id : null;
    $("formTitle").textContent = p ? "تعديل منتج" : "منتج جديد";
    $("pName").value = p ? p.name : ""; $("pBy").value = p ? p.by || "" : ""; $("pPrice").value = p ? p.price : "";
    imgData = p ? p.img || "" : ""; showPrev(); $("pDesc").value = p ? p.desc || "" : ""; $("pNotes").value = p ? (p.notes || []).join("، ") : "";
    $("fMsg").className = "msg"; $("fModal").hidden = false;
  }
  $("btnNew").onclick = function () { openForm(null); };
  $("btnCancel").onclick = function () { $("fModal").hidden = true; };
  $("pList").onclick = function (e) {
    var id;
    if ((id = e.target.getAttribute("data-e"))) openForm(products.filter(function (x) { return x.id === +id; })[0]);
    if ((id = e.target.getAttribute("data-d")) && confirm("حذف هذا المنتج؟"))
      db.collection("products").doc(String(id)).delete().then(loadProducts);
  };
  $("btnSave").onclick = function () {
    var name = $("pName").value.trim(), price = parseFloat($("pPrice").value);
    if (!name || isNaN(price)) return say("fMsg", "اكتب الاسم والسعر", false);
    var id = editing || products.reduce(function (m, p) { return Math.max(m, p.id); }, 0) + 1;
    var doc = { id: id, name: name, by: $("pBy").value.trim(), price: price, img: imgData, desc: $("pDesc").value.trim(),
      notes: $("pNotes").value.split(/[,،]/).map(function (x) { return x.trim(); }).filter(Boolean) };
    db.collection("products").doc(String(id)).set(doc).then(function () { $("fModal").hidden = true; loadProducts(); })
      .catch(function (e) { say("fMsg", "فشل الحفظ: " + e.code, false); });
  };
  $("btnSeed").onclick = function () {
    var b = db.batch();
    window.SITE.products.forEach(function (p) { b.set(db.collection("products").doc(String(p.id)), p); });
    b.commit().then(loadProducts).catch(function (e) { say("pMsg", "فشل: " + e.code, false); });
  };

  /* ---------- الطلبات ---------- */
  function loadOrders() {
    db.collection("orders").orderBy("createdAt", "desc").limit(50).get().then(function (s) {
      $("oList").innerHTML = s.empty ? '<p class="empty">لا طلبات بعد.</p>' : s.docs.map(function (d) {
        var o = d.data(), t = o.createdAt ? o.createdAt.toDate().toLocaleString("ar") : "";
        var items = (o.items || []).map(function (i) { return esc(i.name || ("#" + i.id)) + " × " + i.q; }).join("، ");
        return '<div class="ord"><b>' + esc(t) + '</b><br>' + items + '<br>المجموع: ' + esc(cur + Number(o.total || 0).toFixed(2)) +
          '<br><button data-o="' + d.id + '">حذف</button></div>';
      }).join("");
    }).catch(function () { $("oList").innerHTML = '<p class="empty">تعذر تحميل الطلبات (تحقق من قواعد Firestore).</p>'; });
  }
  $("oList").onclick = function (e) {
    var id = e.target.getAttribute("data-o");
    if (id && confirm("حذف الطلب؟")) db.collection("orders").doc(id).delete().then(loadOrders);
  };

  /* ---------- الإعدادات ---------- */
  function loadSettings() {
    var S = window.SITE;
    $("sWa").value = S.whatsappNumber; $("sSup").value = S.supportText; $("sVid").value = S.hero.video; $("sImg").value = S.hero.image;
    db.collection("settings").doc("site").get().then(function (d) {
      if (!d.exists) return; var s = d.data();
      if (s.whatsappNumber) $("sWa").value = s.whatsappNumber;
      if (s.supportText) $("sSup").value = s.supportText;
      if (s.hero) { $("sVid").value = s.hero.video || ""; $("sImg").value = s.hero.image || ""; }
    });
  }
  $("btnSet").onclick = function () {
    var wa = $("sWa").value.replace(/\D/g, ""), vid = $("sVid").value.trim(), img = $("sImg").value.trim();
    if (!wa) return say("sMsg", "اكتب رقم واتساب صحيحاً", false);
    db.collection("settings").doc("site").set({
      whatsappNumber: wa, supportText: $("sSup").value.trim() || "+" + wa,
      hero: { type: vid ? "video" : "image", video: vid, image: img }
    }, { merge: true }).then(function () { say("sMsg", "تم الحفظ", true); })
      .catch(function (e) { say("sMsg", "فشل الحفظ: " + e.code, false); });
  };
})();
