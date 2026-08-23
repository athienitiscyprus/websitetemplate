/* ==========================================================================
   Athienitis — shop layer (products, basket, account, search)
   Demo implementation: everything lives in localStorage so the template works
   on GitHub Pages with no backend. Swap the STORE functions for API calls later.
   Depends on window.CATALOG (js/catalog.js) and the I18N helpers in main.js
   exposed as window.ATH = { t, lang, onLang }.
   ========================================================================== */
(function () {
  "use strict";
  var C = window.CATALOG || { products: [], recipes: [], bundles: [], sections: {} };
  // Apply product edits made in the staff panel (admin/), stored in localStorage
  try {
    var ov = JSON.parse(localStorage.getItem("ath:catalogOverrides") || "null");
    if (ov) {
      C.products = C.products.filter(function (p) { return ov.deleted.indexOf(p.id) === -1; }).map(function (p) { return Object.assign({}, p, ov.updated[p.id] || {}); }).concat(ov.added.map(function (p) { return Object.assign({}, p, ov.updated[p.id] || {}); }));
      var today = new Date().toISOString().slice(0, 10);
      C.products = C.products.filter(function (p) { return !p.hidden; }).map(function (p) { if (p.offerEnd && p.offerEnd < today) { p = Object.assign({}, p); delete p.was; } return p; });
      window.CATALOG.products = C.products;
    }
  } catch (e) { /* ignore */ }
  var base = document.body.getAttribute("data-base") || "";

  function t(k, a) { return window.ATH ? window.ATH.t(k, a) : k; }
  function lang() { return window.ATH ? window.ATH.lang() : "en"; }
  function money(n) { return "€" + n.toFixed(2); }
  function imgUrl(src) { return !src || /^(https?:)?\/\//.test(src) || src.indexOf("data:") === 0 ? src : base + src.replace(/^(\.\.\/)+/, ""); }
  window.ATHimg = imgUrl;
  function byId(id) { for (var i = 0; i < C.products.length; i++) if (C.products[i].id === id) return C.products[i]; return null; }
  function isKg(p) { return !!p && p.unit === "kg"; }
  function fq(q) { return String(Math.round(q * 100) / 100); }
  function qtyLabel(p, q) { return isKg(p) ? fq(q) + " kg" : fq(q); }
  // €/kg or €/L reference computed from the size in the product name ("450g", "750ml", "1L", …)
  function refPrice(p) {
    if (isKg(p)) return "";
    var m = (p.name.en || "").match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l)\b/i);
    if (!m) return "";
    var n = parseFloat(m[1].replace(",", ".")), u = m[2].toLowerCase();
    if (!n) return "";
    if (u === "g") return money(p.price / (n / 1000)) + " / kg";
    if (u === "kg") return money(p.price / n) + " / kg";
    if (u === "ml") return money(p.price / (n / 1000)) + " / L";
    if (u === "cl") return money(p.price / (n / 100)) + " / L";
    if (u === "l") return money(p.price / n) + " / L";
    return "";
  }
  function unitLabelKey(p) { return { each: "piece", loaf: "piece", slice: "piece", cup: "piece" }[p.unit] || p.unit; }
  var WEIGHTS = [[0.25, "250 g"], [0.5, "500 g"], [0.75, "750 g"], [1, "1 kg"], [1.5, "1.5 kg"], [2, "2 kg"]];
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ----- storage ---------------------------------------------------------- */
  var STORE = {
    get: function (k, d) { try { var v = localStorage.getItem("ath:" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("ath:" + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  /* ----- account ---------------------------------------------------------- */
  function seedUsers() {
    if (!C.seedUsers) return;
    var u = STORE.get("users", {});
    if (STORE.get("seeded", false)) {   // patch avatars into accounts seeded by an earlier version
      var changed = false;
      C.seedUsers.forEach(function (su) { if (u[su.email] && !u[su.email].avatar) { u[su.email].avatar = su.avatar; changed = true; } });
      Object.keys(u).forEach(function (k) { if (!u[k].avatar) { u[k].avatar = (C.avatars || {})[u[k].type] || ""; changed = true; } });
      if (changed) STORE.set("users", u);
      return;
    }
    C.seedUsers.forEach(function (su) {
      if (u[su.email]) return;
      var orders = su.orders.map(function (o) {
        var items = o.items.map(function (it) { return { id: it[0], qty: it[1] }; });
        var total = items.reduce(function (n, x) { var p = byId(x.id); return n + (p ? p.price * x.qty : 0); }, 0);
        if (su.type === "business") total *= 0.95;
        return { id: o.id, at: new Date(o.at).getTime(), status: o.status, items: items, total: Math.round(total * 100) / 100 };
      });
      u[su.email] = { name: su.name, email: su.email, pass: su.pass_, type: su.type, avatar: su.avatar || "", phone: su.phone || "", company: su.company || "", vat: su.vat || "",
        address: su.address || {}, bonus: su.bonus || 0, created: Date.now(), orders: orders };
    });
    STORE.set("users", u); STORE.set("seeded", true);
  }

  var Account = {
    current: function () { return STORE.get("session", null); },
    users: function () { return STORE.get("users", {}); },
    register: function (name, email, pass, type) {
      var u = Account.users(); email = email.toLowerCase();
      if (u[email]) return { error: "exists" };
      u[email] = { name: name, email: email, pass: pass, type: type || "private", avatar: (C.avatars || {})[type || "private"] || "", phone: "", company: "", vat: "", address: {}, bonus: 0, created: Date.now(), orders: [] };
      STORE.set("users", u); STORE.set("session", { email: email }); return { ok: true };
    },
    update: function (patch) { var u = Account.users(); var me = Account.me(); if (!me) return; Object.keys(patch).forEach(function (k) { me[k] = patch[k]; }); u[me.email] = me; STORE.set("users", u); },
    login: function (email, pass) {
      var u = Account.users()[email.toLowerCase()];
      if (!u || u.pass !== pass) return { error: "invalid" };
      STORE.set("session", { email: u.email }); return { ok: true };
    },
    logout: function () { STORE.set("session", null); },
    me: function () { var s = Account.current(); return s ? Account.users()[s.email] || null : null; },
    addOrder: function (order) { var u = Account.users(); var me = Account.me(); if (!me) return; me.orders.unshift(order); me.bonus = (me.bonus || 0) + Math.floor(order.total); u[me.email] = me; STORE.set("users", u); }
  };

  /* ----- basket ----------------------------------------------------------- */
  var Cart = {
    items: function () { return STORE.get("cart", []); },
    save: function (items) { STORE.set("cart", items); renderCartUI(); },
    add: function (id, qty) {
      var items = Cart.items(); qty = qty || 1;
      for (var i = 0; i < items.length; i++) if (items[i].id === id) { items[i].qty += qty; Cart.save(items); return; }
      items.push({ id: id, qty: qty }); Cart.save(items);
    },
    setQty: function (id, qty) {
      var items = Cart.items().filter(function (x) { return !(x.id === id && qty <= 0); });
      items.forEach(function (x) { if (x.id === id) x.qty = qty; });
      Cart.save(items);
    },
    remove: function (id) { Cart.save(Cart.items().filter(function (x) { return x.id !== id; })); },
    clear: function () { Cart.save([]); },
    count: function () { return Cart.items().reduce(function (n, x) { return n + (isKg(byId(x.id)) ? 1 : x.qty); }, 0); },
    totals: function () {
      var sub = 0, saved = 0;
      Cart.items().forEach(function (x) { var p = byId(x.id); if (!p) return; sub += p.price * x.qty; if (p.was) saved += (p.was - p.price) * x.qty; });
      var me = Account.me(); var trade = me && me.type === "business" ? sub * 0.05 : 0;
      return { sub: sub, saved: saved, trade: trade, total: sub - trade };
    }
  };

  /* ----- product card ----------------------------------------------------- */
  function productCard(p, noCat) {
    var off = p.was ? Math.round((1 - p.price / p.was) * 100) : 0;
    var sec = C.sections[p.section] || {};
    var unitKey = unitLabelKey(p);
    var ref = refPrice(p);
    var weight = isKg(p)
      ? '<label class="product__weight"><span>' + esc(t("shop.weight")) + '</span><select data-weight>' + WEIGHTS.map(function (w) { return '<option value="' + w[0] + '"' + (w[0] === 1 ? " selected" : "") + '>' + w[1] + '</option>'; }).join("") + '</select></label>'
      : "";
    return '<article class="product" data-product="' + p.id + '">' +
      '<a class="product__img" href="' + base + 'products/' + p.id + '.html"><img src="' + imgUrl(p.img) + '" alt="" loading="lazy">' +
      (off ? '<span class="product__off">-' + off + '%</span>' : '') + '</a>' +
      '<div class="product__body">' +
      (noCat ? '' : '<a class="product__cat ' + (sec.color || "") + '" href="' + base + 'shops/' + p.section + '.html">' + esc(t("dept." + p.section)) + '</a>') +
      '<h3><a href="' + base + 'products/' + p.id + '.html">' + esc(p.name[lang()] || p.name.en) + '</a></h3>' +
      '<div class="product__price"><b>' + money(p.price) + '</b>' + (p.was ? '<s>' + money(p.was) + '</s>' : '') + '<small>/ ' + esc(t("unit." + unitKey)) + '</small></div>' +
      (ref ? '<div class="product__ref">' + esc(ref) + '</div>' : '') +
      weight +
      '<button class="btn btn--primary btn--sm product__add" type="button" data-add="' + p.id + '">' + esc(t("shop.add")) + '</button></div></article>';
  }

  function renderProducts() {
    document.querySelectorAll("[data-products]").forEach(function (el) {
      var spec = el.getAttribute("data-products"); var list = C.products.slice();
      var limit = parseInt(el.getAttribute("data-limit") || "0", 10);
      if (spec.indexOf("discounts") === 0) list = list.filter(function (p) { return p.was; });
      var sec = spec.split(":")[1];
      if (sec) list = list.filter(function (p) { return p.section === sec; });
      if (spec === "featured") list = list.filter(function (p) { return p.was || p.tag; });
      if (spec.indexOf("similar:") === 0) { var cur = byId(spec.split(":")[1]); list = cur ? C.products.filter(function (p) { return p.section === cur.section && p.id !== cur.id; }).slice(0, 4) : []; }
      if (spec.indexOf("pairs:") === 0) { var cp = byId(spec.split(":")[1]); var secs = cp && C.pairs ? C.pairs[cp.section] || [] : []; list = []; secs.forEach(function (sx) { var cand = C.products.filter(function (p) { return p.section === sx; }); var pick = cand.filter(function (p) { return p.was; })[0] || cand[0]; if (pick) list.push(pick); if (list.length < 4) { var second = cand.filter(function (p) { return p !== pick; })[0]; if (second && list.length < 4 && secs.length < 4) list.push(second); } }); list = list.slice(0, 4); }
      if (limit) list = list.slice(0, limit);
      var noCat = spec.indexOf("section:") === 0;   // a counter page lists its own counter — no need to repeat it on every card
      if (!el.hidden) el.innerHTML = list.length ? list.map(function (p) { return productCard(p, noCat); }).join("") : '<p class="muted">' + esc(t("shop.none")) + '</p>';
      if (el.hasAttribute("data-count-target")) { var c = document.querySelector(el.getAttribute("data-count-target")); if (c) c.textContent = list.length; }
    });
    // discounts grouped by section
    document.querySelectorAll("[data-discounts-grouped]").forEach(function (el) {
      var html = "";
      Object.keys(C.sections).forEach(function (s) {
        var list = C.products.filter(function (p) { return p.section === s && p.was; });
        if (!list.length) return;
        html += '<section class="disc-group" id="' + s + '"><div class="section__head" style="margin-bottom:22px"><div><span class="eyebrow">' + esc(t("dept." + s)) + '</span><h2 class="h3" style="margin-top:8px">' + esc(t("offers.in")) + ' ' + esc(t("dept." + s)) + '</h2></div><a class="btn btn--ghost btn--sm" href="' + base + 'shops/' + s + '.html">' + esc(t("dept.link")) + '</a></div><div class="products">' + list.map(function (p) { return productCard(p); }).join("") + '</div></section>';
      });
      el.innerHTML = html;
    });
  }

  /* ----- recipes & bundles ------------------------------------------------ */
  function renderRecipes() {
    var el = document.querySelector("[data-recipes]"); if (!el) return;
    el.innerHTML = C.recipes.map(function (r) {
      var d = r[lang()] || r.en;
      var total = r.items.reduce(function (n, it) { var p = byId(it[0]); return n + (p ? p.price * it[1] : 0); }, 0);
      var ings = r.items.map(function (it) { var p = byId(it[0]); return p ? '<li>' + it[1] + ' × ' + esc(p.name[lang()] || p.name.en) + '</li>' : ""; }).join("");
      var steps = d.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join("");
      return '<article class="recipe"><div class="recipe__img"><img src="' + imgUrl(r.img) + '" alt="" loading="lazy"><span class="recipe__meta">' + r.minutes + ' min · ' + r.serves + ' ' + esc(t("recipe.serves")) + '</span></div>' +
        '<div class="recipe__body"><h3>' + esc(d.title) + '</h3><p>' + esc(d.desc) + '</p>' +
        '<div class="recipe__cols"><div><h4>' + esc(t("recipe.ingredients")) + '</h4><ul class="recipe__ings">' + ings + '</ul></div><div><h4>' + esc(t("recipe.method")) + '</h4><ol class="recipe__steps">' + steps + '</ol></div></div>' +
        '<div class="recipe__foot"><span>' + esc(t("recipe.basket")) + ' <b>' + money(total) + '</b></span><button class="btn btn--primary btn--sm" type="button" data-add-recipe="' + r.id + '">' + esc(t("recipe.addall")) + '</button></div></div></article>';
    }).join("");
  }

  function renderBundles() {
    var el = document.querySelector("[data-bundles]"); if (!el) return;
    el.innerHTML = C.bundles.map(function (b) {
      var d = b[lang()] || b.en;
      var ings = b.items.filter(function (it) { return it[1] > 0; }).map(function (it) { var p = byId(it[0]); return p ? '<li>' + it[1] + ' × ' + esc(p.name[lang()] || p.name.en) + '</li>' : ""; }).join("");
      var off = Math.round((1 - b.price / b.was) * 100);
      return '<article class="bundle"><div class="bundle__img"><img src="' + imgUrl(b.img) + '" alt="" loading="lazy"><span class="product__off">-' + off + '%</span></div>' +
        '<div class="bundle__body"><span class="eyebrow eyebrow--orange">' + esc(d.who) + '</span><h3>' + esc(d.title) + '</h3><p>' + esc(d.desc) + '</p><ul class="recipe__ings">' + ings + '</ul>' +
        '<div class="bundle__foot"><div class="product__price"><b>' + money(b.price) + '</b><s>' + money(b.was) + '</s></div><button class="btn btn--primary btn--sm" type="button" data-add-bundle="' + b.id + '">' + esc(t("bundle.add")) + '</button></div></div></article>';
    }).join("");
  }

  /* ----- search ----------------------------------------------------------- */
  function search(q) {
    q = (q || "").trim().toLowerCase(); if (q.length < 2) return [];
    return C.products.filter(function (p) {
      return (p.name.en + " " + p.name.el + " " + (p.kw || "") + " " + t("dept." + p.section) + " " + p.section).toLowerCase().indexOf(q) !== -1;
    });
  }
  function initSearch() {
    document.querySelectorAll("[data-search]").forEach(function (form) {
      var input = form.querySelector("input"); var box = form.querySelector(".search__results");
      input.addEventListener("input", function () {
        var r = search(input.value).slice(0, 6);
        if (!box) return;
        box.innerHTML = r.map(function (p) {
          return '<a href="' + base + 'search.html?q=' + encodeURIComponent(input.value) + '"><img src="' + imgUrl(p.img) + '" alt=""><span><b>' + esc(p.name[lang()] || p.name.en) + '</b><small>' + esc(t("dept." + p.section)) + '</small></span><em>' + money(p.price) + '</em></a>';
        }).join("") || (input.value.length >= 2 ? '<div class="search__empty">' + esc(t("search.none")) + '</div>' : "");
        box.hidden = !box.innerHTML;
      });
      input.addEventListener("blur", function () { setTimeout(function () { if (box) box.hidden = true; }, 200); });
      input.addEventListener("focus", function () { if (box && box.innerHTML) box.hidden = false; });
      form.addEventListener("submit", function (e) { e.preventDefault(); window.location.href = base + "search.html?q=" + encodeURIComponent(input.value); });
    });
    var results = document.querySelector("[data-search-results]");
    if (results) {
      var SP = window._searchPage = window._searchPage || { secs: {}, offers: false, min: "", max: "", sort: "rel" };
      SP.q = new URLSearchParams(location.search).get("q") || "";
      document.querySelectorAll("[data-search] input").forEach(function (i) { i.value = SP.q; });
      var aside = document.querySelector("[data-search-filters]");
      function matches(p) {
        var q = SP.q.trim().toLowerCase();
        return q.length < 2 || (p.name.en + " " + p.name.el + " " + (p.kw || "") + " " + t("dept." + p.section) + " " + p.section).toLowerCase().indexOf(q) !== -1;
      }
      function renderSearchPage() {
        var byQ = C.products.filter(matches);
        var active = Object.keys(SP.secs).filter(function (k) { return SP.secs[k]; });
        var list = byQ.filter(function (p) {
          if (active.length && active.indexOf(p.section) === -1) return false;
          if (SP.offers && !p.was) return false;
          if (SP.min !== "" && p.price < parseFloat(SP.min)) return false;
          if (SP.max !== "" && p.price > parseFloat(SP.max)) return false;
          return true;
        });
        if (SP.sort === "priceasc") list.sort(function (a, b) { return a.price - b.price; });
        if (SP.sort === "pricedesc") list.sort(function (a, b) { return b.price - a.price; });
        if (SP.sort === "name") list.sort(function (a, b) { return (a.name[lang()] || a.name.en).localeCompare(b.name[lang()] || b.name.en); });
        results.innerHTML = list.length ? list.map(function (p) { return productCard(p); }).join("") : '<p class="lead">' + esc(t("search.none")) + '</p>';
        var n = document.querySelector("[data-search-count]"); if (n) n.textContent = list.length;
        var ttl = document.querySelector("[data-search-title]"); if (ttl) ttl.textContent = SP.q.trim().length >= 2 ? t("search.for") + " \u201C" + SP.q + "\u201D" : t("search.all");
        if (!aside) return;
        var sorts = [["rel", t("sort.rel")], ["priceasc", t("sort.priceasc")], ["pricedesc", t("sort.pricedesc")], ["name", t("sort.name")]];
        aside.innerHTML = '<div class="filters__head"><h3>' + esc(t("filter.title")) + '</h3><button type="button" class="filters__clear" data-f-clear>' + esc(t("filter.clear")) + '</button></div>' +
          '<div class="filters__body"><div class="fgroup"><h4>' + esc(t("filter.sort")) + '</h4><select data-f-sort>' + sorts.map(function (o) { return '<option value="' + o[0] + '"' + (SP.sort === o[0] ? " selected" : "") + '>' + esc(o[1]) + '</option>'; }).join("") + '</select></div>' +
          '<div class="fgroup"><h4>' + esc(t("filter.dept")) + '</h4>' + Object.keys(C.sections).map(function (sec) {
            var cnt = byQ.filter(function (p) { return p.section === sec; }).length; if (!cnt) return "";
            return '<label class="fcheck"><input type="checkbox" data-f-sec="' + sec + '"' + (SP.secs[sec] ? " checked" : "") + '><span>' + esc(t("dept." + sec)) + '</span><em>' + cnt + '</em></label>';
          }).join("") + '</div>' +
          '<div class="fgroup"><h4>' + esc(t("filter.price")) + '</h4><div class="frange"><input type="number" min="0" step="0.5" inputmode="decimal" placeholder="' + esc(t("filter.min")) + '" value="' + SP.min + '" data-f-min><span>–</span><input type="number" min="0" step="0.5" inputmode="decimal" placeholder="' + esc(t("filter.max")) + '" value="' + SP.max + '" data-f-max></div></div>' +
          '<label class="fcheck fcheck--offers"><input type="checkbox" data-f-offers' + (SP.offers ? " checked" : "") + '><span>' + esc(t("filter.offers")) + '</span></label></div>';
        if (window.ATH && window.ATH.observe) window.ATH.observe();
      }
      if (aside && !aside._wired) {
        aside._wired = true;
        aside.addEventListener("change", function (e) {
          var el = e.target;
          if (el.hasAttribute("data-f-sec")) SP.secs[el.getAttribute("data-f-sec")] = el.checked;
          else if (el.hasAttribute("data-f-offers")) SP.offers = el.checked;
          else if (el.hasAttribute("data-f-sort")) SP.sort = el.value;
          else if (el.hasAttribute("data-f-min")) SP.min = el.value;
          else if (el.hasAttribute("data-f-max")) SP.max = el.value;
          renderSearchPage();
        });
        aside.addEventListener("click", function (e) {
          if (e.target.closest("[data-f-clear]")) { SP.secs = {}; SP.offers = false; SP.min = SP.max = ""; SP.sort = "rel"; renderSearchPage(); }
          else if (e.target.closest(".filters__head h3") && window.innerWidth <= 820) aside.classList.toggle("is-open");
        });
        document.querySelectorAll("[data-search]").forEach(function (form) {
          var input = form.querySelector("input");
          input.addEventListener("input", function () { SP.q = input.value; renderSearchPage(); });
        });
      }
      window._renderSearchPage = renderSearchPage;
      renderSearchPage();
    }
  }

    /* ----- basket drawer & page --------------------------------------------- */
  function ensureCartFab() {
    if (document.querySelector(".cart-fab")) return;
    var f = document.createElement("button"); f.type = "button"; f.className = "cart-fab"; f.setAttribute("data-cart-open", ""); f.setAttribute("aria-label", "Basket");
    f.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10h18l-2 9H5z"/><path d="M8 10l3-6M16 10l-3-6"/></svg><span class="cart-fab__total" data-cart-fab-total></span><b class="cart-fab__badge is-empty" data-cart-count>0</b>';
    document.body.appendChild(f);
  }
  function renderCartUI() {
    ensureCartFab();
    var n = Cart.count();
    var fab = document.querySelector(".cart-fab"); if (fab) { fab.classList.toggle("has-items", n > 0); var tt = fab.querySelector("[data-cart-fab-total]"); if (tt) tt.textContent = money(Cart.totals().total); }
    document.querySelectorAll("[data-cart-count]").forEach(function (el) { el.textContent = n; el.classList.toggle("is-empty", n === 0); });
    var tot = Cart.totals();
    document.querySelectorAll("[data-cart-list]").forEach(function (el) {
      var items = Cart.items();
      el.innerHTML = items.length ? items.map(function (x) {
        var p = byId(x.id); if (!p) return "";
        return '<div class="cart__row"><img src="' + imgUrl(p.img) + '" alt=""><div><b>' + esc(p.name[lang()] || p.name.en) + '</b><small>' + money(p.price) + ' / ' + esc(t("unit." + unitLabelKey(p))) + '</small></div>' +
          '<div class="qty"><button type="button" data-qty="' + x.id + '" data-delta="-1" aria-label="−">−</button><span>' + qtyLabel(p, x.qty) + '</span><button type="button" data-qty="' + x.id + '" data-delta="1" aria-label="+">+</button></div>' +
          '<b class="cart__line">' + money(p.price * x.qty) + '</b><button class="cart__rm" type="button" data-remove="' + x.id + '" aria-label="Remove">×</button></div>';
      }).join("") : '<p class="cart__empty">' + esc(t("cart.empty")) + '</p>';
    });
    document.querySelectorAll("[data-cart-sub]").forEach(function (el) { el.textContent = money(tot.sub); });
    document.querySelectorAll("[data-cart-saved]").forEach(function (el) { el.textContent = money(tot.saved); el.closest("[data-cart-saved-row]") && (el.closest("[data-cart-saved-row]").hidden = tot.saved === 0); });
    document.querySelectorAll("[data-cart-trade]").forEach(function (el) { el.textContent = "−" + money(tot.trade); var row = el.closest("[data-cart-trade-row]"); if (row) row.hidden = tot.trade === 0; });
    document.querySelectorAll("[data-cart-total]").forEach(function (el) { el.textContent = money(tot.total); });
    document.querySelectorAll("[data-checkout]").forEach(function (b) { b.disabled = n === 0; });
  }

  function openDrawer(open) {
    var d = document.querySelector(".cart-drawer"); if (!d) return;
    d.classList.toggle("is-open", open); d.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";
  }

  function flyToCart(btn) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var card = btn.closest(".product") || btn.closest(".pdp__grid"); var img = card && card.querySelector("img"); var target = document.querySelector(".cart-fab");
    if (!img || !target) return;
    var a = img.getBoundingClientRect(), z = target.getBoundingClientRect();
    var ghost = img.cloneNode(); ghost.className = "fly"; ghost.style.cssText = "left:" + a.left + "px;top:" + a.top + "px;width:" + a.width + "px;height:" + a.height + "px";
    document.body.appendChild(ghost);
    requestAnimationFrame(function () { ghost.style.cssText += ";left:" + (z.left + z.width / 2 - 14) + "px;top:" + (z.top + z.height / 2 - 14) + "px;width:28px;height:28px;opacity:.4;border-radius:50%"; });
    setTimeout(function () { ghost.remove(); target.classList.add("is-bump"); setTimeout(function () { target.classList.remove("is-bump"); }, 400); }, 700);
  }

  function toast(msg) {
    var el = document.querySelector(".toast"); if (!el) { el = document.createElement("div"); el.className = "toast"; document.body.appendChild(el); }
    el.textContent = msg; el.classList.add("is-visible");
    clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove("is-visible"); }, 2200);
  }

  /* ----- account UI ------------------------------------------------------- */
  function orderRow(o) {
    var n = o.items.reduce(function (k, x) { return k + x.qty; }, 0);
    var names = o.items.slice(0, 3).map(function (x) { var p = byId(x.id); return p ? (p.name[lang()] || p.name.en) : ""; }).join(", ") + (o.items.length > 3 ? " …" : "");
    var cls = o.status === "preparing" ? "c-orange" : "c-leaf";
    return '<div class="order"><div><b>#' + o.id + '</b><small>' + new Date(o.at).toLocaleDateString(lang() === "el" ? "el-GR" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) + ' · ' + n + ' ' + esc(t("cart.items")) + '</small><small class="order__names">' + esc(names) + '</small></div><span class="pill ' + cls + '">' + esc(t("order.status." + (o.status || "preparing"))) + '</span><b>' + money(o.total) + '</b><button class="btn btn--ghost btn--sm" type="button" data-reorder="' + o.id + '">' + esc(t("order.reorder")) + '</button></div>';
  }

  function renderAccountUI() {
    var me = Account.me();
    document.querySelectorAll("[data-account-link]").forEach(function (a) {
      var sp = a.querySelector("span"); if (sp) sp.textContent = me ? me.name.split(" ")[0] : t("account.login");
      a.setAttribute("href", base + (me ? "account.html" : "login.html"));
    });
    document.querySelectorAll("[data-me-bar]").forEach(function (bar) {
      bar.hidden = !me;
      if (me) { bar.querySelector("[data-me-bar-name]").textContent = me.name.split(" ")[0]; bar.querySelector("[data-me-bar-points]").textContent = (me.bonus || 0).toLocaleString(); }
    });
    var page = document.querySelector("[data-account-page]"); if (!page) return;
    if (!me) { window.location.replace(base + "login.html?next=account"); return; }
    page.querySelectorAll("[data-me-name]").forEach(function (e) { e.textContent = me.name; });
    page.querySelectorAll("[data-me-avatar]").forEach(function (e) { e.src = imgUrl(me.avatar || (C.avatars || {})[me.type] || ""); e.alt = me.name; });
    page.querySelectorAll("[data-me-first]").forEach(function (e) { e.textContent = me.name.split(" ")[0]; });
    page.querySelectorAll("[data-me-email]").forEach(function (e) { e.textContent = me.email; });
    page.querySelectorAll("[data-me-type]").forEach(function (e) { e.textContent = t("account.type." + me.type); });
    page.querySelectorAll("[data-me-bonus]").forEach(function (e) { e.textContent = (me.bonus || 0).toLocaleString(); });
    page.querySelectorAll("[data-me-orders-n]").forEach(function (e) { e.textContent = me.orders.length; });
    page.querySelectorAll("[data-me-spent]").forEach(function (e) { e.textContent = money(me.orders.reduce(function (n, o) { return n + o.total; }, 0)); });
    page.querySelectorAll("[data-business-only]").forEach(function (e) { e.hidden = me.type !== "business"; });
    var addr = me.address || {};
    page.querySelectorAll("[data-me-address]").forEach(function (e) { e.textContent = addr.street ? [addr.street, addr.area, addr.city + (addr.postcode ? " " + addr.postcode : "")].filter(Boolean).join(", ") : t("account.noaddress"); });
    var f = page.querySelector("[data-details-form]");
    if (f && !f._filled) { f._filled = true; f.name.value = me.name; f.phone.value = me.phone || ""; f.company.value = me.company || ""; f.vat.value = me.vat || ""; f.street.value = addr.street || ""; f.area.value = addr.area || ""; f.city.value = addr.city || "Nicosia"; f.postcode.value = addr.postcode || ""; f.notes.value = addr.notes || ""; }
    var ol = page.querySelector("[data-orders]");
    if (ol) ol.innerHTML = me.orders.length ? me.orders.map(orderRow).join("") : '<p class="muted">' + esc(t("order.none")) + '</p>';
    var recent = page.querySelector("[data-orders-recent]");
    if (recent) recent.innerHTML = me.orders.length ? me.orders.slice(0, 2).map(orderRow).join("") : '<p class="muted">' + esc(t("order.none")) + '</p>';
  }

  function checkout() {
    var me = Account.me();
    if (!me) { window.location.href = base + "login.html?next=checkout"; return; }
    var tot = Cart.totals();
    var order = { id: String(Date.now()).slice(-6), at: Date.now(), items: Cart.items(), total: tot.total };
    Account.addOrder(order); Cart.clear(); openDrawer(false);
    try { // hand the order to the staff panel too
      var ao = JSON.parse(localStorage.getItem("ath:adminOrders") || "null");
      if (ao) { ao.unshift({ id: order.id, at: order.at, customer: me.name, email: me.email, type: me.type === "business" ? "delivery" : "collection", address: me.address && me.address.street ? me.address.street + ", " + (me.address.area || "") : "", phone: me.phone || "", items: order.items, total: order.total, status: "new", slot: me.type === "business" ? "06:00–07:00" : "11:30–12:00", driver: "", notes: me.address && me.address.notes || "" }); localStorage.setItem("ath:adminOrders", JSON.stringify(ao)); }
    } catch (e) { /* ignore */ }
    window.location.href = base + "account.html?placed=" + order.id;
  }

  /* ----- events ----------------------------------------------------------- */
  document.addEventListener("click", function (e) {
    var b;
    if ((b = e.target.closest("[data-add]"))) { flyToCart(b); var pgEl = b.hasAttribute("data-add-qty") && document.querySelector("[data-product-page]"); var card = b.closest(".product"); var w = card && card.querySelector("[data-weight]"); Cart.add(b.getAttribute("data-add"), pgEl ? pgEl._qty || 1 : (w ? parseFloat(w.value) || 1 : 1)); toast(t("cart.added")); b.classList.add("is-added"); setTimeout(function () { b.classList.remove("is-added"); }, 600); }
    else if ((b = e.target.closest("[data-add-recipe]"))) { var r = C.recipes.filter(function (x) { return x.id === b.getAttribute("data-add-recipe"); })[0]; if (r) { r.items.forEach(function (it) { Cart.add(it[0], it[1]); }); toast(t("cart.added")); openDrawer(true); } }
    else if ((b = e.target.closest("[data-add-bundle]"))) { var bd = C.bundles.filter(function (x) { return x.id === b.getAttribute("data-add-bundle"); })[0]; if (bd) { bd.items.forEach(function (it) { if (it[1] > 0) Cart.add(it[0], it[1]); }); toast(t("cart.added")); openDrawer(true); } }
    else if ((b = e.target.closest("[data-qty]"))) { var cur = Cart.items().filter(function (x) { return x.id === b.getAttribute("data-qty"); })[0]; if (cur) { var stp = isKg(byId(cur.id)) ? 0.25 : 1; Cart.setQty(cur.id, Math.round((cur.qty + parseInt(b.getAttribute("data-delta"), 10) * stp) * 100) / 100); } }
    else if ((b = e.target.closest("[data-remove]"))) Cart.remove(b.getAttribute("data-remove"));
    else if (e.target.closest("[data-cart-open]")) { e.preventDefault(); openDrawer(true); }
    else if (e.target.closest("[data-cart-close]")) openDrawer(false);
    else if ((b = e.target.closest("[data-checkout]"))) checkout();
    else if ((b = e.target.closest("[data-reorder]"))) { var me2 = Account.me(); var o = me2 && me2.orders.filter(function (x) { return x.id === b.getAttribute("data-reorder"); })[0]; if (o) { o.items.forEach(function (x) { Cart.add(x.id, x.qty); }); toast(t("cart.added")); openDrawer(true); } }
    else if (e.target.closest("[data-logout]")) { Account.logout(); renderCartUI(); window.location.href = base + "index.html"; }
    else if ((b = e.target.closest("[data-demo-login]"))) { Account.login(b.getAttribute("data-demo-login"), "demo"); afterAuth(); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") openDrawer(false); });

  var params = new URLSearchParams(location.search);
  function afterAuth() {
    var next = params.get("next");
    if (next === "checkout" && Cart.count()) { checkout(); return; }
    window.location.href = base + "account.html";
  }
  function initAccountForms() {
    var login = document.querySelector("[data-login-form]"), reg = document.querySelector("[data-register-form]"), det = document.querySelector("[data-details-form]");
    if ((login || reg) && Account.me() && !params.get("next")) { window.location.replace(base + "account.html"); return; }
    if (login) login.addEventListener("submit", function (e) {
      e.preventDefault(); if (!login.checkValidity()) { login.reportValidity(); return; }
      var r = Account.login(login.email.value, login.password.value);
      var err = login.querySelector(".form-error"); err.hidden = !r.error; if (r.error) err.textContent = t("account.err.invalid"); else afterAuth();
    });
    if (reg) {
      if (params.get("type") === "business") { var rb = reg.querySelector("input[value='business']"); if (rb) rb.checked = true; }
      reg.addEventListener("submit", function (e) {
        e.preventDefault(); if (!reg.checkValidity()) { reg.reportValidity(); return; }
        var r = Account.register(reg.name.value, reg.email.value, reg.password.value, reg.type.value);
        var err = reg.querySelector(".form-error"); err.hidden = !r.error; if (r.error) err.textContent = t("account.err.exists"); else { Account.update({ phone: reg.phone.value, address: { street: reg.street.value, area: reg.area.value, city: reg.city.value, postcode: reg.postcode.value, notes: "" } }); afterAuth(); }
      });
    }
    if (det) det.addEventListener("submit", function (e) {
      e.preventDefault(); if (!det.checkValidity()) { det.reportValidity(); return; }
      Account.update({ name: det.name.value, phone: det.phone.value, company: det.company.value, vat: det.vat.value, address: { street: det.street.value, area: det.area.value, city: det.city.value, postcode: det.postcode.value, notes: det.notes.value } });
      det._filled = false; renderAccountUI(); toast(t("account.saved"));
    });
    var placed = params.get("placed"); var msg = document.querySelector("[data-placed]");
    if (placed && msg) { msg.hidden = false; msg.querySelector("b").textContent = "#" + placed; }
    document.querySelectorAll("[data-tab]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll("[data-tab]").forEach(function (x) { x.setAttribute("aria-selected", x === tab ? "true" : "false"); });
        document.querySelectorAll("[data-panel]").forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== tab.getAttribute("data-tab"); });
        history.replaceState(null, "", "#" + tab.getAttribute("data-tab"));
      });
    });
    var h = location.hash.slice(1); var tb = h && document.querySelector("[data-tab='" + h + "']"); if (tb) tb.click();
  }

  function renderProductPage() {
    var pg = document.querySelector("[data-product-page]"); if (!pg) return;
    var p = byId(pg.getAttribute("data-product-page")); if (!p) return;
    pg.querySelectorAll("[data-p-name]").forEach(function (e) { e.textContent = p.name[lang()] || p.name.en; });
    var d = C.desc && C.desc[p.section]; var ov = lang() === "el" ? p.descEl : p.descEn; if (ov || d) pg.querySelector("[data-p-desc]").textContent = ov || d[lang()] || d.en;
    document.title = (p.name[lang()] || p.name.en) + " — Athienitis";
    var hero = pg.querySelector(".pdp__media img"); if (hero && hero.getAttribute("src") !== p.img) hero.src = imgUrl(p.img);
    // price block & badges always come from the live catalog (staff edits, offers, expiries)
    var pr = pg.querySelector(".pdp__price"), off = p.was ? Math.round((1 - p.price / p.was) * 100) : 0;
    if (pr) pr.innerHTML = '<b>' + money(p.price) + '</b>' + (p.was ? '<s>' + money(p.was) + '</s>' : '') + '<small>/ ' + esc(t("unit." + p.unit)) + '</small>' + (off ? '<span class="pdp__save">' + esc(t("offers.save")) + ' ' + money(p.was - p.price) + '</span>' : '') + (p.member ? '<span class="pdp__save" style="background:var(--orange-tint);color:var(--orange-deep)">Bonus: ' + money(p.member) + '</span>' : '');
    var badge = pg.querySelector(".pdp__media .product__off"); if (off) { if (!badge) { badge = document.createElement("span"); badge.className = "product__off"; pg.querySelector(".pdp__media").appendChild(badge); } badge.textContent = "-" + off + "%"; } else if (badge) badge.remove();
    var recs = C.recipes.filter(function (r) { return r.items.some(function (it) { return it[0] === p.id; }); });
    var sec = pg.querySelector("[data-p-recipes]"), list = pg.querySelector("[data-p-recipe-list]");
    if (sec && list) {
      sec.hidden = !recs.length;
      list.innerHTML = recs.map(function (r) { var rd = r[lang()] || r.en; return '<article class="post"><a class="post__img" href="' + base + 'recipes.html"><img src="' + imgUrl(r.img) + '" alt="" loading="lazy"></a><div class="post__body"><div class="post__meta"><span>' + r.minutes + ' min · ' + r.serves + ' ' + esc(t("recipe.serves")) + '</span></div><h3><a href="' + base + 'recipes.html">' + esc(rd.title) + '</a></h3><p>' + esc(rd.desc) + '</p><button class="btn btn--primary btn--sm" type="button" data-add-recipe="' + r.id + '" style="align-self:flex-start;margin-top:auto">' + esc(t("recipe.addall")) + '</button></div></article>'; }).join("");
    }
    if (!pg._qty) {
      pg._qty = 1;
      var pp = byId(pg.getAttribute("data-product-page"));
      var stp = isKg(pp) ? 0.25 : 1, min = isKg(pp) ? 0.25 : 1;
      var out = pg.querySelector("[data-pqty-val]"); if (out) out.textContent = qtyLabel(pp, pg._qty);
      pg.addEventListener("click", function (e) {
        var b = e.target.closest("[data-pqty]"); if (!b) return;
        pg._qty = Math.max(min, Math.round((pg._qty + parseInt(b.getAttribute("data-pqty"), 10) * stp) * 100) / 100);
        if (out) out.textContent = qtyLabel(pp, pg._qty);
      });
    }
  }

  function renderAll() { renderProductPage(); renderProducts(); if (window._renderSearchPage) window._renderSearchPage(); renderRecipes(); renderBundles(); renderCartUI(); renderAccountUI(); if (window.ATH && window.ATH.observe) window.ATH.observe(); }

  document.addEventListener("DOMContentLoaded", function () {
    seedUsers(); initSearch(); initAccountForms(); renderAll();
    if (window.ATH) window.ATH.onLang(renderAll);
  });
  window.ATHShop = { Cart: Cart, Account: Account, search: search };
})();
