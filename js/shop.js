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
  var base = document.body.getAttribute("data-base") || "";

  function t(k, a) { return window.ATH ? window.ATH.t(k, a) : k; }
  function lang() { return window.ATH ? window.ATH.lang() : "en"; }
  function money(n) { return "€" + n.toFixed(2); }
  function byId(id) { for (var i = 0; i < C.products.length; i++) if (C.products[i].id === id) return C.products[i]; return null; }
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
    count: function () { return Cart.items().reduce(function (n, x) { return n + x.qty; }, 0); },
    totals: function () {
      var sub = 0, saved = 0;
      Cart.items().forEach(function (x) { var p = byId(x.id); if (!p) return; sub += p.price * x.qty; if (p.was) saved += (p.was - p.price) * x.qty; });
      var me = Account.me(); var trade = me && me.type === "business" ? sub * 0.05 : 0;
      return { sub: sub, saved: saved, trade: trade, total: sub - trade };
    }
  };

  /* ----- product card ----------------------------------------------------- */
  function productCard(p) {
    var off = p.was ? Math.round((1 - p.price / p.was) * 100) : 0;
    var sec = C.sections[p.section] || {};
    return '<article class="product" data-product="' + p.id + '">' +
      '<a class="product__img" href="' + base + 'shops/' + p.section + '.html"><img src="' + p.img + '" alt="" loading="lazy">' +
      (off ? '<span class="product__off">-' + off + '%</span>' : '') +
      (p.tag === "fresh" ? '<span class="product__fresh">' + esc(t("dept.tag.fresh")) + '</span>' : '') + '</a>' +
      '<div class="product__body"><a class="product__cat ' + (sec.color || "") + '" href="' + base + 'shops/' + p.section + '.html">' + esc(t("dept." + p.section)) + '</a>' +
      '<h3>' + esc(p.name[lang()] || p.name.en) + '</h3>' +
      '<div class="product__price"><b>' + money(p.price) + '</b>' + (p.was ? '<s>' + money(p.was) + '</s>' : '') + '<small>/ ' + esc(t("unit." + p.unit)) + '</small></div>' +
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
      if (limit) list = list.slice(0, limit);
      el.innerHTML = list.length ? list.map(productCard).join("") : '<p class="muted">' + esc(t("shop.none")) + '</p>';
      if (el.hasAttribute("data-count-target")) { var c = document.querySelector(el.getAttribute("data-count-target")); if (c) c.textContent = list.length; }
    });
    // discounts grouped by section
    document.querySelectorAll("[data-discounts-grouped]").forEach(function (el) {
      var html = "";
      Object.keys(C.sections).forEach(function (s) {
        var list = C.products.filter(function (p) { return p.section === s && p.was; });
        if (!list.length) return;
        html += '<section class="disc-group" id="' + s + '"><div class="section__head" style="margin-bottom:22px"><div><span class="eyebrow">' + esc(t("dept." + s)) + '</span><h2 class="h3" style="margin-top:8px">' + esc(t("offers.in")) + ' ' + esc(t("dept." + s)) + '</h2></div><a class="btn btn--ghost btn--sm" href="' + base + 'shops/' + s + '.html">' + esc(t("dept.link")) + '</a></div><div class="products">' + list.map(productCard).join("") + '</div></section>';
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
      return '<article class="recipe"><div class="recipe__img"><img src="' + r.img + '" alt="" loading="lazy"><span class="recipe__meta">' + r.minutes + ' min · ' + r.serves + ' ' + esc(t("recipe.serves")) + '</span></div>' +
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
      return '<article class="bundle"><div class="bundle__img"><img src="' + b.img + '" alt="" loading="lazy"><span class="product__off">-' + off + '%</span></div>' +
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
          return '<a href="' + base + 'search.html?q=' + encodeURIComponent(input.value) + '"><img src="' + p.img + '" alt=""><span><b>' + esc(p.name[lang()] || p.name.en) + '</b><small>' + esc(t("dept." + p.section)) + '</small></span><em>' + money(p.price) + '</em></a>';
        }).join("") || (input.value.length >= 2 ? '<div class="search__empty">' + esc(t("search.none")) + '</div>' : "");
        box.hidden = !box.innerHTML;
      });
      input.addEventListener("blur", function () { setTimeout(function () { if (box) box.hidden = true; }, 200); });
      input.addEventListener("focus", function () { if (box && box.innerHTML) box.hidden = false; });
      form.addEventListener("submit", function (e) { e.preventDefault(); window.location.href = base + "search.html?q=" + encodeURIComponent(input.value); });
    });
    var results = document.querySelector("[data-search-results]");
    if (results) {
      var q = new URLSearchParams(location.search).get("q") || "";
      var qEl = document.querySelector("[data-search-query]"); if (qEl) qEl.textContent = q;
      document.querySelectorAll("[data-search] input").forEach(function (i) { i.value = q; });
      var r = search(q);
      results.innerHTML = r.length ? r.map(productCard).join("") : '<p class="lead">' + esc(t("search.none")) + '</p>';
      var n = document.querySelector("[data-search-count]"); if (n) n.textContent = r.length;
    }
  }

  /* ----- basket drawer & page --------------------------------------------- */
  function renderCartUI() {
    var n = Cart.count();
    document.querySelectorAll("[data-cart-count]").forEach(function (el) { el.textContent = n; el.classList.toggle("is-empty", n === 0); });
    var tot = Cart.totals();
    document.querySelectorAll("[data-cart-list]").forEach(function (el) {
      var items = Cart.items();
      el.innerHTML = items.length ? items.map(function (x) {
        var p = byId(x.id); if (!p) return "";
        return '<div class="cart__row"><img src="' + p.img + '" alt=""><div><b>' + esc(p.name[lang()] || p.name.en) + '</b><small>' + money(p.price) + ' / ' + esc(t("unit." + p.unit)) + '</small></div>' +
          '<div class="qty"><button type="button" data-qty="' + x.id + '" data-delta="-1" aria-label="−">−</button><span>' + x.qty + '</span><button type="button" data-qty="' + x.id + '" data-delta="1" aria-label="+">+</button></div>' +
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
    var card = btn.closest(".product"); var img = card && card.querySelector("img"); var target = document.querySelector(".header [data-cart-open]");
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
    var page = document.querySelector("[data-account-page]"); if (!page) return;
    if (!me) { window.location.replace(base + "login.html?next=account"); return; }
    page.querySelectorAll("[data-me-name]").forEach(function (e) { e.textContent = me.name; });
    page.querySelectorAll("[data-me-avatar]").forEach(function (e) { e.src = me.avatar || (C.avatars || {})[me.type] || ""; e.alt = me.name; });
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
    window.location.href = base + "account.html?placed=" + order.id;
  }

  /* ----- events ----------------------------------------------------------- */
  document.addEventListener("click", function (e) {
    var b;
    if ((b = e.target.closest("[data-add]"))) { flyToCart(b); Cart.add(b.getAttribute("data-add")); toast(t("cart.added")); b.classList.add("is-added"); setTimeout(function () { b.classList.remove("is-added"); }, 600); }
    else if ((b = e.target.closest("[data-add-recipe]"))) { var r = C.recipes.filter(function (x) { return x.id === b.getAttribute("data-add-recipe"); })[0]; if (r) { r.items.forEach(function (it) { Cart.add(it[0], it[1]); }); toast(t("cart.added")); openDrawer(true); } }
    else if ((b = e.target.closest("[data-add-bundle]"))) { var bd = C.bundles.filter(function (x) { return x.id === b.getAttribute("data-add-bundle"); })[0]; if (bd) { bd.items.forEach(function (it) { if (it[1] > 0) Cart.add(it[0], it[1]); }); toast(t("cart.added")); openDrawer(true); } }
    else if ((b = e.target.closest("[data-qty]"))) { var cur = Cart.items().filter(function (x) { return x.id === b.getAttribute("data-qty"); })[0]; if (cur) Cart.setQty(cur.id, cur.qty + parseInt(b.getAttribute("data-delta"), 10)); }
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

  function renderAll() { renderProducts(); renderRecipes(); renderBundles(); renderCartUI(); renderAccountUI(); if (window.ATH && window.ATH.observe) window.ATH.observe(); }

  document.addEventListener("DOMContentLoaded", function () {
    seedUsers(); initSearch(); initAccountForms(); renderAll();
    if (window.ATH) window.ATH.onLang(renderAll);
  });
  window.ATHShop = { Cart: Cart, Account: Account, search: search };
})();
