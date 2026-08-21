/* ==========================================================================
   Athienitis Supermarket — site scripts
   No build step, no dependencies. Works on GitHub Pages as-is.
   ========================================================================== */
(function () {
  "use strict";

  /* -----------------------------------------------------------------------
     1. Opening hours  →  "Open now" / "Closed" badge + today highlight
     Edit the HOURS table to match the real store schedule.
     Format: [open, close] in 24h "HH:MM", or null for closed. Index 0 = Sunday.
     ----------------------------------------------------------------------- */
  var HOURS = [
    ["09:00", "18:00"], // Sun
    ["07:30", "20:00"], // Mon
    ["07:30", "20:00"], // Tue
    ["07:30", "20:00"], // Wed
    ["07:30", "20:00"], // Thu
    ["07:30", "20:00"], // Fri
    ["07:30", "20:00"]  // Sat
  ];

  function toMinutes(hhmm) {
    var p = hhmm.split(":");
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  function nowInCyprus() {
    // Store is in Nicosia; compute "now" in Europe/Nicosia regardless of visitor timezone.
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Nicosia", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
      }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (x) { map[x.type] = x.value; });
      var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return { day: days.indexOf(map.weekday), minutes: parseInt(map.hour, 10) % 24 * 60 + parseInt(map.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function updateOpenStatus() {
    var now = nowInCyprus();
    var today = HOURS[now.day];
    var isOpen = false;
    var closesAt = "";
    if (today) {
      var o = toMinutes(today[0]), c = toMinutes(today[1]);
      isOpen = now.minutes >= o && now.minutes < c;
      closesAt = today[1];
    }
    document.querySelectorAll("[data-open-status]").forEach(function (el) {
      el.classList.toggle("is-open", isOpen);
      el.classList.toggle("is-closed", !isOpen);
      var label = el.querySelector("[data-open-label]");
      if (label) {
        label.setAttribute("data-i18n", isOpen ? "status.open" : "status.closed");
        label.setAttribute("data-i18n-arg", closesAt);
      }
    });
    document.querySelectorAll("[data-hours-day]").forEach(function (li) {
      li.classList.toggle("is-today", parseInt(li.getAttribute("data-hours-day"), 10) === now.day);
    });
  }

  /* -----------------------------------------------------------------------
     2. Language switch (EN / EL) — no reload, persisted in localStorage.
     Any element with data-i18n="key" gets its text replaced.
     ----------------------------------------------------------------------- */
  var I18N = {
    en: {
      "status.open": "Open now · closes {0}",
      "status.closed": "Closed now · see hours",
      "topbar.phone": "Call us",
      "nav.about": "About",
      "nav.market": "The Market",
      "nav.living": "Living",
      "nav.gifts": "Gifts & Other",
      "nav.eatery": "Eatery",
      "nav.bonus": "Bonus Card",
      "nav.contact": "Contact",
      "nav.orders": "Order online",
      "nav.departments": "All departments",

      "hero.eyebrow": "Pallouriotissa, Nicosia · since 1963",
      "hero.title": "Your neighbourhood supermarket, done properly.",
      "hero.lead": "Fresh bread from our own bakery, a butcher who knows your name, and a cellar worth browsing. Everything for the house, in one friendly place on John Kennedy Avenue.",
      "hero.cta1": "Explore the departments",
      "hero.cta2": "Weekly offers",
      "hero.meta1": "years serving Nicosia",
      "hero.meta2": "specialist counters",
      "hero.meta3": "days a week",

      "sticker.a.s": "Fresh daily", "sticker.a.b": "Bakery & Butchery",
      "sticker.b.s": "The Cellar", "sticker.b.b": "Wines & spirits",
      "sticker.c.s": "For the home", "sticker.c.b": "Living & Gifts",
      "sticker.d.s": "Members", "sticker.d.b": "Bonus Card",

      "ticker.1": "Fresh bread out of the oven from 07:00",
      "ticker.2": "Bonus Card members: extra points every Wednesday",
      "ticker.3": "Butchery: order ahead by phone, pick up in-store",
      "ticker.4": "Eatery open for lunch from 11:30",

      "depts.eyebrow": "Our stations",
      "depts.title": "Every counter, run by people who care about it.",
      "depts.lead": "The market is organised into specialist stations. Pick a counter below to see what's on, who runs it, and what to ask for.",
      "depts.all": "See all departments",
      "dept.tag.fresh": "Fresh daily",
      "dept.tag.new": "New",
      "dept.bakery": "Bakery", "dept.bakery.p": "Village bread, koulouri and pastries baked on site every morning.",
      "dept.butchery": "Butchery", "dept.butchery.p": "Cypriot and imported meats, cut to order. Sheftalia and souvla prepared in-house.",
      "dept.deli": "Delicatessen", "dept.deli.p": "Halloumi, cured meats, olives and cheeses from Cyprus and across Europe.",
      "dept.fish": "Fish Market", "dept.fish.p": "Daily catch on ice, cleaned and filleted while you wait.",
      "dept.fruit": "Fruit Market", "dept.fruit.p": "Seasonal produce, much of it from local growers.",
      "dept.cellar": "The Cellar", "dept.cellar.p": "Cypriot wines, Commandaria, zivania and an international selection.",
      "dept.eatery": "Eatery", "dept.eatery.p": "Sit down for a proper lunch or grab something hot to take home.",
      "dept.living": "Living", "dept.living.p": "Bed & bath, kitchenware, candles and DIY for the home.",
      "dept.gifts": "Gifts & Other", "dept.gifts.p": "Beauty, clothing, stationery and toys — for every occasion.",
      "dept.link": "Visit the counter",

      "story.eyebrow": "About us",
      "story.title": "Sixty years on the same corner.",
      "story.p1": "Athienitis was one of the first supermarkets in Nicosia. It opened in 1963 with a simple promise: the best quality at the lowest possible price. That promise hasn't changed; the shop around it has grown into a full market with its own bakery, butchery, fish counter and cellar.",
      "story.p2": "It is still family-run, and most of the people behind the counters have been here for years. Come in and ask them anything.",
      "story.cta": "Read our story",
      "story.t1": "First store opens in Pallouriotissa, Nicosia.",
      "story.t2": "Bakery and butchery counters added.",
      "story.t3": "Living, Gifts and The Cellar join the market.",
      "story.t4": "Bonus Card launches; online ordering begins.",
      "story.photo": "Photo placeholder — storefront or bakery counter",
      "story.badge": "years of service",

      "offers.eyebrow": "This week",
      "offers.title": "Offers worth the trip.",
      "offers.lead": "A rotating selection from across the market. Prices valid in-store until Sunday.",
      "offers.all": "All offers",
      "offers.save": "Save",
      "offer.1.c": "Bakery", "offer.1.n": "Village bread, 1kg",
      "offer.2.c": "Butchery", "offer.2.n": "Pork souvla, per kg",
      "offer.3.c": "Delicatessen", "offer.3.n": "Halloumi, 250g",
      "offer.4.c": "The Cellar", "offer.4.n": "Xynisteri, 750ml",
      "offer.img": "Product photo",
      "photo": "Photo placeholder",

      "bonus.eyebrow": "Bonus Card",
      "bonus.title": "Points on every visit. Free to join.",
      "bonus.lead": "Collect points on every purchase and redeem them at the till. Members also get early access to offers and double points on selected days.",
      "bonus.perk1": "1 point for every €1 spent, redeemed instantly at checkout",
      "bonus.perk2": "Double points every Wednesday across the whole market",
      "bonus.perk3": "Member-only prices in the Cellar and Delicatessen",
      "bonus.cta": "Join the Bonus Card",
      "bonus.card.s": "Bonus Card", "bonus.card.member": "Member", "bonus.card.since": "Since 1963",

      "visit.eyebrow": "Visit us",
      "visit.title": "Find us on John Kennedy Avenue.",
      "visit.lead": "Free parking on site. Phone orders for the butchery and bakery are welcome.",
      "visit.hours": "Opening hours",
      "visit.directions": "Get directions",
      "day.0": "Sunday", "day.1": "Monday", "day.2": "Tuesday", "day.3": "Wednesday", "day.4": "Thursday", "day.5": "Friday", "day.6": "Saturday",

      "news.title": "Get the weekly offers by email.",
      "news.lead": "One email every Monday. No spam, unsubscribe any time.",
      "news.placeholder": "Your email address",
      "news.cta": "Subscribe",
      "news.note": "By subscribing you agree to our privacy policy.",

      "footer.tag": "One of the first supermarkets in Nicosia. Serving Pallouriotissa since 1963.",
      "footer.market": "The Market", "footer.home": "Home & Gifts", "footer.company": "Company",
      "footer.privacy": "Privacy", "footer.terms": "Terms",
      "footer.rights": "All rights reserved.",

      "form.success": "Thank you — your message has been sent. We'll reply within one working day.",
      "contact.title": "We're happy to help.",
      "contact.lead": "Questions about a product, an order or the Bonus Card? Call, visit or send us a message below.",
      "contact.send": "Send message"
    },
    el: {
      "status.open": "Ανοιχτά τώρα · κλείνουμε {0}",
      "status.closed": "Κλειστά τώρα · δείτε ωράριο",
      "topbar.phone": "Καλέστε μας",
      "nav.about": "Σχετικά",
      "nav.market": "Η Αγορά",
      "nav.living": "Σπίτι",
      "nav.gifts": "Δώρα & Άλλα",
      "nav.eatery": "Εστιατόριο",
      "nav.bonus": "Bonus Card",
      "nav.contact": "Επικοινωνία",
      "nav.orders": "Παραγγελία online",
      "nav.departments": "Όλα τα τμήματα",

      "hero.eyebrow": "Παλλουριώτισσα, Λευκωσία · από το 1963",
      "hero.title": "Η υπεραγορά της γειτονιάς σας, όπως πρέπει.",
      "hero.lead": "Φρέσκο ψωμί από τον δικό μας φούρνο, κρεοπώλης που σας ξέρει με το όνομα και κάβα που αξίζει μια βόλτα. Όλα για το σπίτι, σε ένα φιλικό μέρος στη λεωφόρο Τζων Κέννεντυ.",
      "hero.cta1": "Δείτε τα τμήματα",
      "hero.cta2": "Προσφορές εβδομάδας",
      "hero.meta1": "χρόνια στη Λευκωσία",
      "hero.meta2": "εξειδικευμένοι πάγκοι",
      "hero.meta3": "μέρες την εβδομάδα",

      "sticker.a.s": "Φρέσκα καθημερινά", "sticker.a.b": "Φούρνος & Κρεοπωλείο",
      "sticker.b.s": "Η Κάβα", "sticker.b.b": "Κρασιά & ποτά",
      "sticker.c.s": "Για το σπίτι", "sticker.c.b": "Σπίτι & Δώρα",
      "sticker.d.s": "Μέλη", "sticker.d.b": "Bonus Card",

      "ticker.1": "Φρέσκο ψωμί από τον φούρνο από τις 07:00",
      "ticker.2": "Μέλη Bonus Card: επιπλέον πόντοι κάθε Τετάρτη",
      "ticker.3": "Κρεοπωλείο: παραγγείλτε τηλεφωνικά, παραλάβετε στο κατάστημα",
      "ticker.4": "Το εστιατόριο ανοίγει για μεσημεριανό από τις 11:30",

      "depts.eyebrow": "Τα τμήματά μας",
      "depts.title": "Κάθε πάγκος, από ανθρώπους που τον νοιάζονται.",
      "depts.lead": "Η αγορά είναι οργανωμένη σε εξειδικευμένα τμήματα. Επιλέξτε έναν πάγκο για να δείτε τι υπάρχει και τι να ζητήσετε.",
      "depts.all": "Όλα τα τμήματα",
      "dept.tag.fresh": "Φρέσκα καθημερινά",
      "dept.tag.new": "Νέο",
      "dept.bakery": "Φούρνος", "dept.bakery.p": "Χωριάτικο ψωμί, κουλούρι και γλυκά που ψήνονται επί τόπου κάθε πρωί.",
      "dept.butchery": "Κρεοπωλείο", "dept.butchery.p": "Κυπριακά και εισαγόμενα κρέατα, κομμένα κατά παραγγελία. Σεφταλιά και σούβλα δικής μας παρασκευής.",
      "dept.deli": "Αλλαντικά & Τυριά", "dept.deli.p": "Χαλλούμι, αλλαντικά, ελιές και τυριά από την Κύπρο και όλη την Ευρώπη.",
      "dept.fish": "Ιχθυοπωλείο", "dept.fish.p": "Ψάρια ημέρας στον πάγο, καθαρισμένα και φιλεταρισμένα όσο περιμένετε.",
      "dept.fruit": "Οπωροπωλείο", "dept.fruit.p": "Εποχιακά φρούτα και λαχανικά, πολλά από ντόπιους παραγωγούς.",
      "dept.cellar": "Η Κάβα", "dept.cellar.p": "Κυπριακά κρασιά, Κουμανδαρία, ζιβανία και διεθνής συλλογή.",
      "dept.eatery": "Εστιατόριο", "dept.eatery.p": "Καθίστε για ένα σωστό μεσημεριανό ή πάρτε κάτι ζεστό για το σπίτι.",
      "dept.living": "Σπίτι", "dept.living.p": "Λευκά είδη, είδη κουζίνας, κεριά και DIY για το σπίτι.",
      "dept.gifts": "Δώρα & Άλλα", "dept.gifts.p": "Ομορφιά, ρούχα, χαρτικά και παιχνίδια — για κάθε περίσταση.",
      "dept.link": "Επισκεφθείτε τον πάγκο",

      "story.eyebrow": "Σχετικά με εμάς",
      "story.title": "Εξήντα χρόνια στην ίδια γωνιά.",
      "story.p1": "Η Αθηαινίτης ήταν μία από τις πρώτες υπεραγορές της Λευκωσίας. Άνοιξε το 1963 με μια απλή υπόσχεση: η καλύτερη ποιότητα στη χαμηλότερη δυνατή τιμή. Η υπόσχεση δεν άλλαξε· το κατάστημα γύρω της μεγάλωσε σε μια πλήρη αγορά με δικό της φούρνο, κρεοπωλείο, ιχθυοπωλείο και κάβα.",
      "story.p2": "Παραμένει οικογενειακή επιχείρηση, και οι περισσότεροι πίσω από τους πάγκους είναι εδώ χρόνια. Ελάτε και ρωτήστε τους οτιδήποτε.",
      "story.cta": "Η ιστορία μας",
      "story.t1": "Ανοίγει το πρώτο κατάστημα στην Παλλουριώτισσα.",
      "story.t2": "Προστίθενται φούρνος και κρεοπωλείο.",
      "story.t3": "Σπίτι, Δώρα και Η Κάβα εντάσσονται στην αγορά.",
      "story.t4": "Ξεκινά η Bonus Card και οι online παραγγελίες.",
      "story.photo": "Θέση φωτογραφίας — πρόσοψη ή πάγκος φούρνου",
      "story.badge": "χρόνια υπηρεσίας",

      "offers.eyebrow": "Αυτή την εβδομάδα",
      "offers.title": "Προσφορές που αξίζουν τη βόλτα.",
      "offers.lead": "Επιλογή από όλη την αγορά. Οι τιμές ισχύουν στο κατάστημα μέχρι την Κυριακή.",
      "offers.all": "Όλες οι προσφορές",
      "offers.save": "Κέρδος",
      "offer.1.c": "Φούρνος", "offer.1.n": "Χωριάτικο ψωμί, 1kg",
      "offer.2.c": "Κρεοπωλείο", "offer.2.n": "Χοιρινή σούβλα, το κιλό",
      "offer.3.c": "Αλλαντικά", "offer.3.n": "Χαλλούμι, 250g",
      "offer.4.c": "Η Κάβα", "offer.4.n": "Ξυνιστέρι, 750ml",
      "offer.img": "Φωτογραφία προϊόντος",
      "photo": "Θέση φωτογραφίας",

      "bonus.eyebrow": "Bonus Card",
      "bonus.title": "Πόντοι σε κάθε επίσκεψη. Δωρεάν εγγραφή.",
      "bonus.lead": "Συλλέξτε πόντους με κάθε αγορά και εξαργυρώστε τους στο ταμείο. Τα μέλη έχουν πρόσβαση πρώτα στις προσφορές και διπλούς πόντους σε επιλεγμένες μέρες.",
      "bonus.perk1": "1 πόντος για κάθε €1, άμεση εξαργύρωση στο ταμείο",
      "bonus.perk2": "Διπλοί πόντοι κάθε Τετάρτη σε όλη την αγορά",
      "bonus.perk3": "Τιμές μόνο για μέλη στην Κάβα και τα Αλλαντικά",
      "bonus.cta": "Γίνετε μέλος",
      "bonus.card.s": "Bonus Card", "bonus.card.member": "Μέλος", "bonus.card.since": "Από το 1963",

      "visit.eyebrow": "Επισκεφθείτε μας",
      "visit.title": "Βρείτε μας στη λεωφόρο Τζων Κέννεντυ.",
      "visit.lead": "Δωρεάν στάθμευση. Δεχόμαστε τηλεφωνικές παραγγελίες για κρεοπωλείο και φούρνο.",
      "visit.hours": "Ωράριο λειτουργίας",
      "visit.directions": "Οδηγίες",
      "day.0": "Κυριακή", "day.1": "Δευτέρα", "day.2": "Τρίτη", "day.3": "Τετάρτη", "day.4": "Πέμπτη", "day.5": "Παρασκευή", "day.6": "Σάββατο",

      "news.title": "Οι προσφορές της εβδομάδας στο email σας.",
      "news.lead": "Ένα email κάθε Δευτέρα. Χωρίς spam, διαγραφή όποτε θέλετε.",
      "news.placeholder": "Το email σας",
      "news.cta": "Εγγραφή",
      "news.note": "Με την εγγραφή αποδέχεστε την πολιτική απορρήτου.",

      "footer.tag": "Μία από τις πρώτες υπεραγορές της Λευκωσίας. Στην Παλλουριώτισσα από το 1963.",
      "footer.market": "Η Αγορά", "footer.home": "Σπίτι & Δώρα", "footer.company": "Εταιρεία",
      "footer.privacy": "Απόρρητο", "footer.terms": "Όροι",
      "footer.rights": "Με επιφύλαξη παντός δικαιώματος.",

      "form.success": "Ευχαριστούμε — το μήνυμά σας στάλθηκε. Θα απαντήσουμε εντός μίας εργάσιμης ημέρας.",
      "contact.title": "Είμαστε εδώ για να βοηθήσουμε.",
      "contact.lead": "Ερωτήσεις για προϊόν, παραγγελία ή Bonus Card; Καλέστε, επισκεφθείτε μας ή στείλτε μήνυμα.",
      "contact.send": "Αποστολή"
    }
  };

  var currentLang = "en";

  function t(key, arg) {
    var dict = I18N[currentLang] || I18N.en;
    var s = dict[key] != null ? dict[key] : (I18N.en[key] != null ? I18N.en[key] : key);
    return arg != null ? s.replace("{0}", arg) : s;
  }

  function applyLang(lang) {
    currentLang = I18N[lang] ? lang : "en";
    document.documentElement.lang = currentLang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var arg = el.getAttribute("data-i18n-arg");
      var attr = el.getAttribute("data-i18n-attr");
      var value = t(key, arg);
      if (attr) el.setAttribute(attr, value); else el.textContent = value;
    });
    document.querySelectorAll("[data-lang]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-lang") === currentLang ? "true" : "false");
    });
    try { localStorage.setItem("athienitis-lang", currentLang); } catch (e) { /* private mode */ }
  }

  function initLang() {
    var saved = null;
    try { saved = localStorage.getItem("athienitis-lang"); } catch (e) { /* ignore */ }
    if (!saved && /^el\b/i.test(navigator.language || "")) saved = "el";
    updateOpenStatus();
    applyLang(saved || "en");
    document.querySelectorAll("[data-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () { applyLang(btn.getAttribute("data-lang")); });
    });
    // keep the badge fresh if the tab stays open
    setInterval(function () { updateOpenStatus(); applyLang(currentLang); }, 60000);
  }

  /* -----------------------------------------------------------------------
     3. Header: scrolled state, mega menus, mobile drawer
     ----------------------------------------------------------------------- */
  function initHeader() {
    var header = document.querySelector(".header");
    if (header) {
      var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    // Mega menus (click to open, click outside / Esc to close)
    var items = Array.prototype.slice.call(document.querySelectorAll(".nav > li[data-menu]"));
    function closeAll(except) {
      items.forEach(function (li) {
        if (li !== except) {
          li.setAttribute("data-open", "false");
          var b = li.querySelector(".nav__btn");
          if (b) b.setAttribute("aria-expanded", "false");
        }
      });
    }
    items.forEach(function (li) {
      var btn = li.querySelector(".nav__btn");
      if (!btn) return;
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = li.getAttribute("data-open") === "true";
        closeAll(li);
        li.setAttribute("data-open", open ? "false" : "true");
        btn.setAttribute("aria-expanded", open ? "false" : "true");
      });
    });
    document.addEventListener("click", function () { closeAll(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAll(); });

    // Mobile drawer
    var burger = document.querySelector(".burger");
    var drawer = document.querySelector(".drawer");
    if (burger && drawer) {
      burger.addEventListener("click", function () {
        var open = burger.getAttribute("aria-expanded") === "true";
        burger.setAttribute("aria-expanded", open ? "false" : "true");
        drawer.classList.toggle("is-open", !open);
        document.body.style.overflow = open ? "" : "hidden";
      });
      drawer.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          burger.setAttribute("aria-expanded", "false");
          drawer.classList.remove("is-open");
          document.body.style.overflow = "";
        });
      });
    }
  }

  /* -----------------------------------------------------------------------
     4. Scroll reveal (respects prefers-reduced-motion via CSS)
     ----------------------------------------------------------------------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* -----------------------------------------------------------------------
     5. Sub-navigation active state (departments page)
     ----------------------------------------------------------------------- */
  function initSubnav() {
    var links = document.querySelectorAll(".subnav a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("is-active"); });
          var a = map[en.target.id];
          if (a) a.classList.add("is-active");
        }
      });
    }, { rootMargin: "-40% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) io.observe(sec);
    });
  }

  /* -----------------------------------------------------------------------
     6. Forms — GitHub Pages has no backend. Forms post to a form service
     (Formspree etc.) when data-endpoint is set; otherwise they show the
     success state locally so the demo still works.
     ----------------------------------------------------------------------- */
  function initForms() {
    document.querySelectorAll("form[data-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        var endpoint = form.getAttribute("data-endpoint");
        var success = form.parentElement.querySelector(".form-success");
        var done = function () {
          form.reset();
          if (success) { success.classList.add("is-visible"); success.focus && success.focus(); }
        };
        if (endpoint) {
          fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
            .then(done)
            .catch(function () { alert("Could not send right now. Please call us or try again later."); });
        } else {
          done();
        }
      });
    });
  }

  /* -----------------------------------------------------------------------
     7. Footer year
     ----------------------------------------------------------------------- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLang();
    initHeader();
    initReveal();
    initSubnav();
    initForms();
    initYear();
  });
})();
