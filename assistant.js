/* ==========================================================================
   Athienitis — AI customer service widget
   Works fully offline with a small intent engine over the site's own data
   (hours, counters, products, offers, orders, Bonus Card, delivery).
   To connect a real model, set window.AI_ENDPOINT to a URL that accepts
   POST {messages:[{role,content}], lang, context} and returns {reply}.
   The local engine remains the fallback.
   ========================================================================== */
(function () {
  "use strict";
  var C = window.CATALOG || { products: [], sections: {} };
  var base = document.body.getAttribute("data-base") || "";
  function t(k, a) { return window.ATH ? window.ATH.t(k, a) : k; }
  function lang() { return window.ATH ? window.ATH.lang() : "en"; }
  function money(n) { return "€" + n.toFixed(2); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function name(p) { return p.name[lang()] || p.name.en; }

  var HOURS_TXT = { en: "Monday–Saturday 07:30–20:00, Sunday 09:00–18:00. The bakery starts at 05:30 and the Eatery serves lunch 11:30–19:00.",
                    el: "Δευτέρα–Σάββατο 07:30–20:00, Κυριακή 09:00–18:00. Ο φούρνος ξεκινά 05:30 και το εστιατόριο σερβίρει 11:30–19:00." };

  var INTENTS = [
    { id: "greet", kw: ["hello", "hi", "hey", "γεια", "καλημέρα", "καλησπέρα"], reply: { en: "Hello! I can help with opening hours, what's on offer, finding a product, your orders, the Bonus Card or deliveries for businesses. What do you need?", el: "Γεια σας! Μπορώ να βοηθήσω με ωράριο, προσφορές, εύρεση προϊόντος, παραγγελίες, Bonus Card ή διανομές για επιχειρήσεις. Τι χρειάζεστε;" } },
    { id: "hours", kw: ["open", "hour", "close", "time", "sunday", "ωράριο", "ανοιχτ", "κλειστ", "ώρα", "κυριακή"], reply: function () { var st = document.querySelector("[data-open-label]"); return (st ? st.textContent + ". " : "") + HOURS_TXT[lang()]; } },
    { id: "orders", kw: ["my order", "order status", "track", "where is my", "history", "order", "παραγγελ", "ιστορικό", "κατάσταση"], reply: function () {
        var me = window.ATHShop && window.ATHShop.Account.me();
        if (!me) return { en: "Sign in to see your orders: " + base + "login.html", el: "Συνδεθείτε για να δείτε τις παραγγελίες σας: " + base + "login.html" }[lang()];
        if (!me.orders.length) return { en: "You have no orders yet.", el: "Δεν έχετε παραγγελίες ακόμη." }[lang()];
        var o = me.orders[0];
        return { en: "Your latest order #" + o.id + " (" + money(o.total) + ") is " + t("order.status." + (o.status || "preparing")).toLowerCase() + ". You have " + me.orders.length + " orders in total — see " + base + "account.html#orders", el: "Η τελευταία σας παραγγελία #" + o.id + " (" + money(o.total) + ") είναι: " + t("order.status." + (o.status || "preparing")).toLowerCase() + ". Έχετε " + me.orders.length + " παραγγελίες — δείτε " + base + "account.html#orders" }[lang()]; } },
    { id: "where", kw: ["where", "address", "location", "parking", "directions", "πού", "διεύθυνση", "πάρκινγκ", "οδηγίες"], reply: { en: "We're at 26 John Kennedy Avenue, Pallouriotissa, 1046 Nicosia, with free parking on site. Directions: https://www.google.com/maps/dir/?api=1&destination=26+John+Kennedy+Pallouriotissa+Nicosia", el: "Βρισκόμαστε στη λεωφόρο Τζων Κέννεντυ 26, Παλλουριώτισσα, 1046 Λευκωσία, με δωρεάν στάθμευση. Οδηγίες: https://www.google.com/maps/dir/?api=1&destination=26+John+Kennedy+Pallouriotissa+Nicosia" } },
    { id: "phone", kw: ["phone", "call", "contact", "email", "τηλέφωνο", "καλέσ", "επικοινων"], reply: { en: "Call 22 877 909 (phone orders until 18:00) or email info@athienitis.com. The contact form is at " + base + "contact.html", el: "Καλέστε 22 877 909 (τηλεφωνικές παραγγελίες μέχρι 18:00) ή email info@athienitis.com. Φόρμα επικοινωνίας: " + base + "contact.html" } },
    { id: "offers", kw: ["offer", "discount", "deal", "sale", "cheap", "προσφορ", "έκπτωσ", "φθην"], reply: function () {
        var d = C.products.filter(function (p) { return p.was; }).slice(0, 5);
        return { en: "This week's top offers: ", el: "Κορυφαίες προσφορές εβδομάδας: " }[lang()] + d.map(function (p) { return name(p) + " " + money(p.price) + " (" + money(p.was) + ")"; }).join(" · ") + ". " + { en: "All offers: ", el: "Όλες οι προσφορές: " }[lang()] + base + "offers.html"; } },
    { id: "bonus", kw: ["bonus", "point", "loyalty", "member", "card", "πόντ", "μέλος", "κάρτα"], reply: function () {
        var me = window.ATHShop && window.ATHShop.Account.me();
        var mine = me ? { en: " You currently have " + (me.bonus || 0) + " points.", el: " Έχετε αυτή τη στιγμή " + (me.bonus || 0) + " πόντους." }[lang()] : "";
        return { en: "The Bonus Card is free: 1 point per €1, double points on Wednesdays, member prices in the Cellar and Delicatessen. Points are redeemed at the till.", el: "Η Bonus Card είναι δωρεάν: 1 πόντος ανά €1, διπλοί πόντοι Τετάρτη, τιμές μέλους σε Κάβα και Αλλαντικά. Εξαργύρωση στο ταμείο." }[lang()] + mine; } },
    { id: "delivery", kw: ["deliver", "restaurant", "business", "wholesale", "trade", "bundle", "invoice", "διανομ", "εστιατόρ", "επιχείρησ", "χονδρικ", "πακέτ", "τιμολόγ"], reply: { en: "Business accounts get delivery across Nicosia (bakery and fresh from 06:00), 5% off every order and one monthly invoice. See the bundles at " + base + "business.html or open a business account at " + base + "register.html?type=business", el: "Οι επαγγελματικοί λογαριασμοί έχουν διανομή σε όλη τη Λευκωσία (φούρνος και φρέσκα από 06:00), 5% έκπτωση και μηνιαίο τιμολόγιο. Πακέτα: " + base + "business.html ή ανοίξτε λογαριασμό: " + base + "register.html?type=business" } },
    { id: "app", kw: ["app", "application", "download", "ios", "android", "εφαρμογ", "κατεβάσ"], reply: { en: "The Athienitis app is coming soon to the App Store and Google Play: order from every counter, pick a collection slot and pay in-app. Leave your email at " + base + "app.html to be notified.", el: "Η εφαρμογή Athienitis έρχεται σύντομα σε App Store και Google Play: παραγγελία από κάθε πάγκο, ώρα παραλαβής και πληρωμή στην εφαρμογή. Αφήστε email στο " + base + "app.html" } },
    { id: "basket", kw: ["basket", "cart", "checkout", "καλάθι", "ταμείο"], reply: function () { var n = window.ATHShop ? window.ATHShop.Cart.count() : 0; return { en: "You have " + n + " items in your basket. Open it from the basket icon at the top right and press “Place order” — collection in-store, or delivery for business accounts.", el: "Έχετε " + n + " προϊόντα στο καλάθι. Ανοίξτε το από το εικονίδιο πάνω δεξιά και πατήστε «Ολοκλήρωση παραγγελίας» — παραλαβή από το κατάστημα ή διανομή για επιχειρήσεις." }[lang()]; } },
    { id: "human", kw: ["human", "person", "staff", "someone", "άνθρωπ", "υπάλληλ", "κάποιον"], reply: { en: "Of course — call 22 877 909 during opening hours and a team member will help, or leave a message at " + base + "contact.html", el: "Φυσικά — καλέστε 22 877 909 τις ώρες λειτουργίας, ή αφήστε μήνυμα στο " + base + "contact.html" } },
  ];

  function productSearch(q) {
    var r = window.ATHShop ? window.ATHShop.search(q) : [];
    if (!r.length) {
      // try individual words
      q.split(/\s+/).filter(function (w) { return w.length > 3; }).forEach(function (w) { r = r.concat(window.ATHShop ? window.ATHShop.search(w) : []); });
    }
    var seen = {}; return r.filter(function (p) { if (seen[p.id]) return false; seen[p.id] = true; return true; });
  }

  function localAnswer(q) {
    var s = q.toLowerCase();
    for (var i = 0; i < INTENTS.length; i++) {
      var it = INTENTS[i];
      for (var k = 0; k < it.kw.length; k++) if (s.indexOf(it.kw[k]) !== -1) { var r = it.reply; return typeof r === "function" ? r() : r[lang()]; }
    }
    var found = productSearch(q).slice(0, 4);
    if (found.length) {
      return { en: "I found these: ", el: "Βρήκα αυτά: " }[lang()] + found.map(function (p) { return name(p) + " — " + money(p.price) + "/" + t("unit." + p.unit) + " (" + t("dept." + p.section) + ")"; }).join(" · ") + ". " + { en: "Search all products: ", el: "Αναζήτηση: " }[lang()] + base + "search.html?q=" + encodeURIComponent(q);
    }
    return { en: "I'm not sure about that one. I can help with hours, location, offers, products, your orders, the Bonus Card, business deliveries or the app — or call 22 877 909 to speak to the team.", el: "Δεν είμαι σίγουρος για αυτό. Μπορώ να βοηθήσω με ωράριο, τοποθεσία, προσφορές, προϊόντα, παραγγελίες, Bonus Card, διανομές ή την εφαρμογή — ή καλέστε 22 877 909." }[lang()];
  }

  function linkify(s) { return esc(s).replace(/(https?:\/\/\S+|(?:\.\.\/)?[a-z0-9/-]+\.html(?:[#?]\S*)?)/g, function (m) { return '<a href="' + m + '">' + m.replace(/^https?:\/\/www\.google\.com\S+/, "Google Maps") + '</a>'; }); }

  function build() {
    var wrap = document.createElement("div"); wrap.className = "ai";
    wrap.innerHTML = '<button class="ai__fab" type="button" aria-label="Chat" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg><span class="ai__fab-dot"></span></button>' +
      '<div class="ai__panel" role="dialog" aria-label="Assistant" hidden><div class="ai__head"><div><b data-i18n="ai.title"></b><small data-i18n="ai.sub"></small></div><button class="icon-btn" type="button" data-ai-close aria-label="Close">×</button></div>' +
      '<div class="ai__log"></div><div class="ai__chips"></div>' +
      '<form class="ai__form"><input type="text" autocomplete="off" data-i18n="ai.placeholder" data-i18n-attr="placeholder"><button class="btn btn--primary btn--sm" type="submit" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></form></div>';
    document.body.appendChild(wrap);
    var fab = wrap.querySelector(".ai__fab"), panel = wrap.querySelector(".ai__panel"), log = wrap.querySelector(".ai__log"), form = wrap.querySelector(".ai__form"), input = form.querySelector("input"), chips = wrap.querySelector(".ai__chips");
    var history = [];

    function add(role, text) {
      var el = document.createElement("div"); el.className = "ai__msg ai__msg--" + role; el.innerHTML = role === "bot" ? linkify(text) : esc(text);
      log.appendChild(el); log.scrollTop = log.scrollHeight; history.push({ role: role === "bot" ? "assistant" : "user", content: text });
    }
    function typing(on) { var x = log.querySelector(".ai__typing"); if (on && !x) { x = document.createElement("div"); x.className = "ai__msg ai__msg--bot ai__typing"; x.innerHTML = "<i></i><i></i><i></i>"; log.appendChild(x); log.scrollTop = log.scrollHeight; } if (!on && x) x.remove(); }
    function renderChips() {
      var keys = ["ai.c1", "ai.c2", "ai.c3", "ai.c4"];
      chips.innerHTML = keys.map(function (k) { return '<button type="button" class="ai__chip">' + esc(t(k)) + '</button>'; }).join("");
    }
    function ask(q) {
      if (!q.trim()) return; add("user", q); input.value = ""; typing(true);
      var done = function (reply) { setTimeout(function () { typing(false); add("bot", reply); }, 500 + Math.min(q.length * 12, 900)); };
      if (window.AI_ENDPOINT) {
        fetch(window.AI_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history, lang: lang(), context: { hours: HOURS_TXT.en, offers: C.products.filter(function (p) { return p.was; }).map(function (p) { return p.name.en + " " + p.price; }) } }) })
          .then(function (r) { return r.json(); }).then(function (j) { done(j.reply || localAnswer(q)); }).catch(function () { done(localAnswer(q)); });
      } else done(localAnswer(q));
    }
    function open(o) {
      panel.hidden = !o; fab.setAttribute("aria-expanded", o ? "true" : "false"); wrap.classList.toggle("is-open", o);
      if (o) { if (!log.children.length) { add("bot", t("ai.hello")); renderChips(); } setTimeout(function () { input.focus(); }, 50); fab.querySelector(".ai__fab-dot").hidden = true; }
    }
    fab.addEventListener("click", function () { open(panel.hidden); });
    wrap.querySelector("[data-ai-close]").addEventListener("click", function () { open(false); });
    form.addEventListener("submit", function (e) { e.preventDefault(); ask(input.value); });
    chips.addEventListener("click", function (e) { var b = e.target.closest(".ai__chip"); if (b) ask(b.textContent); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) open(false); });
    if (window.ATH) window.ATH.onLang(function () { if (!panel.hidden || log.children.length) renderChips(); var nodes = wrap.querySelectorAll("[data-i18n]"); nodes.forEach(function (n) { var k = n.getAttribute("data-i18n"), a = n.getAttribute("data-i18n-attr"); if (a) n.setAttribute(a, t(k)); else n.textContent = t(k); }); });
    // initial i18n
    wrap.querySelectorAll("[data-i18n]").forEach(function (n) { var k = n.getAttribute("data-i18n"), a = n.getAttribute("data-i18n-attr"); if (a) n.setAttribute(a, t(k)); else n.textContent = t(k); });
  }
  document.addEventListener("DOMContentLoaded", build);
})();
