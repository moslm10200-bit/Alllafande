/* admin.js — لوحة إدارة شاورما الأفندي (Firebase Auth + Firestore) */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  function say(id, text, ok) { var m = $(id); m.textContent = text; m.className = "msg " + (ok ? "ok" : "err"); }

  var cfg = Object.assign({}, window.FIREBASE_CONFIG); delete cfg.enabled;
  if (!cfg.apiKey) { say("loginMsg", "إعدادات Firebase ناقصة", false); return; }
  firebase.initializeApp(cfg);
  var auth = firebase.auth(), db = firebase.firestore();
  var products = [], editing = null;

  /* ---------- الدخول ---------- */
  $("btnIn").onclick = function () {
    auth.signInWithEmailAndPassword($("em").value.trim(), $("pw").value)
      .catch(function () { say("loginMsg", "البريد أو كلمة المرور غير صحيحة", false); });
  };
  $("pw").addEventListener("keydown", function (e) { if (e.key === "Enter") $("btnIn").click(); });
  $("btnOut").onclick = function () { auth.signOut(); };
  auth.onAuthStateChanged(function (u) {
    $("loginBox").hidden = !!u; $("panel").hidden = !u; $("btnOut").hidden = !u;
    if (u) { loadProducts(); loadOrders(); loadSettings(); }
  });

  document.querySelectorAll(".tabs button").forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll(".tabs button").forEach(function (x) { x.classList.toggle("on", x === b); });
      ["tProducts", "tOrders", "tSettings"].forEach(function (t) { $(t).hidden = t !== b.dataset.tab; });
    };
  });

  /* ---------- الأصناف ---------- */
  function loadProducts() {
    db.collection("products").orderBy("id").get().then(function (s) {
      products = s.docs.map(function (d) { return d.data(); });
      $("btnSeed").hidden = products.length > 0;
      $("pList").innerHTML = products.length ? products.map(function (p) {
        return '<div class="row"><img src="' + esc(p.img) + '" alt="" onerror="this.style.visibility=\'hidden\'">' +
          '<div class="t"><b>' + esc(p.name) + '</b><small>' + esc(p.by) + ' — ' + esc(window.SITE.currency + p.price) + '</small></div>' +
          '<button class="btn sm alt" data-e="' + p.id + '">تعديل</button><button class="btn sm red" data-d="' + p.id + '">حذف</button></div>';
      }).join("") : '<p style="color:#888">لا أصناف في Firebase بعد — الموقع يعرض القائمة الافتراضية.</p>';
    }).catch(function (e) { say("pMsg", "تعذر التحميل: " + e.code, false); });
  }
  $("pList").onclick = function (e) {
    var t = e.target, id;
    if ((id = t.getAttribute("data-e"))) {
      var p = products.filter(function (x) { return x.id === +id; })[0]; editing = p.id;
      $("pName").value = p.name; $("pBy").value = p.by || ""; $("pPrice").value = p.price; $("pImg").value = p.img || "";
      $("pDesc").value = p.desc || ""; $("pNotes").value = (p.notes || []).join("، ");
      $("formTitle").textContent = "تعديل صنف"; $("btnReset").hidden = false; window.scrollTo(0, 0);
    }
    if ((id = t.getAttribute("data-d")) && confirm("حذف هذا الصنف؟"))
      db.collection("products").doc(String(id)).delete().then(loadProducts);
  };
  function resetForm() {
    editing = null; ["pName", "pBy", "pPrice", "pImg", "pDesc", "pNotes"].forEach(function (i) { $(i).value = ""; });
    $("formTitle").textContent = "إضافة صنف"; $("btnReset").hidden = true;
  }
  $("btnReset").onclick = resetForm;
  $("btnSave").onclick = function () {
    var name = $("pName").value.trim(), price = parseFloat($("pPrice").value);
    if (!name || isNaN(price)) return say("pMsg", "اكتب الاسم والسعر", false);
    var id = editing || products.reduce(function (m, p) { return Math.max(m, p.id); }, 0) + 1;
    var doc = { id: id, name: name, by: $("pBy").value.trim(), price: price, img: $("pImg").value.trim(), desc: $("pDesc").value.trim(),
      notes: $("pNotes").value.split(/[,،]/).map(function (x) { return x.trim(); }).filter(Boolean) };
    db.collection("products").doc(String(id)).set(doc).then(function () { say("pMsg", "تم الحفظ", true); resetForm(); loadProducts(); })
      .catch(function (e) { say("pMsg", "فشل الحفظ: " + e.code, false); });
  };
  $("btnSeed").onclick = function () {
    var b = db.batch();
    window.SITE.products.forEach(function (p) { b.set(db.collection("products").doc(String(p.id)), p); });
    b.commit().then(function () { say("pMsg", "تم رفع القائمة", true); loadProducts(); }).catch(function (e) { say("pMsg", "فشل: " + e.code, false); });
  };

  /* ---------- الطلبات ---------- */
  function loadOrders() {
    db.collection("orders").orderBy("createdAt", "desc").limit(50).get().then(function (s) {
      $("oList").innerHTML = s.empty ? '<p style="color:#888">لا طلبات بعد.</p>' : s.docs.map(function (d) {
        var o = d.data(), t = o.createdAt ? o.createdAt.toDate().toLocaleString("ar") : "";
        var items = (o.items || []).map(function (i) { return esc(i.name || ("#" + i.id)) + " × " + i.q; }).join("، ");
        return '<div class="ord"><b>' + esc(t) + '</b><br>' + items + '<br>المجموع: ' + esc(window.SITE.currency + Number(o.total || 0).toFixed(2)) +
          ' <button class="btn sm red" data-o="' + d.id + '">حذف</button></div>';
      }).join("");
    }).catch(function () { $("oList").innerHTML = '<p style="color:#b3261e">تعذر تحميل الطلبات (تحقق من قواعد Firestore).</p>'; });
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
      if (s.whatsappNumber) $("sWa").value = s.whatsappNumber; if (s.supportText) $("sSup").value = s.supportText;
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
