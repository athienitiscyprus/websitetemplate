/* ==========================================================================
   Athienitis — staff admin panel (demo, localStorage-backed)
   Orders · Deliveries · Products (add / edit / remove) · Inventory · Dashboard
   Product edits are applied to the storefront through ath:catalogOverrides,
   which js/shop.js merges on load. Replace the DB object with API calls later.
   ========================================================================== */
(function () {
  "use strict";
  var C = window.CATALOG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function money(n) { return "€" + (+n).toFixed(2); }
  function imgUrl(src) { return !src || /^(https?:)?\/\//.test(src) ? src : "../" + src.replace(/^(\.\.\/)+/, ""); }
  function fmtDate(ts) { return new Date(ts).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  var STATUS = ["new", "preparing", "ready", "out-for-delivery", "delivered", "collected", "cancelled"];
  var SECTIONS = Object.keys(C.sections);

  /* ----- storage ------------------------------------------------------------ */
  var DB = {
    get: function (k, d) { try { var v = localStorage.getItem("ath:" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { localStorage.setItem("ath:" + k, JSON.stringify(v)); }
  };

  /* ----- catalog with overrides --------------------------------------------- */
  function overrides() { return DB.get("catalogOverrides", { updated: {}, deleted: [], added: [] }); }
  function products() {
    var o = overrides();
    var list = C.products.filter(function (p) { return o.deleted.indexOf(p.id) === -1; }).map(function (p) { return Object.assign({}, p, o.updated[p.id] || {}); });
    return list.concat(o.added.map(function (p) { return Object.assign({}, p, o.updated[p.id] || {}); }));
  }
  function product(id) { return products().filter(function (p) { return p.id === id; })[0]; }
  function saveProduct(p, isNew) {
    var o = overrides();
    if (isNew) o.added.push(p); else { var base = C.products.filter(function (x) { return x.id === p.id; })[0]; if (base) o.updated[p.id] = p; else o.added = o.added.map(function (x) { return x.id === p.id ? p : x; }); }
    DB.set("catalogOverrides", o);
  }
  function deleteProduct(id) {
    var o = overrides();
    if (C.products.some(function (p) { return p.id === id; })) o.deleted.push(id); else o.added = o.added.filter(function (p) { return p.id !== id; });
    delete o.updated[id]; DB.set("catalogOverrides", o);
    var inv = DB.get("inventory", {}); delete inv[id]; DB.set("inventory", inv);
  }

  /* ----- inventory ------------------------------------------------------------ */
  function inventory() {
    var inv = DB.get("inventory", null);
    if (!inv) {
      inv = {};
      products().forEach(function (p, i) { var r = (i * 37) % 23; inv[p.id] = { stock: p.unit === "kg" ? 18 + r : 6 + r * 2, reorder: p.unit === "kg" ? 10 : 8, log: [] }; });
      // a few deliberately low
      ["bk1", "dl1", "fs2", "cl1", "cn4", "bt3"].forEach(function (id) { if (inv[id]) inv[id].stock = 3; });
      DB.set("inventory", inv);
    }
    products().forEach(function (p) { if (!inv[p.id]) inv[p.id] = { stock: 0, reorder: 8, log: [] }; });
    return inv;
  }
  function adjustStock(id, delta, reason) {
    var inv = inventory(); var it = inv[id]; if (!it) return;
    it.stock = Math.max(0, it.stock + delta); it.log.unshift({ at: Date.now(), delta: delta, reason: reason || "" }); it.log = it.log.slice(0, 20);
    DB.set("inventory", inv);
  }

  /* ----- orders: seed from customer accounts + demo orders ---------------------- */
  var FIRST = ["Elena", "Kostas", "Niki", "Petros", "Sofia", "Yiannis", "Christina", "Marios", "Andri", "Stelios", "Demetra", "Loizos"];
  var LAST = ["Ioannou", "Charalambous", "Nicolaou", "Constantinou", "Savva", "Kyriakou", "Michael", "Papadopoulou", "Hadjigeorgiou"];
  function orders() {
    var list = DB.get("adminOrders", null);
    if (list) return list;
    list = [];
    var users = DB.get("users", {});
    Object.keys(users).forEach(function (email) {
      var u = users[email];
      (u.orders || []).forEach(function (o) {
        list.push({ id: o.id, at: o.at, customer: u.name, email: email, type: u.type === "business" ? "delivery" : "collection", address: u.address && u.address.street ? u.address.street + ", " + (u.address.area || "") : "", phone: u.phone || "", items: o.items, total: o.total, status: !o.status ? "new" : (o.status === "preparing" ? "preparing" : o.status), slot: u.type === "business" ? "06:00–07:00" : "11:30–12:00", driver: u.type === "business" ? "Andreas K." : "", notes: u.address && u.address.notes || "" });
      });
    });
    var seed = 7; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var all = products();
    for (var i = 0; i < 28; i++) {
      var n = 1 + Math.floor(rnd() * 5), items = [], total = 0;
      for (var k = 0; k < n; k++) { var p = all[Math.floor(rnd() * all.length)]; var q = 1 + Math.floor(rnd() * 3); items.push({ id: p.id, qty: q }); total += p.price * q; }
      var ago = Math.floor(rnd() * 14 * 24 * 60) * 60000; var at = Date.now() - ago;
      var delivery = rnd() < 0.3;
      var st = ago < 3 * 3600e3 ? (rnd() < 0.5 ? "new" : "preparing") : ago < 8 * 3600e3 ? (delivery ? "out-for-delivery" : "ready") : (rnd() < 0.06 ? "cancelled" : (delivery ? "delivered" : "collected"));
      list.push({ id: String(480000 + Math.floor(rnd() * 9999)), at: at, customer: FIRST[Math.floor(rnd() * FIRST.length)] + " " + LAST[Math.floor(rnd() * LAST.length)], email: "", type: delivery ? "delivery" : "collection",
        address: delivery ? (1 + Math.floor(rnd() * 90)) + " " + ["Makarios Ave", "Ledra St", "Kennedy Ave", "Athalassas Ave", "Stasinou Ave"][Math.floor(rnd() * 5)] + ", Nicosia" : "", phone: "99 " + Math.floor(100000 + rnd() * 899999), items: items, total: Math.round(total * 100) / 100, status: st,
        slot: delivery ? ["06:00–07:00", "08:00–09:00", "10:00–11:00"][Math.floor(rnd() * 3)] : ["09:00–09:30", "11:30–12:00", "17:00–17:30", "18:30–19:00"][Math.floor(rnd() * 4)], driver: delivery ? ["Andreas K.", "Maria P.", ""][Math.floor(rnd() * 3)] : "", notes: "" });
    }
    list.sort(function (a, b) { return b.at - a.at; });
    DB.set("adminOrders", list); return list;
  }
  function saveOrders(list) { DB.set("adminOrders", list); }
  function setStatus(id, status) {
    var list = orders(); var o = list.filter(function (x) { return x.id === id; })[0]; if (!o) return;
    var prev = o.status; o.status = status; o.history = o.history || []; o.history.unshift({ at: Date.now(), status: status });
    if (prev === "new" && status === "preparing") o.items.forEach(function (it) { adjustStock(it.id, -it.qty, "Order #" + id); });
    saveOrders(list);
    // reflect to customer account if it exists
    var users = DB.get("users", {}); if (o.email && users[o.email]) { users[o.email].orders.forEach(function (uo) { if (uo.id === id) uo.status = status === "out-for-delivery" ? "preparing" : status; }); DB.set("users", users); }
  }
  function pullNewStorefrontOrders() {
    // orders placed on the storefront since the admin store was created
    var list = orders(); var ids = {}; list.forEach(function (o) { ids[o.id] = 1; }); var users = DB.get("users", {}); var added = 0;
    Object.keys(users).forEach(function (email) { var u = users[email]; (u.orders || []).forEach(function (o) { if (!ids[o.id]) { list.unshift({ id: o.id, at: o.at, customer: u.name, email: email, type: u.type === "business" ? "delivery" : "collection", address: u.address && u.address.street ? u.address.street + ", " + (u.address.area || "") : "", phone: u.phone || "", items: o.items, total: o.total, status: "new", slot: u.type === "business" ? "06:00–07:00" : "11:30–12:00", driver: "", notes: u.address && u.address.notes || "" }); added++; } }); });
    if (added) { list.sort(function (a, b) { return b.at - a.at; }); saveOrders(list); }
    return added;
  }

  function salesFor(id, days) {
    var since = Date.now() - (days || 30) * 864e5, units = 0, rev = 0;
    orders().forEach(function (o) { if (o.status === "cancelled" || o.at < since) return; o.items.forEach(function (it) { if (it.id === id) { units += it.qty; var p = product(id); rev += (p ? p.price : 0) * it.qty; } }); });
    return { units: units, revenue: rev };
  }
  function restock(id, qty, cost, supplier) {
    adjustStock(id, qty, "restock" + (supplier ? " · " + supplier : "") + (cost ? " · " + money(cost) : ""));
    var inv = inventory(); inv[id].lastRestock = Date.now(); DB.set("inventory", inv);
  }

  /* ----- auth ------------------------------------------------------------------- */
  var PIN = "1963";
  function initAuth() {
    var gate = $("#gate"), app = $("#app");
    function show(ok) { gate.hidden = ok; app.hidden = !ok; if (ok) route(); }
    show(sessionStorage.getItem("ath:staff") === "1");
    $("#gate form").addEventListener("submit", function (e) {
      e.preventDefault(); var v = $("#pin").value.trim();
      if (v === PIN) { sessionStorage.setItem("ath:staff", "1"); show(true); } else { $("#gate .form-error").hidden = false; $("#pin").value = ""; $("#pin").focus(); }
    });
    $$("[data-logout]").forEach(function (b) { b.addEventListener("click", function () { sessionStorage.removeItem("ath:staff"); show(false); }); });
  }

  /* ----- routing ------------------------------------------------------------------- */
  var VIEWS = { dashboard: renderDashboard, orders: renderOrders, deliveries: renderDeliveries, products: renderProducts, inventory: renderInventory, product: renderProductDetail };
  function route() {
    var h = (location.hash || "#dashboard").slice(1); var v = h.split("/")[0].split("?")[0]; if (!VIEWS[v]) v = "dashboard";
    $$(".adm__nav a").forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + (v === "product" ? "products" : v)); });
    $("#view").innerHTML = ""; VIEWS[v]($("#view"), h.split("/")[1]);
    $("#view").scrollTop = 0; window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  /* ----- helpers ------------------------------------------------------------------- */
  function pill(status) { return '<span class="st st--' + status + '">' + status.replace(/-/g, " ") + '</span>'; }
  function itemsText(items) { return items.map(function (it) { var p = product(it.id) || C.products.filter(function (x) { return x.id === it.id; })[0]; return it.qty + "× " + (p ? p.name.en : it.id); }).join(", "); }
  function modal(html, onOpen) {
    var m = $("#modal"); m.querySelector(".modal__body").innerHTML = html; m.hidden = false; document.body.style.overflow = "hidden";
    if (onOpen) onOpen(m);
  }
  function closeModal() { $("#modal").hidden = true; document.body.style.overflow = ""; }
  document.addEventListener("click", function (e) { if (e.target.closest("[data-modal-close]")) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  function toast(msg) { var el = $(".toast") || document.body.appendChild(Object.assign(document.createElement("div"), { className: "toast" })); el.textContent = msg; el.classList.add("is-visible"); clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove("is-visible"); }, 2000); }
  function downloadCSV(name, rows) {
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
    var a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = name; a.click();
  }

  /* ----- DASHBOARD ----------------------------------------------------------------- */
  function renderDashboard(root) {
    var list = orders(), inv = inventory(), all = products();
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var todays = list.filter(function (o) { return o.at >= today.getTime() && o.status !== "cancelled"; });
    var rev = todays.reduce(function (n, o) { return n + o.total; }, 0);
    var open = list.filter(function (o) { return ["new", "preparing", "ready", "out-for-delivery"].indexOf(o.status) !== -1; });
    var low = all.filter(function (p) { return inv[p.id] && inv[p.id].stock <= inv[p.id].reorder; });
    // 14-day revenue series
    var days = []; for (var i = 13; i >= 0; i--) { var d = new Date(today); d.setDate(d.getDate() - i); days.push({ t: d.getTime(), v: 0, label: d.toLocaleDateString("en-GB", { weekday: "short" }) }); }
    list.forEach(function (o) { if (o.status === "cancelled") return; for (var k = days.length - 1; k >= 0; k--) if (o.at >= days[k].t) { days[k].v += o.total; break; } });
    var max = Math.max.apply(null, days.map(function (d) { return d.v; })) || 1;
    // per-counter sales
    var bySec = {}; SECTIONS.forEach(function (s) { bySec[s] = 0; });
    list.forEach(function (o) { if (o.status === "cancelled") return; o.items.forEach(function (it) { var p = product(it.id); if (p) bySec[p.section] += p.price * it.qty; }); });
    var secMax = Math.max.apply(null, SECTIONS.map(function (s) { return bySec[s]; })) || 1;
    root.innerHTML = '<div class="adm__head"><div><h1>Dashboard</h1><p class="muted">' + today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) + '</p></div><button class="btn btn--ghost btn--sm" data-pull>Sync storefront orders</button></div>' +
      '<div class="kpis"><div class="kpi"><span>Today\'s revenue</span><b>' + money(rev) + '</b><small>' + todays.length + ' orders</small></div><div class="kpi"><span>Open orders</span><b>' + open.length + '</b><small>' + open.filter(function (o) { return o.status === "new"; }).length + ' new</small></div><div class="kpi"><span>Deliveries today</span><b>' + todays.filter(function (o) { return o.type === "delivery"; }).length + '</b><small>' + list.filter(function (o) { return o.status === "out-for-delivery"; }).length + ' on the road</small></div><div class="kpi kpi--warn"><span>Low stock</span><b>' + low.length + '</b><small>below reorder level</small></div></div>' +
      '<div class="adm__cols"><div class="acard"><h2>Revenue, last 14 days</h2><div class="bars">' + days.map(function (d) { return '<div class="bar" style="--h:' + (d.v / max * 100) + '%" title="' + money(d.v) + '"><i></i><span>' + d.label[0] + '</span></div>'; }).join("") + '</div></div>' +
      '<div class="acard"><h2>Sales by counter</h2><div class="hbars">' + SECTIONS.sort(function (a, b) { return bySec[b] - bySec[a]; }).map(function (s) { return '<div class="hbar"><span>' + esc(s) + '</span><i style="--w:' + (bySec[s] / secMax * 100) + '%"></i><b>' + money(bySec[s]) + '</b></div>'; }).join("") + '</div></div></div>' +
      '<div class="adm__cols"><div class="acard"><div class="acard__head"><h2>Needs attention</h2><a href="#orders">All orders</a></div><table class="tbl"><thead><tr><th>Order</th><th>Customer</th><th>Slot</th><th>Status</th><th></th></tr></thead><tbody>' + open.slice(0, 8).map(function (o) { return '<tr><td><b>#' + o.id + '</b><br><small>' + fmtDate(o.at) + '</small></td><td>' + esc(o.customer) + '<br><small>' + o.type + '</small></td><td>' + o.slot + '</td><td>' + pill(o.status) + '</td><td><button class="btn btn--ghost btn--sm" data-order="' + o.id + '">Open</button></td></tr>'; }).join("") + '</tbody></table></div>' +
      '<div class="acard"><div class="acard__head"><h2>Low stock</h2><a href="#inventory">Inventory</a></div><table class="tbl"><thead><tr><th>Product</th><th>Stock</th><th>Reorder at</th><th></th></tr></thead><tbody>' + low.slice(0, 8).map(function (p) { return '<tr><td><a href="#product/' + p.id + '" class="row-link"><img class="thumb" src="' + imgUrl(p.img) + '" alt=""> ' + esc(p.name.en) + '</a></td><td><b class="warn">' + inv[p.id].stock + '</b></td><td>' + inv[p.id].reorder + '</td><td><button class="btn btn--ghost btn--sm" data-restock="' + p.id + '">+ Restock</button></td></tr>'; }).join("") + '</tbody></table></div></div>';
    root.querySelector("[data-pull]").addEventListener("click", function () { var n = pullNewStorefrontOrders(); toast(n ? n + " new order(s) pulled in" : "No new storefront orders"); route(); });
  }

  /* ----- ORDERS --------------------------------------------------------------------- */
  var ofilter = { q: "", status: "", type: "" };
  function renderOrders(root) {
    var list = orders().filter(function (o) {
      return (!ofilter.status || o.status === ofilter.status) && (!ofilter.type || o.type === ofilter.type) && (!ofilter.q || (o.id + " " + o.customer + " " + itemsText(o.items)).toLowerCase().indexOf(ofilter.q.toLowerCase()) !== -1);
    });
    root.innerHTML = '<div class="adm__head"><div><h1>Orders</h1><p class="muted">' + list.length + ' shown</p></div><div class="adm__actions"><button class="btn btn--ghost btn--sm" data-export>Export CSV</button></div></div>' +
      '<div class="filters"><input type="search" placeholder="Search order, customer, product…" value="' + esc(ofilter.q) + '" data-f="q"><select data-f="status"><option value="">All statuses</option>' + STATUS.map(function (s) { return '<option' + (ofilter.status === s ? " selected" : "") + '>' + s + '</option>'; }).join("") + '</select><select data-f="type"><option value="">Collection & delivery</option><option value="collection"' + (ofilter.type === "collection" ? " selected" : "") + '>Collection</option><option value="delivery"' + (ofilter.type === "delivery" ? " selected" : "") + '>Delivery</option></select></div>' +
      '<div class="acard"><table class="tbl"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Slot</th><th>Status</th><th></th></tr></thead><tbody>' +
      list.map(function (o) { return '<tr><td><b>#' + o.id + '</b><br><small>' + fmtDate(o.at) + '</small></td><td>' + esc(o.customer) + '<br><small>' + o.type + (o.driver ? " · " + esc(o.driver) : "") + '</small></td><td class="items">' + esc(itemsText(o.items)) + '</td><td><b>' + money(o.total) + '</b></td><td>' + o.slot + '</td><td><select class="stsel st--' + o.status + '" data-status="' + o.id + '">' + STATUS.map(function (s) { return '<option' + (s === o.status ? " selected" : "") + '>' + s + '</option>'; }).join("") + '</select></td><td><button class="btn btn--ghost btn--sm" data-order="' + o.id + '">Open</button></td></tr>'; }).join("") + '</tbody></table></div>';
    $$("[data-f]", root).forEach(function (el) { el.addEventListener(el.tagName === "INPUT" ? "input" : "change", function () { ofilter[el.getAttribute("data-f")] = el.value; var pos = el.selectionStart; renderOrders(root); var n = $("[data-f=q]", root); if (el.tagName === "INPUT") { n.focus(); n.setSelectionRange(pos, pos); } }); });
    root.querySelector("[data-export]").addEventListener("click", function () { downloadCSV("orders.csv", [["Order", "Date", "Customer", "Type", "Items", "Total", "Slot", "Status"]].concat(list.map(function (o) { return [o.id, new Date(o.at).toISOString(), o.customer, o.type, itemsText(o.items), o.total.toFixed(2), o.slot, o.status]; }))); });
  }
  function openOrder(id) {
    var o = orders().filter(function (x) { return x.id === id; })[0]; if (!o) return;
    modal('<div class="modal__head"><div><h2>Order #' + o.id + '</h2><p class="muted">' + fmtDate(o.at) + ' · ' + o.type + ' · ' + o.slot + '</p></div>' + pill(o.status) + '</div>' +
      '<div class="adm__cols"><div><h3>Customer</h3><p><b>' + esc(o.customer) + '</b><br>' + esc(o.phone || "—") + (o.email ? "<br>" + esc(o.email) : "") + (o.address ? "<br>" + esc(o.address) : "") + (o.notes ? '<br><i>' + esc(o.notes) + '</i>' : "") + '</p></div><div><h3>Progress</h3><div class="steps">' + ["new", "preparing", o.type === "delivery" ? "out-for-delivery" : "ready", o.type === "delivery" ? "delivered" : "collected"].map(function (s) { var idx = STATUS.indexOf(s), cur = STATUS.indexOf(o.status); var done = (o.status === "collected" || o.status === "delivered") ? true : (s === "new" ? true : s === "preparing" ? ["preparing", "ready", "out-for-delivery"].indexOf(o.status) !== -1 : s === o.status); return '<span class="' + (done ? "is-done" : "") + '">' + s.replace(/-/g, " ") + '</span>'; }).join("") + '</div>' + (o.type === "delivery" ? '<p style="margin-top:10px"><label>Driver</label><select data-driver><option value="">Unassigned</option>' + ["Andreas K.", "Maria P.", "Giorgos L."].map(function (d) { return '<option' + (o.driver === d ? " selected" : "") + '>' + d + '</option>'; }).join("") + '</select></p>' : "") + '</div></div>' +
      '<h3>Items</h3><table class="tbl"><tbody>' + o.items.map(function (it) { var p = product(it.id); return '<tr><td>' + (p ? '<img class="thumb" src="' + imgUrl(p.img) + '" alt=""> ' + esc(p.name.en) : it.id) + '</td><td>' + it.qty + ' × ' + (p ? money(p.price) : "") + '</td><td><b>' + (p ? money(p.price * it.qty) : "") + '</b></td></tr>'; }).join("") + '<tr><td colspan="2"><b>Total</b></td><td><b>' + money(o.total) + '</b></td></tr></tbody></table>' +
      '<div class="modal__foot"><div class="btns">' + (o.status === "new" ? '<button class="btn btn--primary btn--sm" data-set="preparing">Start preparing</button>' : "") + (o.status === "preparing" ? '<button class="btn btn--primary btn--sm" data-set="' + (o.type === "delivery" ? "out-for-delivery" : "ready") + '">' + (o.type === "delivery" ? "Dispatch" : "Mark ready") + '</button>' : "") + (o.status === "ready" ? '<button class="btn btn--primary btn--sm" data-set="collected">Collected</button>' : "") + (o.status === "out-for-delivery" ? '<button class="btn btn--primary btn--sm" data-set="delivered">Delivered</button>' : "") + (["collected", "delivered", "cancelled"].indexOf(o.status) === -1 ? '<button class="btn btn--ghost btn--sm" data-set="cancelled">Cancel order</button>' : "") + '</div><button class="btn btn--ghost btn--sm" type="button" onclick="window.print()">Print slip</button></div>',
      function (m) {
        $$("[data-set]", m).forEach(function (b) { b.addEventListener("click", function () { setStatus(o.id, b.getAttribute("data-set")); closeModal(); toast("Order #" + o.id + " → " + b.getAttribute("data-set")); route(); }); });
        var dr = $("[data-driver]", m); if (dr) dr.addEventListener("change", function () { var l = orders(); l.forEach(function (x) { if (x.id === o.id) x.driver = dr.value; }); saveOrders(l); toast("Driver assigned"); });
      });
  }

  /* ----- DELIVERIES ----------------------------------------------------------------- */
  function renderDeliveries(root) {
    var list = orders().filter(function (o) { return o.type === "delivery" && ["cancelled"].indexOf(o.status) === -1; });
    var groups = [["new", "To prepare"], ["preparing", "Packing"], ["out-for-delivery", "On the road"], ["delivered", "Delivered"]];
    root.innerHTML = '<div class="adm__head"><div><h1>Deliveries</h1><p class="muted">' + list.filter(function (o) { return o.status !== "delivered"; }).length + ' active · ' + list.filter(function (o) { return o.status === "out-for-delivery"; }).length + ' on the road</p></div></div>' +
      '<div class="drivers">' + ["Andreas K.", "Maria P.", "Giorgos L."].map(function (d) { var n = list.filter(function (o) { return o.driver === d && o.status === "out-for-delivery"; }).length; return '<div class="driver"><b>' + d + '</b><span>' + (n ? n + " on the road" : "available") + '</span><i class="' + (n ? "is-busy" : "") + '"></i></div>'; }).join("") + '</div>' +
      '<div class="kanban">' + groups.map(function (g) { var col = list.filter(function (o) { return o.status === g[0]; }); return '<div class="kcol"><div class="kcol__head">' + g[1] + ' <b>' + col.length + '</b></div>' + col.map(function (o) { return '<div class="kcard" data-order="' + o.id + '"><div class="kcard__top"><b>#' + o.id + '</b><span>' + o.slot + '</span></div><div>' + esc(o.customer) + '</div><small>' + esc(o.address) + '</small><div class="kcard__foot"><span>' + o.items.reduce(function (n, x) { return n + x.qty; }, 0) + ' items · ' + money(o.total) + '</span><span class="drv">' + (o.driver ? esc(o.driver) : "—") + '</span></div></div>'; }).join("") + '</div>'; }).join("") + '</div>';
  }

  /* ----- PRODUCTS ------------------------------------------------------------------- */
  var pfilter = { q: "", section: "" };
  function renderProducts(root) {
    var inv = inventory();
    var list = products().filter(function (p) { return (!pfilter.section || p.section === pfilter.section) && (!pfilter.q || (p.name.en + " " + p.name.el + " " + p.id).toLowerCase().indexOf(pfilter.q.toLowerCase()) !== -1); });
    root.innerHTML = '<div class="adm__head"><div><h1>Products</h1><p class="muted">' + products().length + ' products · ' + products().filter(function (p) { return p.was; }).length + ' on offer</p></div><div class="adm__actions"><button class="btn btn--ghost btn--sm" data-export>Export CSV</button><button class="btn btn--primary btn--sm" data-new>+ Add product</button></div></div>' +
      '<div class="filters"><input type="search" placeholder="Search name or ID…" value="' + esc(pfilter.q) + '" data-f="q"><select data-f="section"><option value="">All counters</option>' + SECTIONS.map(function (s) { return '<option' + (pfilter.section === s ? " selected" : "") + '>' + s + '</option>'; }).join("") + '</select></div>' +
      '<div class="acard"><table class="tbl"><thead><tr><th>Product</th><th>Counter</th><th>Price</th><th>Offer</th><th>Stock</th><th></th></tr></thead><tbody>' +
      list.map(function (p) { var st = inv[p.id] ? inv[p.id].stock : 0; return '<tr class="row-link' + (p.hidden ? " is-hidden" : "") + '" data-open-product="' + p.id + '"><td><img class="thumb" src="' + imgUrl(p.img) + '" alt=""> <b>' + esc(p.name.en) + '</b>' + (p.hidden ? ' <span class="st st--cancelled">hidden</span>' : "") + '<br><small>' + esc(p.name.el) + ' · ' + p.id + '</small></td><td>' + p.section + '</td><td>' + money(p.price) + ' <small>/ ' + p.unit + '</small></td><td>' + (p.was ? '<span class="st st--ready">-' + Math.round((1 - p.price / p.was) * 100) + '% <small>was ' + money(p.was) + '</small></span>' : "—") + (p.tag === "fresh" ? ' <span class="st st--new">fresh</span>' : "") + '</td><td class="' + (inv[p.id] && st <= inv[p.id].reorder ? "warn" : "") + '"><b>' + st + '</b></td><td><a class="btn btn--ghost btn--sm" href="#product/' + p.id + '">Open</a></td></tr>'; }).join("") + '</tbody></table></div>';
    $$("[data-f]", root).forEach(function (el) { el.addEventListener(el.tagName === "INPUT" ? "input" : "change", function () { pfilter[el.getAttribute("data-f")] = el.value; var pos = el.selectionStart; renderProducts(root); if (el.tagName === "INPUT") { var n = $("[data-f=q]", root); n.focus(); n.setSelectionRange(pos, pos); } }); });
    root.querySelector("[data-new]").addEventListener("click", function () { editProduct(null); });
    root.querySelector("[data-export]").addEventListener("click", function () { downloadCSV("products.csv", [["ID", "Name EN", "Name EL", "Counter", "Price", "Was", "Unit", "Stock"]].concat(products().map(function (p) { return [p.id, p.name.en, p.name.el, p.section, p.price, p.was || "", p.unit, inv[p.id] ? inv[p.id].stock : 0]; }))); });
  }
  function editProduct(id) {
    var p = id ? product(id) : { id: "", section: "bakery", name: { en: "", el: "" }, price: 0, was: null, unit: "each", img: "", tag: "", kw: "" };
    var isNew = !id; var inv = inventory();
    modal('<div class="modal__head"><h2>' + (isNew ? "Add product" : "Edit product") + '</h2></div><form class="pform" data-pform>' +
      '<div class="row2"><label>Name (EN)<input name="en" required value="' + esc(p.name.en) + '"></label><label>Name (EL)<input name="el" required value="' + esc(p.name.el) + '"></label></div>' +
      '<div class="row3"><label>Counter<select name="section">' + SECTIONS.map(function (s) { return '<option' + (p.section === s ? " selected" : "") + '>' + s + '</option>'; }).join("") + '</select></label><label>Sold per<select name="unit">' + ["each", "kg", "g", "L", "ml", "pack", "loaf", "box", "bottle", "jar", "bunch", "platter", "portion", "cup", "slice", "set"].map(function (u) { return '<option' + (p.unit === u ? " selected" : "") + '>' + u + '</option>'; }).join("") + '</select></label><label>Custom weight<select name="byWeight"><option value="">Auto (per kg)</option><option value="yes"' + (p.byWeight === true ? " selected" : "") + '>On</option><option value="no"' + (p.byWeight === false ? " selected" : "") + '>Off</option></select></label><label>ID<input name="id" value="' + esc(p.id) + '"' + (isNew ? ' placeholder="auto"' : " readonly") + '></label></div>' +
      '<div class="row3"><label>Price (€)<input name="price" type="number" step="0.01" min="0" required value="' + p.price + '"></label><label>Was (€, optional offer)<input name="was" type="number" step="0.01" min="0" value="' + (p.was || "") + '"></label><label>Tag<select name="tag"><option value="">—</option><option value="fresh"' + (p.tag === "fresh" ? " selected" : "") + '>fresh</option></select></label></div>' +
      '<label>Photo URL<input name="img" value="' + esc(p.img) + '" placeholder="https://…"></label>' +
      '<div class="row2"><label>Stock<input name="stock" type="number" min="0" value="' + (inv[p.id] ? inv[p.id].stock : 10) + '"></label><label>Reorder level<input name="reorder" type="number" min="0" value="' + (inv[p.id] ? inv[p.id].reorder : 8) + '"></label></div>' +
      '<div class="modal__foot"><button class="btn btn--ghost btn--sm" type="button" data-modal-close>Cancel</button><button class="btn btn--primary btn--sm" type="submit">' + (isNew ? "Add product" : "Save changes") + '</button></div></form>',
      function (m) {
        $("[data-pform]", m).addEventListener("submit", function (e) {
          e.preventDefault(); var f = e.target;
          var np = { id: isNew ? (f.id.value.trim() || (f.section.value.slice(0, 2) + "x" + Date.now().toString().slice(-5))) : p.id, section: f.section.value, name: { en: f.en.value.trim(), el: f.el.value.trim() }, price: parseFloat(f.price.value), unit: f.unit.value, img: f.img.value.trim() || p.img, kw: f.en.value.toLowerCase() };
          if (f.was.value && parseFloat(f.was.value) > np.price) np.was = parseFloat(f.was.value); if (f.tag.value) np.tag = f.tag.value;
          if (f.byWeight.value === "yes") np.byWeight = true; else if (f.byWeight.value === "no") np.byWeight = false;
          saveProduct(np, isNew);
          var inv2 = inventory(); inv2[np.id] = inv2[np.id] || { stock: 0, reorder: 8, log: [] }; inv2[np.id].stock = parseInt(f.stock.value, 10) || 0; inv2[np.id].reorder = parseInt(f.reorder.value, 10) || 0; DB.set("inventory", inv2);
          closeModal(); toast(isNew ? "Product added" : "Saved — live on the storefront"); if (isNew) location.hash = "#product/" + np.id; else route();
        });
      });
  }

  /* ----- PRODUCT DETAIL (full editor) ------------------------------------------------ */
  function renderProductDetail(root, id) {
    var p = product(id); if (!p) { root.innerHTML = '<p>Product not found. <a href="#products">Back to products</a></p>'; return; }
    var inv = inventory()[p.id] || { stock: 0, reorder: 8, log: [] }; var s30 = salesFor(p.id, 30), s7 = salesFor(p.id, 7);
    var off = p.was ? Math.round((1 - p.price / p.was) * 100) : 0; var margin = p.cost ? Math.round((1 - p.cost / p.price) * 100) : null;
    var daysLeft = s30.units ? Math.round(inv.stock / (s30.units / 30)) : null;
    var desc = C.desc && C.desc[p.section] ? C.desc[p.section] : { en: "", el: "" };
    root.innerHTML = '<div class="crumbs" style="margin-bottom:10px"><a href="#products">Products</a><span>/</span><span>' + esc(p.name.en) + '</span></div>' +
      '<div class="adm__head"><div style="display:flex;gap:14px;align-items:center"><img class="pd__img" src="' + imgUrl(p.img) + '" alt=""><div><h1>' + esc(p.name.en) + '</h1><p class="muted">' + p.section + ' · ' + p.id + ' · ' + (p.hidden ? "hidden from storefront" : "live") + '</p></div></div><div class="adm__actions"><a class="btn btn--ghost btn--sm" href="../products/' + p.id + '.html" target="_blank" rel="noopener">View on site ↗</a><button class="btn btn--ghost btn--sm" data-toggle-hidden>' + (p.hidden ? "Publish" : "Hide from storefront") + '</button><button class="btn btn--ghost btn--sm warn" data-del="' + p.id + '">Remove</button></div></div>' +
      '<div class="kpis"><div class="kpi"><span>Price</span><b>' + money(p.price) + '</b><small>per ' + p.unit + (off ? ' · <span class="warn">-' + off + '% offer</span>' : "") + '</small></div><div class="kpi"><span>Margin</span><b>' + (margin === null ? "—" : margin + "%") + '</b><small>' + (p.cost ? "cost " + money(p.cost) : "add a cost price") + '</small></div><div class="kpi' + (inv.stock <= inv.reorder ? " kpi--warn" : "") + '"><span>In stock</span><b>' + inv.stock + '</b><small>' + (daysLeft !== null ? "≈ " + daysLeft + " days at current sales" : "reorder at " + inv.reorder) + '</small></div><div class="kpi"><span>Sold, 30 days</span><b>' + s30.units + '</b><small>' + money(s30.revenue) + ' · ' + s7.units + ' this week</small></div></div>' +
      '<form class="adm__cols pd" data-pd-form>' +
      '<div class="acard"><h2>Product page</h2><div class="pform">' +
        '<div class="row2"><label>Name (EN)<input name="en" required value="' + esc(p.name.en) + '"></label><label>Name (EL)<input name="el" required value="' + esc(p.name.el) + '"></label></div>' +
        '<div class="row3"><label>Counter<select name="section">' + SECTIONS.map(function (x) { return '<option' + (p.section === x ? " selected" : "") + '>' + x + '</option>'; }).join("") + '</select></label><label>Sold per<select name="unit">' + ["each", "kg", "g", "L", "ml", "pack", "loaf", "box", "bottle", "jar", "bunch", "platter", "portion", "cup", "slice", "set"].map(function (u) { return '<option' + (p.unit === u ? " selected" : "") + '>' + u + '</option>'; }).join("") + '</select></label><label>Badge<select name="tag"><option value="">—</option><option value="fresh"' + (p.tag === "fresh" ? " selected" : "") + '>fresh daily</option></select></label></div>' +
        '<div class="row2"><label>Custom weight ordering<select name="byWeight"><option value="">Automatic (on when sold per kg)</option><option value="yes"' + (p.byWeight === true ? " selected" : "") + '>On — customers pick the weight</option><option value="no"' + (p.byWeight === false ? " selected" : "") + '>Off — whole units only</option></select></label><label>Weight step<select name="wStep">' + [[0.25, "250 g"], [0.5, "500 g"], [1, "1 kg"]].map(function (w) { return '<option value="' + w[0] + '"' + ((p.wStep || 0.25) === w[0] ? " selected" : "") + '>' + w[1] + '</option>'; }).join("") + '</select></label></div>' +
        '<p class="muted" style="font-size:12.5px;margin:-4px 0 4px">The price above is the price for one of the unit chosen in "Sold per" (so for meat, the price per kilo). With custom weight ordering on, the storefront shows − / + buttons stepping by the weight step and the basket charges pro rata.</p>' +
        '<div class="row2"><label>Country of origin (EN) <small class="muted">shown on the card and product page; leave empty to hide</small><input name="originEn" value="' + esc((p.origin && p.origin.en) || "") + '" placeholder="e.g. Cyprus"></label><label>Country of origin (EL)<input name="originEl" value="' + esc((p.origin && p.origin.el) || "") + '" placeholder="π.χ. Κύπρος"></label></div>' +
        '<label>Description (EN) <small class="muted">leave empty to use the counter\'s default text</small><textarea name="descEn" rows="3" placeholder="' + esc(desc.en) + '">' + esc(p.descEn || "") + '</textarea></label>' +
        '<label>Description (EL)<textarea name="descEl" rows="3" placeholder="' + esc(desc.el) + '">' + esc(p.descEl || "") + '</textarea></label>' +
        '<label>Photo<div class="photo-row"><img src="' + imgUrl(p.img) + '" alt="" data-photo-preview><div><input name="img" value="' + esc(p.img) + '" placeholder="https://… or assets/img/…"><small class="muted">or upload: <input type="file" accept="image/*" data-photo-file></small></div></div></label>' +
      '</div></div>' +
      '<div>' +
      '<div class="acard"><h2>Pricing</h2><div class="pform">' +
        '<div class="row3"><label>Price (€)<input name="price" type="number" step="0.01" min="0" required value="' + p.price + '"></label><label>Cost price (€)<input name="cost" type="number" step="0.01" min="0" value="' + (p.cost || "") + '"></label><label>Member price (€)<input name="member" type="number" step="0.01" min="0" value="' + (p.member || "") + '"></label></div>' +
        '<div class="offer-box"><div class="row3"><label>Discount %<input name="discountPct" type="number" min="0" max="90" value="' + (off || "") + '"></label><label>Was price (€)<input name="was" type="number" step="0.01" min="0" value="' + (p.was || "") + '"></label><label>Offer ends<input name="offerEnd" type="date" value="' + (p.offerEnd || "") + '"></label></div><p class="muted" style="font-size:12.5px;margin-top:6px">Enter either a discount % (the current price becomes the offer price and "was" is calculated) or a "was" price. Leave both empty to end the offer. An end date removes the offer automatically on the storefront.</p><div class="btns" style="margin-top:8px">' + [10, 15, 20, 25, 30].map(function (d) { return '<button type="button" class="btn btn--ghost btn--sm" data-quick-disc="' + d + '">-' + d + '%</button>'; }).join("") + '<button type="button" class="btn btn--ghost btn--sm" data-quick-disc="0">End offer</button></div></div>' +
      '</div></div>' +
      '<div class="acard"><h2>Inventory</h2><div class="pform">' +
        '<div class="row3"><label>Stock on hand<input name="stock" type="number" min="0" value="' + inv.stock + '"></label><label>Reorder level<input name="reorder" type="number" min="0" value="' + inv.reorder + '"></label><label>Target stock<input name="target" type="number" min="0" value="' + (inv.target || inv.reorder * 2) + '"></label></div>' +
        '<div class="row2"><label>Supplier<input name="supplier" value="' + esc(inv.supplier || "") + '" placeholder="e.g. Zorbas Bakeries"></label><label>Lead time (days)<input name="lead" type="number" min="0" value="' + (inv.lead || 1) + '"></label></div>' +
        '<div class="restock"><b>Restock now</b><div class="row3"><label>Quantity<input name="rqty" type="number" min="1" value="' + Math.max((inv.target || inv.reorder * 2) - inv.stock, 0) + '"></label><label>Unit cost (€)<input name="rcost" type="number" step="0.01" min="0" value="' + (p.cost || "") + '"></label><label>&nbsp;<button type="button" class="btn btn--primary btn--sm" data-restock-now>+ Receive stock</button></label></div></div>' +
        '<h3>Movements</h3><div class="log">' + (inv.log.length ? inv.log.slice(0, 8).map(function (l) { return '<div><span class="' + (l.delta > 0 ? "ok" : "warn") + '">' + (l.delta > 0 ? "+" : "") + l.delta + '</span><span>' + esc(l.reason || "adjustment") + '</span><small>' + fmtDate(l.at) + '</small></div>'; }).join("") : '<p class="muted">No movements yet.</p>') + '</div>' +
      '</div></div>' +
      '</div>' +
      '<div class="pd__save"><a class="btn btn--ghost" href="#products">Back</a><button class="btn btn--primary" type="submit">Save changes</button></div>' +
      '</form>';
    var f = $("[data-pd-form]", root);
    // discount % <-> was price coupling
    f.discountPct.addEventListener("input", function () { var d = parseFloat(f.discountPct.value); var pr = parseFloat(f.price.value); if (d > 0 && pr) f.was.value = (pr / (1 - d / 100)).toFixed(2); else if (!d) f.was.value = ""; });
    f.was.addEventListener("input", function () { var w = parseFloat(f.was.value), pr = parseFloat(f.price.value); f.discountPct.value = w > pr ? Math.round((1 - pr / w) * 100) : ""; });
    $$("[data-quick-disc]", root).forEach(function (b) { b.addEventListener("click", function () { f.discountPct.value = b.getAttribute("data-quick-disc") === "0" ? "" : b.getAttribute("data-quick-disc"); f.discountPct.dispatchEvent(new Event("input")); }); });
    f.img.addEventListener("input", function () { $("[data-photo-preview]", root).src = imgUrl(f.img.value); });
    $("[data-photo-file]", root).addEventListener("change", function (e) {
      var file = e.target.files[0]; if (!file) return; var img = new Image(); var url = URL.createObjectURL(file);
      img.onload = function () { var cv = document.createElement("canvas"); var W = 800, H = 600; cv.width = W; cv.height = H; var ctx = cv.getContext("2d"); var r = Math.max(W / img.width, H / img.height); var w = img.width * r, h = img.height * r; ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); f.img.value = cv.toDataURL("image/jpeg", 0.82); $("[data-photo-preview]", root).src = f.img.value; URL.revokeObjectURL(url); };
      img.src = url;
    });
    $("[data-restock-now]", root).addEventListener("click", function () { var q = parseInt(f.rqty.value, 10); if (!q) return; restock(p.id, q, parseFloat(f.rcost.value) * q || 0, f.supplier.value); toast("+" + q + " received"); renderProductDetail(root, p.id); });
    $("[data-toggle-hidden]", root).addEventListener("click", function () { var np = Object.assign({}, p, { hidden: !p.hidden }); saveProduct(np, false); toast(np.hidden ? "Hidden from storefront" : "Published"); renderProductDetail(root, p.id); });
    f.addEventListener("submit", function (e) {
      e.preventDefault(); if (!f.checkValidity()) { f.reportValidity(); return; }
      var np = Object.assign({}, p, { section: f.section.value, name: { en: f.en.value.trim(), el: f.el.value.trim() }, price: parseFloat(f.price.value), unit: f.unit.value, img: f.img.value.trim() || p.img, kw: f.en.value.toLowerCase() });
      ["was", "cost", "member", "tag", "offerEnd", "descEn", "descEl", "byWeight", "wStep", "origin"].forEach(function (k) { delete np[k]; });
      if (f.byWeight.value === "yes") np.byWeight = true; else if (f.byWeight.value === "no") np.byWeight = false;
      var ws = parseFloat(f.wStep.value); if (ws && ws !== 0.25) np.wStep = ws;
      var oEn = f.originEn.value.trim(), oEl = f.originEl.value.trim();
      if (oEn || oEl) np.origin = { en: oEn || oEl, el: oEl || oEn };
      var w = parseFloat(f.was.value); if (w > np.price) np.was = w; var c = parseFloat(f.cost.value); if (c > 0) np.cost = c; var m = parseFloat(f.member.value); if (m > 0 && m < np.price) np.member = m;
      if (f.tag.value) np.tag = f.tag.value; if (f.offerEnd.value && np.was) np.offerEnd = f.offerEnd.value; if (f.descEn.value.trim()) np.descEn = f.descEn.value.trim(); if (f.descEl.value.trim()) np.descEl = f.descEl.value.trim();
      saveProduct(np, false);
      var inv2 = inventory(); var it = inv2[p.id]; var newStock = parseInt(f.stock.value, 10) || 0; if (newStock !== it.stock) { it.log.unshift({ at: Date.now(), delta: newStock - it.stock, reason: "manual edit" }); it.stock = newStock; }
      it.reorder = parseInt(f.reorder.value, 10) || 0; it.target = parseInt(f.target.value, 10) || it.reorder * 2; it.supplier = f.supplier.value.trim(); it.lead = parseInt(f.lead.value, 10) || 1; DB.set("inventory", inv2);
      toast("Saved — live on the storefront"); renderProductDetail(root, p.id);
    });
  }

  /* ----- INVENTORY ------------------------------------------------------------------- */
  var ifilter = { q: "", low: false, section: "" };
  function renderInventory(root) {
    var inv = inventory(); var all = products();
    var list = all.filter(function (p) { var it = inv[p.id]; return (!ifilter.low || it.stock <= it.reorder) && (!ifilter.section || p.section === ifilter.section) && (!ifilter.q || p.name.en.toLowerCase().indexOf(ifilter.q.toLowerCase()) !== -1); });
    var low = all.filter(function (p) { return inv[p.id].stock <= inv[p.id].reorder; });
    var value = all.reduce(function (n, p) { return n + p.price * inv[p.id].stock; }, 0);
    root.innerHTML = '<div class="adm__head"><div><h1>Inventory</h1><p class="muted">' + all.length + ' lines · stock value ' + money(value) + '</p></div><div class="adm__actions"><button class="btn btn--ghost btn--sm" data-reorder-list>Reorder list (CSV)</button><button class="btn btn--ghost btn--sm" data-count>Stock count</button></div></div>' +
      '<div class="kpis kpis--3"><div class="kpi"><span>Lines in stock</span><b>' + all.filter(function (p) { return inv[p.id].stock > 0; }).length + '</b></div><div class="kpi kpi--warn"><span>Below reorder level</span><b>' + low.length + '</b></div><div class="kpi"><span>Out of stock</span><b>' + all.filter(function (p) { return inv[p.id].stock === 0; }).length + '</b></div></div>' +
      '<div class="filters"><input type="search" placeholder="Search product…" value="' + esc(ifilter.q) + '" data-f="q"><select data-f="section"><option value="">All counters</option>' + SECTIONS.map(function (s) { return '<option' + (ifilter.section === s ? " selected" : "") + '>' + s + '</option>'; }).join("") + '</select><label class="chk"><input type="checkbox" data-f="low"' + (ifilter.low ? " checked" : "") + '> Low stock only</label></div>' +
      '<div class="acard"><table class="tbl"><thead><tr><th>Product</th><th>Counter</th><th>Stock</th><th>Reorder at</th><th>Adjust</th><th>Last movement</th></tr></thead><tbody>' +
      list.map(function (p) { var it = inv[p.id]; var pct = Math.min(100, it.stock / Math.max(it.target || it.reorder * 2, 1) * 100); var last = it.log[0]; return '<tr><td><a href="#product/' + p.id + '" class="row-link"><img class="thumb" src="' + imgUrl(p.img) + '" alt=""> ' + esc(p.name.en) + '</a>' + (it.supplier ? '<br><small>' + esc(it.supplier) + '</small>' : "") + '</td><td>' + p.section + '</td><td><div class="stock' + (it.stock <= it.reorder ? " is-low" : "") + '"><b>' + it.stock + '</b> <small>' + p.unit + '</small><i style="--w:' + pct + '%"></i></div></td><td><input class="mini" type="number" min="0" value="' + it.reorder + '" data-reorder="' + p.id + '"></td><td><div class="adj"><button data-adj="' + p.id + '" data-d="-1">−</button><button data-adj="' + p.id + '" data-d="1">+</button><button data-adj="' + p.id + '" data-d="10">+10</button></div></td><td><small>' + (last ? (last.delta > 0 ? "+" : "") + last.delta + " · " + esc(last.reason || "adjustment") + " · " + fmtDate(last.at) : "—") + '</small></td></tr>'; }).join("") + '</tbody></table></div>';
    $$("[data-f]", root).forEach(function (el) { el.addEventListener(el.type === "search" ? "input" : "change", function () { ifilter[el.getAttribute("data-f")] = el.type === "checkbox" ? el.checked : el.value; var pos = el.selectionStart; renderInventory(root); if (el.type === "search") { var n = $("[data-f=q]", root); n.focus(); n.setSelectionRange(pos, pos); } }); });
    $$("[data-reorder]", root).forEach(function (el) { el.addEventListener("change", function () { var inv2 = inventory(); inv2[el.getAttribute("data-reorder")].reorder = parseInt(el.value, 10) || 0; DB.set("inventory", inv2); toast("Reorder level saved"); }); });
    root.querySelector("[data-reorder-list]").addEventListener("click", function () { downloadCSV("reorder-list.csv", [["ID", "Product", "Counter", "Stock", "Reorder at", "Suggested qty"]].concat(low.map(function (p) { var it = inv[p.id]; return [p.id, p.name.en, p.section, it.stock, it.reorder, Math.max(it.reorder * 2 - it.stock, 0)]; }))); });
    root.querySelector("[data-count]").addEventListener("click", function () {
      modal('<div class="modal__head"><h2>Stock count</h2></div><p class="muted">Enter counted quantities; differences are logged as "stock count".</p><form data-count-form><div class="countgrid">' + all.map(function (p) { return '<label><span>' + esc(p.name.en) + '</span><input type="number" min="0" name="' + p.id + '" value="' + inv[p.id].stock + '"></label>'; }).join("") + '</div><div class="modal__foot"><button class="btn btn--ghost btn--sm" type="button" data-modal-close>Cancel</button><button class="btn btn--primary btn--sm" type="submit">Save count</button></div></form>',
        function (m) { $("[data-count-form]", m).addEventListener("submit", function (e) { e.preventDefault(); var n = 0; all.forEach(function (p) { var v = parseInt(e.target[p.id].value, 10); if (!isNaN(v) && v !== inventory()[p.id].stock) { adjustStock(p.id, v - inventory()[p.id].stock, "stock count"); n++; } }); closeModal(); toast(n + " line(s) updated"); route(); }); });
    });
  }

  /* ----- global click handlers ------------------------------------------------------- */
  document.addEventListener("click", function (e) {
    var b;
    if ((b = e.target.closest("[data-order]"))) openOrder(b.getAttribute("data-order"));
    else if ((b = e.target.closest("[data-open-product]")) && !e.target.closest("a, button")) location.hash = "#product/" + b.getAttribute("data-open-product");
    else if ((b = e.target.closest("[data-edit]"))) editProduct(b.getAttribute("data-edit"));
    else if ((b = e.target.closest("[data-del]"))) { var p = product(b.getAttribute("data-del")); if (p && confirm("Remove “" + p.name.en + "” from the storefront?")) { deleteProduct(p.id); toast("Product removed"); if (location.hash.indexOf("#product/") === 0) location.hash = "#products"; else route(); } }
    else if ((b = e.target.closest("[data-adj]"))) { adjustStock(b.getAttribute("data-adj"), parseInt(b.getAttribute("data-d"), 10), "manual"); renderInventory($("#view")); }
    else if ((b = e.target.closest("[data-restock]"))) { adjustStock(b.getAttribute("data-restock"), 20, "restock"); toast("+20 added"); route(); }
  });
  document.addEventListener("change", function (e) {
    var s = e.target.closest("[data-status]"); if (s) { setStatus(s.getAttribute("data-status"), s.value); s.className = "stsel st--" + s.value; toast("Status updated"); }
  });

  document.addEventListener("DOMContentLoaded", function () {
    initAuth();
    $("[data-reset]").addEventListener("click", function () { if (confirm("Reset demo orders, inventory and product edits?")) { ["adminOrders", "inventory", "catalogOverrides"].forEach(function (k) { localStorage.removeItem("ath:" + k); }); route(); toast("Demo data reset"); } });
  });
})();
