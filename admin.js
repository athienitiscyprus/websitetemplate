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
        list.push({ id: o.id, at: o.at, customer: u.name, email: email, type: u.type === "business" ? "delivery" : "collection", address: u.address && u.address.street ? u.address.street + ", " + (u.address.area || "") : "", phone: u.phone || "", items: o.items, total: o.total, status: o.status === "preparing" ? "preparing" : (u.type === "business" ? "delivered" : "collected"), slot: u.type === "business" ? "06:00–07:00" : "11:30–12:00", driver: u.type === "business" ? "Andreas K." : "", notes: u.address && u.address.notes || "" });
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
    $("[data-logout]").addEventListener("click", function () { sessionStorage.removeItem("ath:staff"); show(false); });
  }

  /* ----- routing ------------------------------------------------------------------- */
  var VIEWS = { dashboard: renderDashboard, orders: renderOrders, deliveries: renderDeliveries, products: renderProducts, inventory: renderInventory };
  function route() {
    var v = (location.hash || "#dashboard").slice(1).split("?")[0]; if (!VIEWS[v]) v = "dashboard";
    $$(".adm__nav a").forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + v); });
    $("#view").innerHTML = ""; VIEWS[v]($("#view"));
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
      '<div class="acard"><div class="acard__head"><h2>Low stock</h2><a href="#inventory">Inventory</a></div><table class="tbl"><thead><tr><th>Product</th><th>Stock</th><th>Reorder at</th><th></th></tr></thead><tbody>' + low.slice(0, 8).map(function (p) { return '<tr><td><img class="thumb" src="' + p.img + '" alt=""> ' + esc(p.name.en) + '</td><td><b class="warn">' + inv[p.id].stock + '</b></td><td>' + inv[p.id].reorder + '</td><td><button class="btn btn--ghost btn--sm" data-restock="' + p.id + '">+ Restock</button></td></tr>'; }).join("") + '</tbody></table></div></div>';
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
      '<h3>Items</h3><table class="tbl"><tbody>' + o.items.map(function (it) { var p = product(it.id); return '<tr><td>' + (p ? '<img class="thumb" src="' + p.img + '" alt=""> ' + esc(p.name.en) : it.id) + '</td><td>' + it.qty + ' × ' + (p ? money(p.price) : "") + '</td><td><b>' + (p ? money(p.price * it.qty) : "") + '</b></td></tr>'; }).join("") + '<tr><td colspan="2"><b>Total</b></td><td><b>' + money(o.total) + '</b></td></tr></tbody></table>' +
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
      list.map(function (p) { var st = inv[p.id] ? inv[p.id].stock : 0; return '<tr><td><img class="thumb" src="' + p.img + '" alt=""> <b>' + esc(p.name.en) + '</b><br><small>' + esc(p.name.el) + ' · ' + p.id + '</small></td><td>' + p.section + '</td><td>' + money(p.price) + ' <small>/ ' + p.unit + '</small></td><td>' + (p.was ? '<span class="st st--ready">-' + Math.round((1 - p.price / p.was) * 100) + '% <small>was ' + money(p.was) + '</small></span>' : "—") + (p.tag === "fresh" ? ' <span class="st st--new">fresh</span>' : "") + '</td><td class="' + (inv[p.id] && st <= inv[p.id].reorder ? "warn" : "") + '"><b>' + st + '</b></td><td><button class="btn btn--ghost btn--sm" data-edit="' + p.id + '">Edit</button> <button class="btn btn--ghost btn--sm" data-del="' + p.id + '" title="Remove">×</button></td></tr>'; }).join("") + '</tbody></table></div>';
    $$("[data-f]", root).forEach(function (el) { el.addEventListener(el.tagName === "INPUT" ? "input" : "change", function () { pfilter[el.getAttribute("data-f")] = el.value; var pos = el.selectionStart; renderProducts(root); if (el.tagName === "INPUT") { var n = $("[data-f=q]", root); n.focus(); n.setSelectionRange(pos, pos); } }); });
    root.querySelector("[data-new]").addEventListener("click", function () { editProduct(null); });
    root.querySelector("[data-export]").addEventListener("click", function () { downloadCSV("products.csv", [["ID", "Name EN", "Name EL", "Counter", "Price", "Was", "Unit", "Stock"]].concat(products().map(function (p) { return [p.id, p.name.en, p.name.el, p.section, p.price, p.was || "", p.unit, inv[p.id] ? inv[p.id].stock : 0]; }))); });
  }
  function editProduct(id) {
    var p = id ? product(id) : { id: "", section: "bakery", name: { en: "", el: "" }, price: 0, was: null, unit: "each", img: "", tag: "", kw: "" };
    var isNew = !id; var inv = inventory();
    modal('<div class="modal__head"><h2>' + (isNew ? "Add product" : "Edit product") + '</h2></div><form class="pform" data-pform>' +
      '<div class="row2"><label>Name (EN)<input name="en" required value="' + esc(p.name.en) + '"></label><label>Name (EL)<input name="el" required value="' + esc(p.name.el) + '"></label></div>' +
      '<div class="row3"><label>Counter<select name="section">' + SECTIONS.map(function (s) { return '<option' + (p.section === s ? " selected" : "") + '>' + s + '</option>'; }).join("") + '</select></label><label>Unit<select name="unit">' + ["each", "kg", "pack", "loaf", "box", "bottle", "jar", "bunch", "platter", "portion", "cup", "slice", "set"].map(function (u) { return '<option' + (p.unit === u ? " selected" : "") + '>' + u + '</option>'; }).join("") + '</select></label><label>ID<input name="id" value="' + esc(p.id) + '"' + (isNew ? ' placeholder="auto"' : " readonly") + '></label></div>' +
      '<div class="row3"><label>Price (€)<input name="price" type="number" step="0.01" min="0" required value="' + p.price + '"></label><label>Was (€, optional offer)<input name="was" type="number" step="0.01" min="0" value="' + (p.was || "") + '"></label><label>Tag<select name="tag"><option value="">—</option><option value="fresh"' + (p.tag === "fresh" ? " selected" : "") + '>fresh</option></select></label></div>' +
      '<label>Photo URL<input name="img" value="' + esc(p.img) + '" placeholder="https://…"></label>' +
      '<div class="row2"><label>Stock<input name="stock" type="number" min="0" value="' + (inv[p.id] ? inv[p.id].stock : 10) + '"></label><label>Reorder level<input name="reorder" type="number" min="0" value="' + (inv[p.id] ? inv[p.id].reorder : 8) + '"></label></div>' +
      '<div class="modal__foot"><button class="btn btn--ghost btn--sm" type="button" data-modal-close>Cancel</button><button class="btn btn--primary btn--sm" type="submit">' + (isNew ? "Add product" : "Save changes") + '</button></div></form>',
      function (m) {
        $("[data-pform]", m).addEventListener("submit", function (e) {
          e.preventDefault(); var f = e.target;
          var np = { id: isNew ? (f.id.value.trim() || (f.section.value.slice(0, 2) + "x" + Date.now().toString().slice(-5))) : p.id, section: f.section.value, name: { en: f.en.value.trim(), el: f.el.value.trim() }, price: parseFloat(f.price.value), unit: f.unit.value, img: f.img.value.trim() || p.img, kw: f.en.value.toLowerCase() };
          if (f.was.value && parseFloat(f.was.value) > np.price) np.was = parseFloat(f.was.value); if (f.tag.value) np.tag = f.tag.value;
          saveProduct(np, isNew);
          var inv2 = inventory(); inv2[np.id] = inv2[np.id] || { stock: 0, reorder: 8, log: [] }; inv2[np.id].stock = parseInt(f.stock.value, 10) || 0; inv2[np.id].reorder = parseInt(f.reorder.value, 10) || 0; DB.set("inventory", inv2);
          closeModal(); toast(isNew ? "Product added" : "Saved — live on the storefront"); route();
        });
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
      list.map(function (p) { var it = inv[p.id]; var pct = Math.min(100, it.stock / Math.max(it.reorder * 2, 1) * 100); var last = it.log[0]; return '<tr><td><img class="thumb" src="' + p.img + '" alt=""> ' + esc(p.name.en) + '</td><td>' + p.section + '</td><td><div class="stock' + (it.stock <= it.reorder ? " is-low" : "") + '"><b>' + it.stock + '</b> <small>' + p.unit + '</small><i style="--w:' + pct + '%"></i></div></td><td><input class="mini" type="number" min="0" value="' + it.reorder + '" data-reorder="' + p.id + '"></td><td><div class="adj"><button data-adj="' + p.id + '" data-d="-1">−</button><button data-adj="' + p.id + '" data-d="1">+</button><button data-adj="' + p.id + '" data-d="10">+10</button></div></td><td><small>' + (last ? (last.delta > 0 ? "+" : "") + last.delta + " · " + esc(last.reason || "adjustment") + " · " + fmtDate(last.at) : "—") + '</small></td></tr>'; }).join("") + '</tbody></table></div>';
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
    else if ((b = e.target.closest("[data-edit]"))) editProduct(b.getAttribute("data-edit"));
    else if ((b = e.target.closest("[data-del]"))) { var p = product(b.getAttribute("data-del")); if (p && confirm("Remove “" + p.name.en + "” from the storefront?")) { deleteProduct(p.id); toast("Product removed"); route(); } }
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
