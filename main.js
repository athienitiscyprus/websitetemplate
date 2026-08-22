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
      "nav.orders": "Get the app",
      "nav.blog": "Blog",
      "nav.home": "Home",
      "nav.faq": "FAQ",
      "nav.app": "The App",
      "nav.departments": "All departments",

      "hero.eyebrow": "Pallouriotissa, Nicosia · since 1963",
      "hero.title": "Your neighbourhood supermarket,",
      "hero.lead": "Fresh bread from our own bakery, a butcher who knows your name, and a cellar worth browsing. Everything for the house, in one friendly place on John Kennedy Avenue.",
      "hero.cta1": "Explore the departments",
      "story.t4": "Bonus Card launches; the Athienitis app is announced.",
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
      "contact.send": "Send message",
      "contact.formtitle": "Send us a message",
      "contact.ordernote": "Looking to order? Phone orders are welcome on 22 877 909 — and the Athienitis app is coming soon.",

      "app.eyebrow": "Coming soon",
      "app.title": "The whole market, in your pocket.",
      "app.lead": "The Athienitis app lets you order from every counter, pick a collection slot, pay in-app and track Bonus Card points — launching soon on the App Store and Google Play.",
      "app.f1": "Order from all nine counters", "app.f1.p": "Butchery cuts, bakery orders, deli platters and the weekly shop in one basket.",
      "app.f2": "Choose a pickup slot", "app.f2.p": "Pick a 30-minute window. Your order is packed and waiting at the collection desk.",
      "app.f3": "Bonus Card built in", "app.f3.p": "Scan at the till, see your points live, redeem with one tap.",
      "app.f4": "Home delivery in Nicosia", "app.f4.p": "Same-day delivery within the city, planned for the first update.",
      "app.notify": "Get notified at launch",
      "app.store": "Download on the App Store", "app.play": "Get it on Google Play", "app.soon": "Coming soon",
      "app.phone.greet": "Good morning, Andreas",
      "app.phone.points": "Bonus points",
      "app.phone.order": "Your order",
      "app.phone.ready": "Ready 11:30",
      "app.cta.home": "Order via the app",
      "app.banner": "Ordering is moving to the Athienitis app. Until launch, phone orders are welcome.",

      "blog.eyebrow": "From the counters",
      "blog.title": "Notes from the market.",
      "blog.lead": "Buying guides, recipes and seasonal news written by the people behind each counter.",
      "blog.read": "Read article", "blog.all": "All articles", "blog.min": "min read",
      "blog.back": "All articles", "blog.more": "More from the market",
      "blog.visit": "Visit the counter",

      "faq.eyebrow": "FAQ",
      "faq.title": "Questions people ask us.",
      "faq.lead": "Short, direct answers about the store, its departments, ordering and the Bonus Card.",
      "faq.more": "Didn't find it? Ask us directly.",

      "shop.items": "What you'll find", "shop.tip": "Counter tip", "shop.hours": "Hours",
      "shop.other": "Other counters", "shop.order": "Order ahead",
      "shop.add": "Add to basket", "shop.none": "No products to show.", "shop.products": "Products", "shop.deals": "Deals at this counter",
      "shop.allproducts": "All products at this counter",
      "unit.loaf": "loaf", "unit.each": "each", "unit.box": "box", "unit.kg": "kg", "unit.pack": "pack", "unit.platter": "platter", "unit.bunch": "bunch", "unit.jar": "jar", "unit.bottle": "bottle", "unit.portion": "portion", "unit.cup": "cup", "unit.slice": "slice", "unit.set": "set",
      "cart.title": "Your basket", "cart.empty": "Your basket is empty.", "cart.added": "Added to basket", "cart.items": "items",
      "cart.sub": "Subtotal", "cart.saved": "You save", "cart.trade": "Business discount (5%)", "cart.total": "Total", "cart.checkout": "Place order", "cart.continue": "Keep shopping", "cart.note": "Collection in-store · delivery for business accounts. Demo checkout — no payment is taken.",
      "search.placeholder": "Search products…", "search.none": "No products match.", "search.title": "Results for", "search.count": "products found",
      "account.login": "Sign in", "account.register": "Create account", "account.title": "Your account", "account.lead": "Sign in to order, track your basket and collect Bonus Card points.",
      "account.name": "Full name", "account.email": "Email", "account.password": "Password", "account.type": "Account type", "account.type.private": "Private customer", "account.type.business": "Business / restaurant",
      "account.err.invalid": "Email or password is incorrect.", "account.err.exists": "An account with this email already exists — sign in instead.",
      "account.hello": "Hello", "account.logout": "Sign out", "account.orders": "Your orders", "order.none": "No orders yet.", "order.status": "Being prepared", "order.placed": "Order placed — we'll have it ready for collection.",
      "account.demo": "Demo accounts are stored only in this browser.",
      "offers.in": "Offers in", "offers.page.title": "Every discount, in one place.", "offers.page.lead": "All reduced products across the nine counters. Prices valid in-store and via the app until Sunday.", "offers.count": "products on offer",
      "recipes.eyebrow": "Recipes", "recipes.title": "Cook it tonight.", "recipes.lead": "Simple dishes built from what's on our counters. Add all the ingredients to your basket in one tap.",
      "recipe.serves": "serves", "recipe.ingredients": "From the market", "recipe.method": "Method", "recipe.basket": "Ingredients total", "recipe.addall": "Add all to basket",
      "business.eyebrow": "For businesses", "business.title": "Delivery bundles for restaurants, cafés and hotels.", "business.lead": "Weekly or daily deliveries across Nicosia at trade prices. Choose a bundle or build your own with a business account (5% off every order).",
      "business.cta": "Open a business account", "bundle.add": "Add bundle to basket",
      "business.f1": "Delivered before service", "business.f1.p": "Bakery and fresh counters dispatch from 06:00; dry goods and cellar from 09:00.",
      "business.f2": "Invoiced monthly", "business.f2.p": "One VAT invoice per month, with product-level detail for your accountant.",
      "business.f3": "A dedicated contact", "business.f3.p": "One person who knows your menu and calls when something's better this week.",
      "nav.offers": "Offers", "nav.recipes": "Recipes", "nav.business": "For businesses", "nav.business.short": "Business", "nav.account": "Account",
      "home.recipes": "Three dinners from the counters", "home.business": "Run a kitchen? See the trade bundles",
      "home.more": "More from Athienitis", "m.counters": "Counters", "m.search": "Search", "cart.short": "Basket", "m.view": "View basket", "m.popular": "Popular searches", "m.deals": "deals",
      "manifesto.1": "Shop fresh bread,", "manifesto.2": "the day's catch", "manifesto.3": "and a proper bottle", "manifesto.4": "from people who've run the same counters for decades. One basket, one till, one friendly corner of Nicosia.",
      "how.eyebrow": "How it works", "how.title": "From the counter to your kitchen.", "how.badge": "Ready for collection",
      "how.s1": "Browse the counters", "how.s1.p": "Nine specialist counters online, with this week's offers and what's fresh today.",
      "how.s2": "Build your basket", "how.s2.p": "Add products, recipes or a whole business bundle. Sign in to keep it between visits.",
      "how.s3": "Collect or get it delivered", "how.s3.p": "Pick a slot. We pack it and it's waiting at the collection desk — or on your restaurant's doorstep.",
      "how.s4": "Earn Bonus points", "how.s4.p": "Every euro earns a point, doubled on Wednesdays. Redeem at the till with one tap.",
      "hero.rot.1": "done properly.", "hero.rot.2": "open 7 days.", "hero.rot.3": "since 1963.", "hero.rot.4": "in your pocket.", "home.app": "The app, coming soon", "home.gallery": "Inside the market",
      "order.status.preparing": "Being prepared", "order.status.collected": "Collected", "order.status.delivered": "Delivered", "order.reorder": "Order again",
      "account.overview": "Overview", "account.details": "Personal details", "account.address": "Delivery address", "account.noaddress": "No address saved yet", "account.saved": "Details saved",
      "account.phone": "Phone", "account.company": "Company name", "account.vat": "VAT number", "account.street": "Street & number", "account.area": "Area", "account.city": "City", "account.postcode": "Postcode", "account.notes": "Delivery notes", "account.save": "Save details",
      "account.points": "Bonus points", "account.ordersn": "Orders", "account.spent": "Total spent", "account.recent": "Recent orders", "account.viewall": "All orders", "account.welcome": "Welcome back,",
      "account.noaccount": "No account yet?", "account.have": "Already have an account?", "account.demo.title": "Try a demo account", "account.demo.lead": "One click signs you in. Password for all demo accounts is “demo”.",
      "account.login.lead": "Sign in to see your orders, reorder in one tap and track Bonus Card points.", "account.register.lead": "Takes a minute. Business accounts get delivery, 5% off and monthly invoicing.",
      "login.title": "Welcome back.", "register.title": "Create your account.",
      "ai.title": "Athienitis assistant", "ai.sub": "Answers in seconds · 24/7", "ai.placeholder": "Ask about hours, offers, products, orders…", "ai.hello": "Hi! I'm the Athienitis assistant. Ask me about opening hours, this week's offers, where to find a product, your orders or deliveries for your business.",
      "ai.c1": "What are the opening hours?", "ai.c2": "What's on offer this week?", "ai.c3": "Where is my order?", "ai.c4": "Do you deliver to restaurants?"
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
      "nav.orders": "Η εφαρμογή",
      "nav.blog": "Blog",
      "nav.home": "Αρχική",
      "nav.faq": "Συχνές ερωτήσεις",
      "nav.app": "Η Εφαρμογή",
      "nav.departments": "Όλα τα τμήματα",

      "hero.eyebrow": "Παλλουριώτισσα, Λευκωσία · από το 1963",
      "hero.title": "Η υπεραγορά της γειτονιάς σας,",
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
      "story.t4": "Ξεκινά η Bonus Card· ανακοινώνεται η εφαρμογή Athienitis.",
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
      "contact.send": "Αποστολή",
      "contact.formtitle": "Στείλτε μας μήνυμα",
      "contact.ordernote": "Θέλετε να παραγγείλετε; Τηλεφωνικά στο 22 877 909 — και η εφαρμογή Athienitis έρχεται σύντομα.",

      "app.eyebrow": "Έρχεται σύντομα",
      "app.title": "Όλη η αγορά, στην τσέπη σας.",
      "app.lead": "Η εφαρμογή Athienitis σάς επιτρέπει να παραγγέλνετε από κάθε πάγκο, να επιλέγετε ώρα παραλαβής, να πληρώνετε μέσα από την εφαρμογή και να παρακολουθείτε τους πόντους Bonus Card — σύντομα σε App Store και Google Play.",
      "app.f1": "Παραγγελία από όλους τους πάγκους", "app.f1.p": "Κρέατα, ψωμιά, πλατό τυριών και τα ψώνια της εβδομάδας σε ένα καλάθι.",
      "app.f2": "Επιλογή ώρας παραλαβής", "app.f2.p": "Διαλέξτε παράθυρο 30 λεπτών. Η παραγγελία σας είναι συσκευασμένη και σας περιμένει.",
      "app.f3": "Bonus Card ενσωματωμένη", "app.f3.p": "Σκανάρετε στο ταμείο, δείτε τους πόντους ζωντανά, εξαργυρώστε με ένα άγγιγμα.",
      "app.f4": "Διανομή στη Λευκωσία", "app.f4.p": "Αυθημερόν διανομή εντός πόλης, σχεδιασμένη για την πρώτη ενημέρωση.",
      "app.notify": "Ειδοποιήστε με στην κυκλοφορία",
      "app.store": "Κατεβάστε από το App Store", "app.play": "Διαθέσιμο στο Google Play", "app.soon": "Σύντομα",
      "app.phone.greet": "Καλημέρα, Ανδρέα",
      "app.phone.points": "Πόντοι Bonus",
      "app.phone.order": "Η παραγγελία σας",
      "app.phone.ready": "Έτοιμη 11:30",
      "app.cta.home": "Παραγγελία από την εφαρμογή",
      "app.banner": "Οι παραγγελίες μεταφέρονται στην εφαρμογή Athienitis. Μέχρι τότε, δεχόμαστε τηλεφωνικές παραγγελίες.",

      "blog.eyebrow": "Από τους πάγκους",
      "blog.title": "Σημειώσεις από την αγορά.",
      "blog.lead": "Οδηγοί αγοράς, συνταγές και εποχιακά νέα από τους ανθρώπους πίσω από κάθε πάγκο.",
      "blog.read": "Διαβάστε το άρθρο", "blog.all": "Όλα τα άρθρα", "blog.min": "λεπτά ανάγνωσης",
      "blog.back": "Όλα τα άρθρα", "blog.more": "Περισσότερα από την αγορά",
      "blog.visit": "Επισκεφθείτε τον πάγκο",

      "faq.eyebrow": "Συχνές ερωτήσεις",
      "faq.title": "Ερωτήσεις που μας κάνουν.",
      "faq.lead": "Σύντομες, άμεσες απαντήσεις για το κατάστημα, τα τμήματα, τις παραγγελίες και την Bonus Card.",
      "faq.more": "Δεν το βρήκατε; Ρωτήστε μας απευθείας.",

      "shop.items": "Τι θα βρείτε", "shop.tip": "Συμβουλή πάγκου", "shop.hours": "Ωράριο",
      "shop.other": "Άλλοι πάγκοι", "shop.order": "Παραγγείλτε εκ των προτέρων",
      "shop.add": "Στο καλάθι", "shop.none": "Δεν υπάρχουν προϊόντα.", "shop.products": "Προϊόντα", "shop.deals": "Προσφορές αυτού του πάγκου",
      "shop.allproducts": "Όλα τα προϊόντα του πάγκου",
      "unit.loaf": "τεμ.", "unit.each": "τεμ.", "unit.box": "κουτί", "unit.kg": "κιλό", "unit.pack": "συσκ.", "unit.platter": "πλατό", "unit.bunch": "ματσάκι", "unit.jar": "βάζο", "unit.bottle": "φιάλη", "unit.portion": "μερίδα", "unit.cup": "ποτήρι", "unit.slice": "κομμάτι", "unit.set": "σετ",
      "cart.title": "Το καλάθι σας", "cart.empty": "Το καλάθι σας είναι άδειο.", "cart.added": "Προστέθηκε στο καλάθι", "cart.items": "προϊόντα",
      "cart.sub": "Υποσύνολο", "cart.saved": "Κερδίζετε", "cart.trade": "Έκπτωση επιχείρησης (5%)", "cart.total": "Σύνολο", "cart.checkout": "Ολοκλήρωση παραγγελίας", "cart.continue": "Συνέχεια αγορών", "cart.note": "Παραλαβή από το κατάστημα · διανομή για επιχειρήσεις. Δοκιμαστικό ταμείο — δεν γίνεται χρέωση.",
      "search.placeholder": "Αναζήτηση προϊόντων…", "search.none": "Δεν βρέθηκαν προϊόντα.", "search.title": "Αποτελέσματα για", "search.count": "προϊόντα βρέθηκαν",
      "account.login": "Σύνδεση", "account.register": "Δημιουργία λογαριασμού", "account.title": "Ο λογαριασμός σας", "account.lead": "Συνδεθείτε για να παραγγείλετε, να δείτε το καλάθι σας και να συλλέγετε πόντους Bonus Card.",
      "account.name": "Ονοματεπώνυμο", "account.email": "Email", "account.password": "Κωδικός", "account.type": "Τύπος λογαριασμού", "account.type.private": "Ιδιώτης", "account.type.business": "Επιχείρηση / εστιατόριο",
      "account.err.invalid": "Λάθος email ή κωδικός.", "account.err.exists": "Υπάρχει ήδη λογαριασμός με αυτό το email — συνδεθείτε.",
      "account.hello": "Γεια σας", "account.logout": "Αποσύνδεση", "account.orders": "Οι παραγγελίες σας", "order.none": "Δεν υπάρχουν παραγγελίες ακόμη.", "order.status": "Σε προετοιμασία", "order.placed": "Η παραγγελία καταχωρήθηκε — θα είναι έτοιμη για παραλαβή.",
      "account.demo": "Οι δοκιμαστικοί λογαριασμοί αποθηκεύονται μόνο σε αυτόν τον browser.",
      "offers.in": "Προσφορές στο", "offers.page.title": "Όλες οι εκπτώσεις, σε ένα μέρος.", "offers.page.lead": "Όλα τα μειωμένα προϊόντα από τους εννέα πάγκους. Οι τιμές ισχύουν στο κατάστημα και στην εφαρμογή μέχρι την Κυριακή.", "offers.count": "προϊόντα σε προσφορά",
      "recipes.eyebrow": "Συνταγές", "recipes.title": "Μαγειρέψτε το απόψε.", "recipes.lead": "Απλά πιάτα από ό,τι έχουν οι πάγκοι μας. Προσθέστε όλα τα υλικά στο καλάθι με ένα άγγιγμα.",
      "recipe.serves": "άτομα", "recipe.ingredients": "Από την αγορά", "recipe.method": "Εκτέλεση", "recipe.basket": "Σύνολο υλικών", "recipe.addall": "Όλα στο καλάθι",
      "business.eyebrow": "Για επιχειρήσεις", "business.title": "Πακέτα διανομής για εστιατόρια, καφέ και ξενοδοχεία.", "business.lead": "Εβδομαδιαίες ή καθημερινές παραδόσεις σε όλη τη Λευκωσία σε τιμές χονδρικής. Επιλέξτε πακέτο ή φτιάξτε το δικό σας με επαγγελματικό λογαριασμό (5% έκπτωση σε κάθε παραγγελία).",
      "business.cta": "Άνοιγμα επαγγελματικού λογαριασμού", "bundle.add": "Πακέτο στο καλάθι",
      "business.f1": "Παράδοση πριν το σέρβις", "business.f1.p": "Φούρνος και φρέσκα φεύγουν από τις 06:00· ξηρά και κάβα από τις 09:00.",
      "business.f2": "Μηνιαία τιμολόγηση", "business.f2.p": "Ένα τιμολόγιο ΦΠΑ τον μήνα, με ανάλυση ανά προϊόν για τον λογιστή σας.",
      "business.f3": "Προσωπικός συνεργάτης", "business.f3.p": "Ένας άνθρωπος που ξέρει το μενού σας και σας καλεί όταν κάτι είναι καλύτερο αυτή την εβδομάδα.",
      "nav.offers": "Προσφορές", "nav.recipes": "Συνταγές", "nav.business": "Για επιχειρήσεις", "nav.business.short": "Επιχειρήσεις", "nav.account": "Λογαριασμός",
      "home.recipes": "Τρία δείπνα από τους πάγκους", "home.business": "Έχετε κουζίνα; Δείτε τα επαγγελματικά πακέτα",
      "home.more": "Περισσότερα από τον Αθηαινίτη", "m.counters": "Πάγκοι", "m.search": "Αναζήτηση", "cart.short": "Καλάθι", "m.view": "Δείτε το καλάθι", "m.popular": "Δημοφιλείς αναζητήσεις", "m.deals": "προσφορές",
      "manifesto.1": "Ψωνίστε φρέσκο ψωμί,", "manifesto.2": "το ψάρι της ημέρας", "manifesto.3": "και μια σωστή φιάλη", "manifesto.4": "από ανθρώπους που κρατούν τους ίδιους πάγκους για δεκαετίες. Ένα καλάθι, ένα ταμείο, μια φιλική γωνιά της Λευκωσίας.",
      "how.eyebrow": "Πώς λειτουργεί", "how.title": "Από τον πάγκο στην κουζίνα σας.", "how.badge": "Έτοιμη για παραλαβή",
      "how.s1": "Δείτε τους πάγκους", "how.s1.p": "Εννέα εξειδικευμένοι πάγκοι online, με τις προσφορές της εβδομάδας και ό,τι είναι φρέσκο σήμερα.",
      "how.s2": "Φτιάξτε το καλάθι σας", "how.s2.p": "Προσθέστε προϊόντα, συνταγές ή ολόκληρο επαγγελματικό πακέτο. Συνδεθείτε για να το κρατήσετε.",
      "how.s3": "Παραλαβή ή διανομή", "how.s3.p": "Διαλέξτε ώρα. Το ετοιμάζουμε και σας περιμένει στο γκισέ — ή στην πόρτα του εστιατορίου σας.",
      "how.s4": "Κερδίστε πόντους Bonus", "how.s4.p": "Κάθε ευρώ δίνει έναν πόντο, διπλό την Τετάρτη. Εξαργύρωση στο ταμείο με ένα άγγιγμα.",
      "hero.rot.1": "όπως πρέπει.", "hero.rot.2": "7 μέρες τη βδομάδα.", "hero.rot.3": "από το 1963.", "hero.rot.4": "στην τσέπη σας.", "home.app": "Η εφαρμογή, σύντομα", "home.gallery": "Μέσα στην αγορά",
      "order.status.preparing": "Σε προετοιμασία", "order.status.collected": "Παραλήφθηκε", "order.status.delivered": "Παραδόθηκε", "order.reorder": "Ξανά η ίδια",
      "account.overview": "Επισκόπηση", "account.details": "Προσωπικά στοιχεία", "account.address": "Διεύθυνση παράδοσης", "account.noaddress": "Δεν έχει αποθηκευτεί διεύθυνση", "account.saved": "Τα στοιχεία αποθηκεύτηκαν",
      "account.phone": "Τηλέφωνο", "account.company": "Επωνυμία", "account.vat": "ΑΦΜ", "account.street": "Οδός & αριθμός", "account.area": "Περιοχή", "account.city": "Πόλη", "account.postcode": "Τ.Κ.", "account.notes": "Σημειώσεις παράδοσης", "account.save": "Αποθήκευση",
      "account.points": "Πόντοι Bonus", "account.ordersn": "Παραγγελίες", "account.spent": "Σύνολο αγορών", "account.recent": "Πρόσφατες παραγγελίες", "account.viewall": "Όλες οι παραγγελίες", "account.welcome": "Καλώς ήρθατε ξανά,",
      "account.noaccount": "Δεν έχετε λογαριασμό;", "account.have": "Έχετε ήδη λογαριασμό;", "account.demo.title": "Δοκιμάστε έναν λογαριασμό επίδειξης", "account.demo.lead": "Ένα κλικ σας συνδέει. Ο κωδικός για όλους είναι «demo».",
      "account.login.lead": "Συνδεθείτε για να δείτε παραγγελίες, να ξαναπαραγγείλετε με ένα άγγιγμα και να δείτε τους πόντους σας.", "account.register.lead": "Παίρνει ένα λεπτό. Οι επαγγελματικοί λογαριασμοί έχουν διανομή, 5% έκπτωση και μηνιαίο τιμολόγιο.",
      "login.title": "Καλώς ήρθατε ξανά.", "register.title": "Δημιουργήστε λογαριασμό.",
      "ai.title": "Βοηθός Αθηαινίτη", "ai.sub": "Απαντήσεις σε δευτερόλεπτα · 24/7", "ai.placeholder": "Ρωτήστε για ωράριο, προσφορές, προϊόντα, παραγγελίες…", "ai.hello": "Γεια σας! Είμαι ο βοηθός του Αθηαινίτη. Ρωτήστε με για ωράριο, προσφορές εβδομάδας, πού θα βρείτε ένα προϊόν, τις παραγγελίες σας ή διανομές για την επιχείρησή σας.",
      "ai.c1": "Ποιο είναι το ωράριο;", "ai.c2": "Τι προσφορές έχει αυτή την εβδομάδα;", "ai.c3": "Πού είναι η παραγγελία μου;", "ai.c4": "Κάνετε διανομή σε εστιατόρια;"
    }
  };

  var currentLang = "en";
  var langListeners = [];
  window.ATH = { t: function (k, a) { return t(k, a); }, lang: function () { return currentLang; }, onLang: function (fn) { langListeners.push(fn); } };

  function t(key, arg) {
    var dict = I18N[currentLang] || I18N.en;
    var s = dict[key] != null ? dict[key] : (I18N.en[key] != null ? I18N.en[key] : key);
    return arg != null ? s.replace("{0}", arg) : s;
  }

  function applyLang(lang) {
    var fixed = document.body.getAttribute("data-lang-fixed");
    if (fixed) lang = fixed; // page content is in one language; chrome follows it
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
    // Blocks authored separately per language (blog lists, FAQ): show the matching one
    document.querySelectorAll("[data-lang-only]").forEach(function (el) {
      el.hidden = el.getAttribute("data-lang-only") !== currentLang;
    });
    // Shop pages: long-form content comes from window.SHOP_CONTENT
    if (window.SHOP_CONTENT) {
      document.querySelectorAll("[data-shop]").forEach(function (el) {
        var shop = window.SHOP_CONTENT[el.getAttribute("data-shop")];
        if (!shop) return;
        var d = shop[currentLang] || shop.en;
        var v = d[el.getAttribute("data-field")];
        var i = el.getAttribute("data-index");
        if (i !== null && Array.isArray(v)) v = v[parseInt(i, 10)];
        if (typeof v === "string") el.textContent = v;
      });
    }
    if (!fixed) { try { localStorage.setItem("athienitis-lang", currentLang); } catch (e) { /* private mode */ } }
    langListeners.forEach(function (fn) { fn(currentLang); });
  }

  function initLang() {
    var saved = null;
    try { saved = localStorage.getItem("athienitis-lang"); } catch (e) { /* ignore */ }
    if (!saved && /^el\b/i.test(navigator.language || "")) saved = "el";
    var fixedLang = document.body.getAttribute("data-lang-fixed");
    var altUrl = document.body.getAttribute("data-alt-url");
    if (fixedLang && altUrl && saved && saved !== fixedLang && !/[?&]stay=1/.test(location.search)) {
      window.location.replace(altUrl + "?stay=1"); return;
    }
    updateOpenStatus();
    applyLang(saved || "en");
    document.querySelectorAll("[data-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-lang");
        var alt = document.body.getAttribute("data-alt-url");
        var fixed = document.body.getAttribute("data-lang-fixed");
        try { localStorage.setItem("athienitis-lang", target); } catch (e) { /* ignore */ }
        if (fixed && alt && target !== fixed) { window.location.href = alt; return; }
        applyLang(target);
      });
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
  function initTransitions() {
    // fade the page in; fade out on internal navigation (View Transitions where supported)
    document.documentElement.classList.add("has-js");
    requestAnimationFrame(function () { document.body.classList.add("page-in"); });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[href]"); if (!a) return;
      var href = a.getAttribute("href");
      if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank" || /^(https?:|mailto:|tel:|#)/.test(href) || href.indexOf("#") === 0) return;
      if (a.origin !== location.origin && a.protocol !== "file:") return;
      e.preventDefault(); document.body.classList.add("page-out");
      setTimeout(function () { window.location.href = href; }, 260);
    });
    window.addEventListener("pageshow", function (ev) { if (ev.persisted) document.body.classList.remove("page-out"); });
    var bar = document.createElement("div"); bar.className = "progress"; document.body.appendChild(bar);
    var tick = function () { var h = document.documentElement; var p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1); bar.style.transform = "scaleX(" + p + ")"; };
    window.addEventListener("scroll", tick, { passive: true }); tick();
  }

  function initReveal() {
    // auto-stagger children of grids
    document.querySelectorAll(".products, .posts, .depts, .features, .bundles, .recipes, .tiles, .gallery, .offers").forEach(function (grid) {
      Array.prototype.forEach.call(grid.children, function (c, i) { if (!c.classList.contains("reveal")) { c.classList.add("reveal"); c.style.transitionDelay = (Math.min(i, 8) * 70) + "ms"; } });
    });
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
    window.ATH.observe = function (root) {
      (root || document).querySelectorAll(".products, .posts, .bundles, .recipes").forEach(function (grid) {
        Array.prototype.forEach.call(grid.children, function (c, i) { if (!c.classList.contains("reveal")) { c.classList.add("reveal"); c.style.transitionDelay = (Math.min(i, 8) * 60) + "ms"; } io.observe(c); });
      });
    };
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

  /* -----------------------------------------------------------------------
     8. Count-up numbers (hero stats)
     ----------------------------------------------------------------------- */
  function initCounters() {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      if (reduce || isNaN(target)) { el.textContent = target; return; }
      var start = null, dur = 1200;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* -----------------------------------------------------------------------
     9. Hero stickers follow the pointer slightly (desktop only)
     ----------------------------------------------------------------------- */
  function initParallax() {
    var wrap = document.querySelector(".stickers");
    if (!wrap || !window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var items = wrap.querySelectorAll(".sticker");
    wrap.addEventListener("mousemove", function (e) {
      var r = wrap.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      items.forEach(function (it, i) {
        var depth = (i + 1) * 6;
        it.style.setProperty("--px", (x * depth) + "px");
        it.style.setProperty("--py", (y * depth) + "px");
      });
    });
    wrap.addEventListener("mouseleave", function () {
      items.forEach(function (it) { it.style.setProperty("--px", "0px"); it.style.setProperty("--py", "0px"); });
    });
  }

  /* -----------------------------------------------------------------------
     10. FAQ accordion (native <details>, one open at a time + smooth height)
     ----------------------------------------------------------------------- */
  function initFaq() {
    var all = document.querySelectorAll(".faq details");
    all.forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (d.open) all.forEach(function (o) { if (o !== d && o.open) o.open = false; });
      });
    });
  }

  /* -----------------------------------------------------------------------
     11. Motion: word-split headline, rotating word, scroll-linked manifesto,
         sticky "how it works", photo marquee, magnetic buttons, card tilt,
         header that hides on scroll down.
     ----------------------------------------------------------------------- */
  var REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function splitWords(el) {
    var text = el.textContent.trim(); el.textContent = "";
    text.split(/\s+/).forEach(function (w, i) {
      var sp = document.createElement("span"); sp.className = "w"; sp.style.transitionDelay = (i * 55) + "ms";
      sp.innerHTML = "<i>" + w + "</i>"; el.appendChild(sp); el.appendChild(document.createTextNode(" "));
    });
  }
  function initHeroWords() {
    var h = document.querySelector(".hero h1"); if (!h) return;
    var rot = document.createElement("span"); rot.className = "rot"; rot.innerHTML = "<b></b>";
    function build() {
      splitWords(h); h.appendChild(document.createTextNode(" ")); h.appendChild(rot);
      rot.querySelector("b").textContent = t("hero.rot.1");
      requestAnimationFrame(function () { h.classList.add("is-split"); });
    }
    build();
    var i = 0;
    if (!REDUCE) setInterval(function () {
      i = (i + 1) % 4; var b = rot.querySelector("b"); b.classList.add("out");
      setTimeout(function () { b.textContent = t("hero.rot." + (i + 1)); b.classList.remove("out"); b.classList.add("in"); setTimeout(function () { b.classList.remove("in"); }, 500); }, 350);
    }, 3200);
    window.ATH.onLang(function () { initMarquee(); h.classList.remove("is-split"); h.textContent = t("hero.title"); build(); });
  }

  function initManifesto() {
    var el = document.querySelector("[data-words]"); if (!el) return;
    function build() {
      var nodes = Array.prototype.slice.call(el.childNodes);
      nodes.forEach(function (n) {
        if (n.nodeType === 3 && !n.textContent.trim()) return;
        if (n.nodeType === 1 && n.tagName === "SPAN") {
          var frag = document.createDocumentFragment();
          n.textContent.trim().split(/\s+/).forEach(function (w) { var sp = document.createElement("span"); sp.className = "mw"; sp.textContent = w; frag.appendChild(sp); frag.appendChild(document.createTextNode(" ")); });
          n.replaceWith(frag);
        }
      });
    }
    build();
    var words = function () { return el.querySelectorAll(".mw, .chip"); };
    function onScroll() {
      var r = el.getBoundingClientRect(); var vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35); p = Math.max(0, Math.min(1, p));
      var ws = words(); var n = Math.floor(p * (ws.length + 2));
      ws.forEach(function (w, i) { w.classList.toggle("on", i < n); });
    }
    if (REDUCE) { words().forEach(function (w) { w.classList.add("on"); }); return; }
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    window.ATH.onLang(function () {
      // re-translate the text spans then re-split
      el.querySelectorAll(".mw").forEach(function (x) { x.remove(); });
      var keys = ["manifesto.1", "manifesto.2", "manifesto.3", "manifesto.4"]; var chips = el.querySelectorAll(".chip"); var k = 0;
      var out = document.createDocumentFragment();
      keys.forEach(function (key, idx) { var sp = document.createElement("span"); sp.textContent = t(key); out.appendChild(sp); if (chips[idx]) out.appendChild(chips[idx]); });
      el.innerHTML = ""; el.appendChild(out); build(); onScroll();
    });
  }

  function initSteps() {
    var wrap = document.querySelector("[data-steps]"); if (!wrap) return;
    var steps = wrap.querySelectorAll(".how__step"), imgs = wrap.querySelectorAll(".how__frame img");
    function activate(i) { steps.forEach(function (s, k) { s.classList.toggle("is-active", k === i); }); imgs.forEach(function (im, k) { im.classList.toggle("is-active", k === i); }); }
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (e) { if (e.isIntersecting) activate(parseInt(e.target.getAttribute("data-step"), 10)); }); }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach(function (s) { io.observe(s); s.addEventListener("click", function () { activate(parseInt(s.getAttribute("data-step"), 10)); }); });
  }

  function initMarquee() {
    var track = document.querySelector("[data-marquee]"); if (!track || !window.CATALOG) return;
    var items = window.CATALOG.products.filter(function (p) { return p.was || p.tag; }).slice(0, 12);
    var html = items.map(function (p) { return '<a class="marquee__item" href="' + (document.body.getAttribute("data-base") || "") + 'shops/' + p.section + '.html"><img src="' + p.img + '" alt="" loading="lazy"><span>' + (p.name[currentLang] || p.name.en) + '</span></a>'; }).join("");
    track.innerHTML = html + html;
  }

  function initMagnetic() {
    if (REDUCE || !window.matchMedia("(hover: hover)").matches) return;
    document.querySelectorAll(".btn--primary, .ai__fab, .icon-btn").forEach(function (b) {
      b.addEventListener("mousemove", function (e) { var r = b.getBoundingClientRect(); var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2; b.style.transform = "translate(" + x * 0.18 + "px," + y * 0.18 + "px)"; });
      b.addEventListener("mouseleave", function () { b.style.transform = ""; });
    });
  }

  function initTilt() {
    if (REDUCE || !window.matchMedia("(hover: hover)").matches) return;
    document.addEventListener("mousemove", function (e) {
      var c = e.target.closest(".dept, .tile, .post, .bundle, .feature, .recipe"); if (!c) return;
      var r = c.getBoundingClientRect(); var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      c.style.transform = "perspective(900px) rotateX(" + (-y * 5) + "deg) rotateY(" + (x * 6) + "deg) translateY(-4px)";
      c.classList.add("is-tilt");
    });
    document.addEventListener("mouseout", function (e) { var c = e.target.closest(".dept, .tile, .post, .bundle, .feature, .recipe"); if (c && !c.contains(e.relatedTarget)) { c.style.transform = ""; c.classList.remove("is-tilt"); } });
  }

  function initHideHeader() {
    var h = document.querySelector(".header"); if (!h || REDUCE) return;
    var last = 0;
    window.addEventListener("scroll", function () {
      var y = window.scrollY; if (Math.abs(y - last) < 8) return;
      h.classList.toggle("is-hidden", y > last && y > 240); last = y;
    }, { passive: true });
  }

  /* -----------------------------------------------------------------------
     12. Seasonal theme + dark mode (config in js/config.js)
     ----------------------------------------------------------------------- */
  function orthodoxEaster(y) { // Meeus Julian algorithm -> Gregorian date
    var a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7, m = Math.floor((d + e + 114) / 31), day = ((d + e + 114) % 31) + 1;
    var dt = new Date(Date.UTC(y, m - 1, day)); dt.setUTCDate(dt.getUTCDate() + 13); return dt;
  }
  function pickTheme() {
    var cfg = window.ATH_CONFIG || {}; var t = cfg.theme || "default";
    if (t !== "auto") return t;
    var now = new Date(), y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
    if (m === 11 || (m === 0 && d <= 6)) return "christmas";
    var e = orthodoxEaster(y); var start = new Date(e); start.setDate(e.getDate() - 35);
    if (now >= start && now <= new Date(e.getTime() + 2 * 864e5)) return "easter";
    if (m >= 5 && m <= 7) return "summer";
    return "default";
  }
  var THEME = null;
  function applyTheme() {
    var cfg = window.ATH_CONFIG || {}; var name = pickTheme(); var th = cfg.themes && cfg.themes[name];
    document.documentElement.setAttribute("data-theme", name);
    if (!th) return;
    THEME = th;
    var r = document.documentElement.style;
    r.setProperty("--orange", th.accent); r.setProperty("--orange-deep", th.accent2); r.setProperty("--orange-tint", th.tint); r.setProperty("--lime", th.lime);
    var meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute("content", th.accent);
  }
  function renderCampaign() {
    var slot = document.querySelector("[data-campaign]"); if (!slot || !THEME) return;
    var c = THEME.campaign; var L = c[currentLang] || c.en; var base = document.body.getAttribute("data-base") || "";
    slot.innerHTML = '<section class="campaign reveal"><div class="container"><div class="campaign__card"><div class="campaign__copy"><span class="eyebrow">' + L.eyebrow + '</span><h2 class="h2">' + L.title + '</h2><p class="lead">' + L.lead + '</p><a class="btn btn--primary" href="' + base + c.href + '">' + L.cta + '</a></div><div class="campaign__media"><img src="' + c.photo + '" alt=""></div></div></div></section>';
    if (window.ATH && window.ATH.observe) { slot.querySelector(".campaign").classList.add("is-visible"); }
    var tk = document.querySelector(".ticker__track"); var msgs = THEME.ticker && THEME.ticker[currentLang];
    if (tk && msgs) tk.innerHTML = msgs.concat(msgs).map(function (m) { return "<span><i></i><span>" + m + "</span></span>"; }).join("");
  }
  function initMode() {
    var saved = null; try { saved = localStorage.getItem("athienitis-mode"); } catch (e) { /* ignore */ }
    var prefers = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = saved ? saved === "dark" : prefers;
    document.documentElement.classList.toggle("dark", dark);
    document.querySelectorAll("[data-mode-toggle]").forEach(function (b) {
      b.setAttribute("aria-pressed", dark ? "true" : "false");
      b.addEventListener("click", function () {
        dark = !document.documentElement.classList.contains("dark");
        document.documentElement.classList.toggle("dark", dark); b.setAttribute("aria-pressed", dark ? "true" : "false");
        try { localStorage.setItem("athienitis-mode", dark ? "dark" : "light"); } catch (e) { /* ignore */ }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(); initMode();
    document.body.classList.add("is-loaded");
    initTransitions();
    initHeroWords(); initManifesto(); initSteps(); initMarquee(); initMagnetic(); initTilt(); initHideHeader();
    initCounters();
    initParallax();
    initFaq();
    initLang();
    renderCampaign(); window.ATH.onLang(renderCampaign);
    initHeader();
    initReveal();
    initSubnav();
    initForms();
    initYear();
  });
})();
