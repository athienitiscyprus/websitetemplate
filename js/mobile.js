/* ==========================================================================
   Athienitis — mobile layer (≤ 820px)
   Turns the desktop page into an app-like experience: bottom tab bar,
   horizontal snap carousels, bottom-sheet basket, full-screen search,
   counter chips instead of the sticker cluster, and touch-friendly motion.
   Loaded on every page; does nothing above 820px.
   ========================================================================== */
(function () {
  "use strict";
  var MQ = window.matchMedia("(max-width: 820px)");
  var base = document.body.getAttribute("data-base") || "";
  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function t(k, a) { return window.ATH ? window.ATH.t(k, a) : k; }
  function lang() { return window.ATH ? window.ATH.lang() : "en"; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function money(n) { return "€" + n.toFixed(2); }
  function imgUrl(src) { return window.ATHimg ? window.ATHimg(src) : src; }
  var ICON = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    basket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10h18l-2 9H5z"/><path d="M8 10l3-6M16 10l-3-6"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l9-9h9v9l-9 9z"/><circle cx="16" cy="8" r="1.5" fill="currentColor"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  /* ----- bottom tab bar ---------------------------------------------------- */
  function buildTabBar() {
    if (document.querySelector(".tabbar")) return;
    var page = (location.pathname.split("/").pop() || "index.html").replace(".html", "");
    var tabs = [
      { id: "home", href: base + "index.html", key: "nav.home", icon: ICON.home, active: page === "index" || page === "" },
      { id: "counters", href: base + "departments.html", key: "m.counters", icon: ICON.grid, active: page === "departments" || location.pathname.indexOf("/shops/") !== -1 },
      { id: "offers", href: base + "offers.html", key: "nav.offers", icon: ICON.tag, active: page === "offers" },
      { id: "search", href: "#", key: "m.search", icon: ICON.search, active: page === "search", action: "search" },
      { id: "account", href: base + "account.html", key: "nav.account", icon: ICON.user, active: page === "account" || page === "login" || page === "register" }
    ];
    var bar = document.createElement("nav"); bar.className = "tabbar"; bar.setAttribute("aria-label", "Mobile navigation");
    bar.innerHTML = tabs.map(function (x) {
      return '<a class="tabbar__item' + (x.active ? " is-active" : "") + '" href="' + x.href + '"' + (x.action ? ' data-tab-action="' + x.action + '"' : "") + '><span class="tabbar__icon">' + x.icon + '</span><span data-i18n="' + x.key + '">' + esc(t(x.key)) + '</span></a>';
    }).join("") + '<i class="tabbar__pill"></i>';
    document.body.appendChild(bar);
    document.body.classList.add("has-tabbar");
    positionPill(bar);
    bar.addEventListener("click", function (e) {
      var a = e.target.closest("[data-tab-action]"); if (!a) return;
      e.preventDefault();
      openSearch(true);
    });
    window.addEventListener("resize", function () { positionPill(bar); });

  }
  function positionPill(bar) {
    var a = bar.querySelector(".is-active"), pill = bar.querySelector(".tabbar__pill"); if (!a || !pill) return;
    pill.style.left = (a.offsetLeft + a.offsetWidth / 2 - 14) + "px"; pill.style.opacity = 1;
  }

  /* ----- full-screen search ------------------------------------------------ */
  var searchEl;
  function openSearch(open) {
    if (!searchEl) {
      searchEl = document.createElement("div"); searchEl.className = "msearch"; searchEl.hidden = true;
      searchEl.innerHTML = '<div class="msearch__head"><form data-search class="search" autocomplete="off" style="display:block;flex:1">' + ICON.search + '<input type="search" name="q" autofocus enterkeyhint="search" placeholder="' + esc(t("search.placeholder")) + '"><div class="search__results" hidden></div></form><button class="icon-btn" type="button" data-msearch-close aria-label="Close">×</button></div>' +
        '<div class="msearch__body"><p class="muted" style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">' + esc(t("m.popular")) + '</p><div class="msearch__chips">' + ["halloumi", "souvla", "bread", "wine", "watermelon", "coffee"].map(function (q) { return '<button type="button" class="ai__chip" data-q="' + q + '">' + q + '</button>'; }).join("") + '</div>' +
        '<p class="muted" style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-top:22px">' + esc(t("m.counters")) + '</p><div class="msearch__counters"></div></div>';
      document.body.appendChild(searchEl);
      var C = window.CATALOG || { sections: {} };
      searchEl.querySelector(".msearch__counters").innerHTML = Object.keys(C.sections).map(function (k) {
        var sp = (C.products || []).filter(function (p) { return p.section === k; })[0];
        return '<a href="' + base + 'shops/' + k + '.html"><img src="' + (sp ? imgUrl(sp.img) : "") + '" alt=""><span>' + esc(t("dept." + k)) + '</span></a>';
      }).join("");
      searchEl.querySelector("[data-msearch-close]").addEventListener("click", function () { openSearch(false); });
      searchEl.addEventListener("click", function (e) { var b = e.target.closest("[data-q]"); if (b) { var i = searchEl.querySelector("input"); i.value = b.getAttribute("data-q"); i.dispatchEvent(new Event("input")); i.focus(); } });
      var form = searchEl.querySelector("form"), input = form.querySelector("input"), box = form.querySelector(".search__results");
      input.addEventListener("input", function () {
        var r = window.ATHShop ? window.ATHShop.search(input.value).slice(0, 8) : [];
        box.innerHTML = r.map(function (p) { return '<a href="' + base + 'search.html?q=' + encodeURIComponent(input.value) + '"><img src="' + imgUrl(p.img) + '" alt=""><span><b>' + esc(p.name[lang()] || p.name.en) + '</b><small>' + esc(t("dept." + p.section)) + '</small></span><em>' + money(p.price) + '</em></a>'; }).join("") || (input.value.length >= 2 ? '<div class="search__empty">' + esc(t("search.none")) + '</div>' : "");
        box.hidden = !box.innerHTML;
      });
      form.addEventListener("submit", function (e) { e.preventDefault(); if (input.value.trim()) window.location.href = base + "search.html?q=" + encodeURIComponent(input.value); });
    }
    searchEl.hidden = !open; document.body.style.overflow = open ? "hidden" : "";
    if (open) setTimeout(function () { searchEl.querySelector("input").focus(); }, 60);
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && searchEl && !searchEl.hidden) openSearch(false); });

  /* ----- home page: counter chips replace the sticker cluster --------------- */
  function buildChips() {
    var hero = document.querySelector(".hero .container"); if (!hero || document.querySelector(".mchips")) return;
    var C = window.CATALOG || { sections: {} }; var keys = Object.keys(C.sections); if (!keys.length) return;
    var wrap = document.createElement("div"); wrap.className = "mchips m-carousel";
    function render() {
      wrap.innerHTML = keys.map(function (k, i) {
        var sp = (C.products || []).filter(function (p) { return p.section === k; })[0];
        var deals = (C.products || []).filter(function (p) { return p.section === k && p.was; }).length;
        return '<a class="mchip" href="' + base + 'shops/' + k + '.html" style="--i:' + i + '"><img src="' + (sp ? imgUrl(sp.img) : "") + '" alt="" loading="lazy"><span>' + esc(t("dept." + k)) + '</span>' + (deals ? '<i>' + deals + ' ' + esc(t("m.deals")) + '</i>' : "") + '</a>';
      }).join("");
    }
    render(); hero.appendChild(wrap);
    if (window.ATH) window.ATH.onLang(render);
  }

  /* ----- carousels: snap + focus scaling + dots ----------------------------- */
  function initCarousels() {
    document.querySelectorAll("[data-mobile='carousel']").forEach(function (el) { el.classList.add("m-carousel"); });
    document.querySelectorAll(".m-carousel").forEach(function (c) {
      if (c._armed) { c._update && c._update(); return; }
      var dots = c.nextElementSibling && c.nextElementSibling.classList.contains("m-dots") ? c.nextElementSibling : null;
      if (!dots && !c.classList.contains("mchips") && !c.classList.contains("mjourney__cards")) { dots = document.createElement("div"); dots.className = "m-dots"; c.parentNode.insertBefore(dots, c.nextSibling); }
      var lastBest = null, pending = null;
      function nearest() {
        // Uses offsetLeft (no layout reads per child) — the card whose centre is closest to the viewport centre.
        var kids = Array.prototype.filter.call(c.children, function (k) { return !k.hidden; }); if (!kids.length) return null;
        var mid = c.scrollLeft + c.clientWidth / 2, best = null, bd = 1e9;
        for (var i = 0; i < kids.length; i++) { var k = kids[i]; var d = Math.abs(k.offsetLeft + k.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = k; } }
        return { kids: kids, best: best };
      }
      function paintDots(kids, best) {
        if (!dots) return;
        if (dots.children.length !== kids.length) dots.innerHTML = kids.map(function () { return "<i></i>"; }).join("");
        Array.prototype.forEach.call(dots.children, function (d, i) { d.classList.toggle("is-on", kids[i] === best); });
      }
      // Live pass (while the finger is down / momentum runs): only the dots + progress bar move.
      function live() {
        var n = nearest(); if (!n || n.best === pending) return; pending = n.best;
        paintDots(n.kids, n.best);
        if (c._onFocus) c._onFocus(n.kids.indexOf(n.best), n.kids.length);
      }
      // Settled pass: the .is-focus class (which drives the card's text/chip entrance) is applied only
      // once the snap has finished, so a card can never focus, blur and re-focus inside one swipe.
      function update() {
        var n = nearest(); if (!n) return; var best = n.best; pending = best;
        paintDots(n.kids, best);
        if (c._onFocus) c._onFocus(n.kids.indexOf(best), n.kids.length);
        if (best === lastBest) return;
        if (lastBest) lastBest.classList.remove("is-focus"); best.classList.add("is-focus"); lastBest = best;
      }
      var timer = null, throttled = false;
      c.addEventListener("scroll", function () {
        if (!throttled) { throttled = true; setTimeout(function () { throttled = false; live(); }, 120); }
        clearTimeout(timer); timer = setTimeout(update, 110);
      }, { passive: true });
      if ("onscrollend" in window) c.addEventListener("scrollend", function () { clearTimeout(timer); update(); });
      window.addEventListener("resize", function () { lastBest = null; update(); });
      c._update = function () { lastBest = null; update(); }; c._armed = true; update();
    });
  }
  function refreshCarousels() { document.querySelectorAll(".m-carousel").forEach(function (c) { c._update && c._update(); }); }

  /* ----- "How it works" journey (replaces the desktop sticky panel) --------- */
  function buildJourney() {
    var how = document.querySelector(".how"); if (!how || how.querySelector(".mjourney")) return;
    var imgs = Array.prototype.map.call(how.querySelectorAll(".how__frame img"), function (i) { return i.getAttribute("src"); });
    var C = window.CATALOG || { products: [] };
    function pimg(id) { var p = C.products.filter(function (x) { return x.id === id; })[0]; return p ? imgUrl(p.img) : ""; }
    var wrap = document.createElement("div"); wrap.className = "mjourney";
    function render() {
      var fx = [
        '<span class="fx-chip fx-pop"><img src="' + pimg("bk1") + '" alt="">' + esc(t("dept.bakery")) + '</span><span class="fx-chip fx-pop"><img src="' + pimg("bt1") + '" alt="">' + esc(t("dept.butchery")) + '</span><span class="fx-chip fx-pop"><img src="' + pimg("cl1") + '" alt="">' + esc(t("dept.cellar")) + '</span>',
        '<span class="fx-chip fx-pop is-orange">+ ' + esc(t("shop.add")) + '</span><span class="fx-chip fx-pop">3 ' + esc(t("cart.items")) + ' · €14.60</span>',
        '<span class="fx-chip fx-pop is-lime">' + esc(t("how.badge")) + '</span><span class="fx-chip fx-pop">11:30 – 12:00</span>',
        '<span class="fx-points fx-pop">+15<small>' + esc(t("account.points")) + '</small></span><span class="fx-chip fx-pop is-lime">' + esc(t("m.reward")) + '</span>'
      ];
      wrap.innerHTML = '<div class="mjourney__track"><i></i></div><div class="mjourney__cards m-carousel">' + [0, 1, 2, 3].map(function (i) {
        return '<div class="mstep mstep--copy"><img src="' + imgs[i] + '" alt="" loading="lazy"><span class="mstep__num">' + (i + 1) + '</span><span class="mstep__tag">' + esc(t("m.step")) + ' ' + (i + 1) + '/4</span><h3>' + esc(t("how.s" + (i + 1))) + '</h3><p>' + esc(t("how.s" + (i + 1) + ".p")) + '</p><div class="mstep__fx">' + fx[i] + '</div></div>';
      }).join("") + '</div><p class="mjourney__hint"><span>' + esc(t("m.swipe")) + '</span>' + ICON.arrow + '</p>';
      var cars = wrap.querySelector(".m-carousel"); cars._armed = false;
      cars._onFocus = function (i, n) { wrap.querySelector(".mjourney__track i").style.width = ((i + 1) / n * 100) + "%"; };
      initCarousels();
    }
    how.querySelector(".container").appendChild(wrap); render();
    if (window.ATH) window.ATH.onLang(render);
  }

  /* ----- drawer gets language + dark-mode + open status (top bar is hidden) -- */
  function buildDrawerTools() {
    var drawer = document.querySelector(".drawer"); if (!drawer || drawer.querySelector(".drawer__tools")) return;
    var tools = document.createElement("div"); tools.className = "drawer__tools";
    var status = document.querySelector(".topbar .status"), lang = document.querySelector(".topbar .lang"), mode = document.querySelector(".topbar .mode-toggle");
    var right = document.createElement("div"); right.style.cssText = "display:flex;gap:8px;align-items:center";
    if (status) tools.appendChild(status);
    var me = document.querySelector(".topbar [data-me-bar]"); if (me) { tools.appendChild(me); }
    if (mode) right.appendChild(mode); if (lang) right.appendChild(lang);
    tools.appendChild(right); drawer.insertBefore(tools, drawer.firstChild);
  }

  /* ----- floating basket pill ---------------------------------------------- */
  function initBasketPill() {
    var pill = document.createElement("button"); pill.type = "button"; pill.className = "mpill"; pill.setAttribute("data-cart-open", ""); pill.hidden = true;
    pill.innerHTML = ICON.basket + '<span><b data-mpill-count></b> · <b data-mpill-total></b></span><em data-i18n="m.view">' + esc(t("m.view")) + '</em>';
    document.body.appendChild(pill);
    function update() {
      if (!window.ATHShop) return;
      var n = window.ATHShop.Cart.count(); var tot = window.ATHShop.Cart.totals();
      pill.querySelector("[data-mpill-count]").textContent = n + " " + t("cart.items"); pill.querySelector("[data-mpill-total]").textContent = money(tot.total);
      var show = n > 0 && !document.querySelector(".cart-drawer.is-open");
      if (show && pill.hidden) { pill.hidden = false; pill.classList.add("is-in"); } else if (!show) pill.hidden = true;
    }
    // observe badge changes
    var badge = document.querySelector(".header [data-cart-count]");
    if (badge && "MutationObserver" in window) new MutationObserver(update).observe(badge, { childList: true, characterData: true, subtree: true });
    setTimeout(update, 300);
    document.addEventListener("click", function () { setTimeout(update, 450); });
  }

  /* ----- tap feedback + fly-to-tab target ----------------------------------- */
  function initTouch() {
    document.addEventListener("touchstart", function (e) { var el = e.target.closest(".btn, .tabbar__item, .icon-btn, .product__add"); if (el) el.classList.add("is-pressed"); }, { passive: true });
    ["touchend", "touchcancel"].forEach(function (ev) { document.addEventListener(ev, function () { document.querySelectorAll(".is-pressed").forEach(function (x) { x.classList.remove("is-pressed"); }); }, { passive: true }); });
  }

  /* ----- "back to top" on long pages ----------------------------------------- */
  function initTop() {
    var b = document.createElement("button"); b.type = "button"; b.className = "mtop"; b.setAttribute("aria-label", "Top"); b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
    document.body.appendChild(b);
    window.addEventListener("scroll", function () { b.classList.toggle("is-in", window.scrollY > 1200); }, { passive: true });
    b.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: REDUCE ? "auto" : "smooth" }); });
  }

  function boot() {
    if (!MQ.matches) return;
    // If the page is pinch/auto-zoomed, fixed bars appear mid-screen; snap the zoom back when an input blurs.
    if (window.visualViewport) {
      var vv = window.visualViewport;
      document.addEventListener("focusout", function () { setTimeout(function () { if (vv.scale > 1.01) { var m = document.querySelector('meta[name="viewport"]'); if (m) { var c = m.getAttribute("content"); m.setAttribute("content", c + ", maximum-scale=1"); setTimeout(function () { m.setAttribute("content", c); }, 300); } } }, 50); });
    }
    document.documentElement.classList.add("is-mobile");
    buildDrawerTools(); buildTabBar(); buildChips(); buildJourney(); initCarousels(); initTouch(); initTop();
    if (window.ATH) window.ATH.onLang(function () { document.querySelectorAll(".tabbar [data-i18n], .mpill [data-i18n]").forEach(function (n) { n.textContent = t(n.getAttribute("data-i18n")); }); });
    // products render asynchronously — re-arm carousels after shop.js paints
    var mo = new MutationObserver(function () { initCarousels(); });
    document.querySelectorAll("[data-products], [data-recipes], [data-bundles]").forEach(function (n) { mo.observe(n, { childList: true }); });
  }
  document.addEventListener("DOMContentLoaded", boot);
  window.ATHMobile = { refreshCarousels: refreshCarousels, openSearch: openSearch };
})();
