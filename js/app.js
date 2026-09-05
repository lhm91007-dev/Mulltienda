// Norte — lógica de la tienda (vanilla JS, sin build step, sin dependencias).
//
// El asistente de IA llama a tu propio backend, no a Anthropic directamente
// (igual que en la versión nativa) — mira README.md para desplegarlo.
// Puedes reutilizar el mismo server/index.js del proyecto norte-native para
// ambas apps (web y móvil), es el mismo endpoint /api/chat.
const API_BASE_URL = "https://tu-backend.example.com";

const DEFAULT_PRODUCTS = [
  { id: "r1", cat: "ropa", name: "Camisa de lino Cala", detail: "Corte holgado, algodón/lino", price: 649, stock: 18 },
  { id: "r2", cat: "ropa", name: "Chaqueta Bruma", detail: "Sarga resistente al agua", price: 1290, stock: 7 },
  { id: "r3", cat: "ropa", name: "Pantalón Recto Osca", detail: "Sastrería, cintura media", price: 890, stock: 22 },
  { id: "r4", cat: "ropa", name: "Suéter Alero", detail: "Lana merino, cuello redondo", price: 990, stock: 3 },
  { id: "r5", cat: "ropa", name: "Vestido Talara", detail: "Punto midi, manga larga", price: 1150, stock: 12 },
  { id: "e1", cat: "electro", name: "Refrigerador Nive 320L", detail: "No Frost, inverter", price: 8990, stock: 5 },
  { id: "e2", cat: "electro", name: "Lavadora Corren 12kg", detail: "Carga frontal, 10 programas", price: 6490, stock: 4 },
  { id: "e3", cat: "electro", name: "Licuadora Torbe Pro", detail: "1200W, jarra de vidrio", price: 799, stock: 30 },
  { id: "e4", cat: "electro", name: "Aspiradora Vento", detail: "Sin cable, 45 min de uso", price: 1690, stock: 9 },
  { id: "e5", cat: "electro", name: "Horno Marno 60L", detail: "Convección, 8 funciones", price: 3290, stock: 6 },
];

const ADMIN_PASS = "admin123";
const STATUS_FLOW = ["Pendiente", "Enviado", "Entregado"];
const money = (n) => "$" + Number(n).toLocaleString("es-MX");
const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const state = {
  products: loadJSON("norte_catalog", DEFAULT_PRODUCTS),
  orders: loadJSON("norte_orders", []),
  view: "store",
  category: "todo",
  cart: [],
  cartOpen: false,
  checkoutOpen: false,
  checkoutStep: "shipping",
  aiOpen: false,
  chatMessages: [
    { role: "assistant", content: "Cuéntame qué buscas —ropa, algún electrodoméstico, presupuesto u ocasión— y te sugiero opciones del catálogo." },
  ],
  chatLoading: false,
  adminAuthed: false,
  adminTab: "resumen",
  adminEditingId: null,
};

function saveProducts(next) { state.products = next; saveJSON("norte_catalog", next); }
function saveOrders(next) { state.orders = next; saveJSON("norte_orders", next); }

const ICON_PATHS = {
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  chevronLeft: '<polyline points="15 18 9 12 15 6"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  alert: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  trending: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  package: '<path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
};
function icon(name, size = 18, extraStyle = "") {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="${extraStyle}">${ICON_PATHS[name] || ""}</svg>`;
}

function addToCart(id) {
  const ex = state.cart.find((i) => i.id === id);
  state.cart = ex
    ? state.cart.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i))
    : [...state.cart, { id, qty: 1 }];
  state.cartOpen = true;
  render();
}
function setQty(id, qty) {
  state.cart = qty <= 0 ? state.cart.filter((i) => i.id !== id) : state.cart.map((i) => (i.id === id ? { ...i, qty } : i));
  render();
}
function cartItems() {
  return state.cart.map((i) => ({ ...i, p: state.products.find((p) => p.id === i.id) })).filter((i) => i.p);
}
function cartTotal() {
  return cartItems().reduce((s, i) => s + i.p.price * i.qty, 0);
}

function renderProductCard(p) {
  const outOfStock = p.stock <= 0;
  return `
    <div class="card">
      <div class="card-img">${icon(p.cat === "ropa" ? "bag" : "zap", 26)}</div>
      <div class="card-body">
        <div class="card-title">${esc(p.name)}</div>
        <div class="card-detail">${esc(p.detail)}</div>
        <div class="card-row">
          <span class="card-price">${money(p.price)}</span>
          ${outOfStock ? `<span class="stock-out">Agotado</span>` : p.stock <= 5 ? `<span class="stock-low">Quedan ${p.stock}</span>` : ""}
        </div>
        <button class="btn btn-block" data-add="${p.id}" ${outOfStock ? "disabled" : ""} style="margin-top:8px">
          ${outOfStock ? "Sin existencias" : "Añadir al carrito"}
        </button>
      </div>
    </div>`;
}

function renderStore() {
  const filtered = state.category === "todo" ? state.products : state.products.filter((p) => p.cat === state.category);
  return `
    <div class="hero">
      <h1>Ropa y electrodomésticos, sin vueltas.</h1>
      <p>Selección curada, precios claros y un asistente que te ayuda a decidir.</p>
    </div>
    <div class="chips">
      ${[["todo", "Todo"], ["ropa", "Ropa"], ["electro", "Electrodomésticos"]]
        .map(([id, label]) => `<button class="chip ${state.category === id ? "active" : ""}" data-cat="${id}">${label}</button>`)
        .join("")}
    </div>
    <div class="grid">${filtered.map(renderProductCard).join("")}</div>
    <footer class="site">
      <span>NORTE — ropa y electrodomésticos.</span>
      <span>Envíos a todo el país en 3–5 días.</span>
    </footer>`;
}

function renderCartSheet() {
  const items = cartItems();
  const total = cartTotal();
  return `
    <div class="overlay ${state.cartOpen ? "open" : ""}" id="cartOverlay">
      <div class="sheet" onclick="event.stopPropagation()">
        <div class="sheet-header">
          <span class="sheet-title">Carrito</span>
          <button id="closeCart">${icon("x", 20)}</button>
        </div>
        <div class="sheet-body">
          ${items.length === 0 ? `<p style="color:var(--ink-soft);font-size:14px">Tu carrito está vacío.</p>` : ""}
          ${items.map((i) => `
            <div class="cart-line">
              <div class="thumb">${icon(i.p.cat === "ropa" ? "bag" : "zap", 18)}</div>
              <div style="flex:1">
                <div style="font-size:13.5px">${esc(i.p.name)}</div>
                <div style="font-size:12px;color:var(--ink-soft)">${money(i.p.price)} c/u</div>
                <div class="qty-row">
                  <button class="qty-btn" data-qty="${i.id}:${i.qty - 1}">${icon("minus", 12)}</button>
                  <span style="font-size:13px">${i.qty}</span>
                  <button class="qty-btn" data-qty="${i.id}:${i.qty + 1}">${icon("plus", 12)}</button>
                </div>
              </div>
              <span style="font-size:13.5px">${money(i.p.price * i.qty)}</span>
            </div>`).join("")}
        </div>
        <div class="sheet-footer">
          <div style="display:flex;justify-content:space-between;margin-bottom:10px">
            <span style="color:var(--ink-soft)">Total</span>
            <span style="font-size:17px;font-weight:700">${money(total)}</span>
          </div>
          <button class="btn btn-block" id="goCheckout" ${items.length === 0 ? "disabled" : ""}>Continuar al pago</button>
        </div>
      </div>
    </div>`;
}

function renderCheckout() {
  const items = cartItems();
  const total = cartTotal();
  const step = state.checkoutStep;
  return `
    <div class="overlay center ${state.checkoutOpen ? "open" : ""}" id="checkoutOverlay">
      <div class="sheet" onclick="event.stopPropagation()">
        <div class="sheet-header">
          <span class="sheet-title">
            ${step === "payment" ? `<button id="backToShipping" style="display:inline-flex">${icon("chevronLeft", 18)}</button>` : ""}
            ${step === "shipping" ? "Datos de envío" : step === "payment" ? "Pago" : "Pedido confirmado"}
          </span>
          <button id="closeCheckout">${icon("x", 20)}</button>
        </div>
        <div class="sheet-body">
          ${step === "shipping" ? `
            <input class="field" id="ckName" placeholder="Nombre completo" />
            <input class="field" id="ckEmail" placeholder="Correo electrónico" />
            <input class="field" id="ckAddress" placeholder="Dirección" />
            <input class="field" id="ckCity" placeholder="Ciudad" />
            <button class="btn btn-block" id="toPayment" style="margin-top:6px">Continuar a pago</button>
          ` : ""}
          ${step === "payment" ? `
            <div class="notice">${icon("alert", 14)}<span>Pago simulado con fines de demostración. No se procesa ningún cargo real.</span></div>
            <input class="field" id="ckCardName" placeholder="Nombre en la tarjeta" />
            <input class="field" id="ckCardNumber" placeholder="Número de tarjeta" inputmode="numeric" />
            <div style="display:flex;gap:10px">
              <input class="field" id="ckExp" placeholder="MM/AA" style="flex:1" />
              <input class="field" id="ckCvc" placeholder="CVC" inputmode="numeric" style="flex:1" />
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px 0">
              <span>Total a pagar</span><strong>${money(total)}</strong>
            </div>
            <button class="btn btn-block" id="confirmOrder">Confirmar pedido</button>
          ` : ""}
          ${step === "done" ? `
            <div style="text-align:center;display:flex;flex-direction:column;gap:10px;padding:20px 0">
              <div class="ok-circle">${icon("check", 22)}</div>
              <strong id="doneName">Gracias.</strong>
              <p style="color:var(--ink-soft);font-size:13.5px">Tu pedido por ${money(total)} fue registrado y quedó visible en el panel administrativo.</p>
              <button class="btn" id="backToStore" style="align-self:center;padding:10px 22px">Volver a la tienda</button>
            </div>
          ` : ""}
        </div>
      </div>
    </div>`;
    }function renderAI() {
  return `
    <div class="overlay ${state.aiOpen ? "open" : ""}" id="aiOverlay">
      <div class="sheet" onclick="event.stopPropagation()">
        <div class="sheet-header">
          <span class="sheet-title">${icon("zap", 16, "color:var(--gold)")} Asistente de compras</span>
          <button id="closeAI">${icon("x", 20)}</button>
        </div>
        <div class="sheet-body">
          <div class="chat-scroll" id="chatScroll">
            ${state.chatMessages.map((m) => `<div class="bubble ${m.role}">${esc(m.content)}</div>`).join("")}
            ${state.chatLoading ? `<div style="font-size:13px;color:var(--ink-soft)">Pensando…</div>` : ""}
          </div>
        </div>
        <div class="sheet-footer">
          <div class="chat-input-row">
            <input class="field" id="chatInput" placeholder="Ej: busco algo para cocinar rápido" />
            <button class="send-btn" id="chatSend">${icon("send", 16)}</button>
          </div>
        </div>
      </div>
    </div>`;
}

async function sendChat() {
  const input = document.getElementById("chatInput");
  const text = (input.value || "").trim();
  if (!text || state.chatLoading) return;
  state.chatMessages.push({ role: "user", content: text });
  state.chatLoading = true;
  render();

  const catalogSummary = state.products.map((p) => `${p.name} [${p.cat}] - ${p.detail} - ${money(p.price)} - stock ${p.stock}`).join("; ");
  try {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: state.chatMessages.map((m) => ({ role: m.role, content: m.content })),
        system: `Eres el asistente de compras de una tienda de ropa y electrodomésticos. Recomienda SOLO productos de este catálogo, en español, con calidez y brevedad (máximo 4 frases), mencionando precio. No recomiendes productos con stock 0. Catálogo: ${catalogSummary}`,
      }),
    });
    const data = await res.json();
    state.chatMessages.push({ role: "assistant", content: data.reply || "No pude generar una respuesta en este momento." });
  } catch {
    state.chatMessages.push({ role: "assistant", content: "No pude conectar con el asistente. Revisa que API_BASE_URL apunte a tu backend." });
  } finally {
    state.chatLoading = false;
    render();
    const scroll = document.getElementById("chatScroll");
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }
}

function renderAdminLogin() {
  return `
    <div class="login-box">
      <div style="display:flex;align-items:center;gap:8px;color:var(--ink-soft);font-size:13px">
        ${icon("lock", 16)} Acceso administrativo
      </div>
      <input class="field" id="adminPass" type="password" placeholder="Contraseña" />
      <div id="adminError" style="color:var(--danger);font-size:12px;display:none">Contraseña incorrecta</div>
      <button class="btn" id="adminLoginBtn">Entrar</button>
      <p style="font-size:11px;color:var(--ink-soft)">Demo: contraseña "admin123". En producción esto debe validarse en un servidor, no en el navegador.</p>
    </div>`;
}

function renderAdmin() {
  if (!state.adminAuthed) return renderAdminLogin();

  const revenue = state.orders.reduce((s, o) => s + o.total, 0);
  const lowStock = state.products.filter((p) => p.stock <= 5);

  let body = "";
  if (state.adminTab === "resumen") {
    body = `
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-label">${icon("trending", 13)} Ingresos totales</div><div class="stat-value">${money(revenue)}</div></div>
        <div class="stat-card"><div class="stat-label">${icon("package", 13)} Pedidos</div><div class="stat-value">${state.orders.length}</div></div>
        <div class="stat-card"><div class="stat-label">${icon("alert", 13)} Bajo inventario</div><div class="stat-value">${lowStock.length}</div></div>
      </div>`;
  } else if (state.adminTab === "productos") {
    body = `
      <button class="btn" id="addProduct" style="margin-bottom:12px">+ Nuevo producto</button>
      <table>
        <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th></th></tr></thead>
        <tbody>
          ${state.products.map((p) => {
            const editing = state.adminEditingId === p.id;
            return `
            <tr data-row="${p.id}">
              <td>${editing ? `<input class="field" data-field="name:${p.id}" value="${esc(p.name)}" style="width:140px" />` : esc(p.name)}</td>
              <td>${editing ? `
                <select data-field="cat:${p.id}">
                  <option value="ropa" ${p.cat === "ropa" ? "selected" : ""}>Ropa</option>
                  <option value="electro" ${p.cat === "electro" ? "selected" : ""}>Electrodomésticos</option>
                </select>` : (p.cat === "ropa" ? "Ropa" : "Electrodomésticos")}</td>
              <td>${editing ? `<input class="field" data-field="price:${p.id}" type="number" value="${p.price}" style="width:80px" />` : money(p.price)}</td>
              <td>${editing ? `<input class="field" data-field="stock:${p.id}" type="number" value="${p.stock}" style="width:60px" />` : p.stock}</td>
              <td style="display:flex;gap:10px">
                <button data-edit="${p.id}">${icon("check", 14)}</button>
                <button data-del="${p.id}" style="color:var(--danger)">${icon("trash", 14)}</button>
              </td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>`;
  } else {
    body = state.orders.length === 0
      ? `<p style="color:var(--ink-soft)">Aún no hay pedidos registrados.</p>`
      : [...state.orders].reverse().map((o) => `
        <div class="order-card">
          <div style="display:flex;justify-content:space-between">
            <strong>${esc(o.customer || "Cliente")}</strong>
            <span style="font-size:11px;color:var(--ink-soft)">${new Date(o.date).toLocaleDateString("es-MX")}</span>
          </div>
          <span style="font-size:12px;color:var(--ink-soft)">${esc(o.address)}</span>
          <span style="font-size:12px;color:var(--ink-soft)">${o.items.map((it) => `${it.qty}× ${esc(it.name)}`).join(", ")}</span>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
            <strong>${money(o.total)}</strong>
            <button class="status-pill" data-advance="${o.id}" ${o.status === "Entregado" ? "disabled" : ""}>${o.status}</button>
          </div>
        </div>`).join("");
  }

  return `
    <div class="admin-wrap">
      <div class="admin-head">
        <h2>Panel administrativo</h2>
        <button id="adminExit" style="display:flex;align-items:center;gap:6px;border:1px solid var(--line);padding:8px 12px;font-size:12px;color:var(--ink-soft)">
          ${icon("logout", 14)} Salir
        </button>
      </div>
      <div class="tabs">
        ${[["resumen", "Resumen"], ["productos", "Productos"], ["pedidos", "Pedidos"]]
          .map(([id, label]) => `<button class="tab ${state.adminTab === id ? "active" : ""}" data-tab="${id}">${label}</button>`).join("")}
      </div>
      ${body}
    </div>`;
}

function render() {
  const cartCount = state.cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById("app").innerHTML = `
    <header class="header">
      <button class="logo" id="goStore" style="background:none;border:none">NORTE</button>
      <div class="header-actions">
        ${state.view === "store" ? `
          <button class="icon-btn gold" id="openAI">${icon("zap", 20)}</button>
          <button class="icon-btn" id="openCart">
            ${icon("bag", 20)}
            ${cartCount > 0 ? `<span class="badge">${cartCount}</span>` : ""}
          </button>` : ""}
        <button class="icon-btn soft" id="toggleAdmin">${icon("settings", 20)}</button>
      </div>
    </header>
    ${state.view === "admin" ? renderAdmin() : renderStore()}
    ${renderCartSheet()}
    ${renderCheckout()}
    ${renderAI()}
  `;
  attachEvents();
}

function attachEvents() {
  const $ = (sel) => document.querySelector(sel);
  const on = (sel, ev, fn) => { const el = $(sel); if (el) el.addEventListener(ev, fn); };

  on("#goStore", "click", () => { state.view = "store"; render(); });
  on("#toggleAdmin", "click", () => { state.view = state.view === "admin" ? "store" : "admin"; state.adminAuthed = false; render(); });
  on("#openAI", "click", () => { state.aiOpen = true; render(); });
  on("#closeAI", "click", () => { state.aiOpen = false; render(); });
  on("#aiOverlay", "click", () => { state.aiOpen = false; render(); });
  on("#chatSend", "click", sendChat);
  on("#chatInput", "keydown", (e) => { if (e.key === "Enter") sendChat(); });

  on("#openCart", "click", () => { state.cartOpen = true; render(); });
  on("#closeCart", "click", () => { state.cartOpen = false; render(); });
  on("#cartOverlay", "click", () => { state.cartOpen = false; render(); });
  on("#goCheckout", "click", () => { state.cartOpen = false; state.checkoutOpen = true; state.checkoutStep = "shipping"; render(); });

  on("#closeCheckout", "click", () => { state.checkoutOpen = false; render(); });
  on("#checkoutOverlay", "click", () => { state.checkoutOpen = false; render(); });
  on("#backToShipping", "click", () => { state.checkoutStep = "shipping"; render(); });
  on("#toPayment", "click", () => {
    const name = $("#ckName").value.trim();
    const email = $("#ckEmail").value.trim();
    const address = $("#ckAddress").value.trim();
    const city = $("#ckCity").value.trim();
    if (!name || !email || !address) return;
    state._ck = { name, email, address, city };
    state.checkoutStep = "payment";
    render();
  });
  on("#confirmOrder", "click", () => {
    const cardName = $("#ckCardName").value.trim();
    const cardNumber = $("#ckCardNumber").value.trim();
    if (!cardName || !cardNumber) return;
    const items = cartItems();
    const total = cartTotal();
    const form = state._ck || {};
    const order = {
      id: "ord_" + Date.now(),
      date: new Date().toISOString(),
      customer: form.name || "",
      email: form.email || "",
      address: `${form.address || ""}, ${form.city || ""}`,
      items: items.map((i) => ({ id: i.id, name: i.p.name, qty: i.qty, price: i.p.price })),
      total,
      status: "Pendiente",
    };
    saveOrders([...state.orders, order]);
    state.cart = [];
    state.checkoutStep = "done";
    render();
    const doneName = document.getElementById("doneName");
    if (doneName) doneName.textContent = `Gracias, ${(form.name || "").split(" ")[0] || ""}.`;
  });
  on("#backToStore", "click", () => { state.checkoutOpen = false; render(); });

  document.querySelectorAll("[data-cat]").forEach((btn) =>
    btn.addEventListener("click", () => { state.category = btn.dataset.cat; render(); })
  );
  document.querySelectorAll("[data-add]").forEach((btn) =>
    btn.addEventListener("click", () => addToCart(btn.dataset.add))
  );
  document.querySelectorAll("[data-qty]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const [id, qty] = btn.dataset.qty.split(":");
      setQty(id, Number(qty));
    })
  );

  on("#adminLoginBtn", "click", () => {
    const val = $("#adminPass").value;
    if (val === ADMIN_PASS) { state.adminAuthed = true; render(); }
    else { $("#adminError").style.display = "block"; }
  });
  on("#adminExit", "click", () => { state.view = "store"; state.adminAuthed = false; render(); });
  document.querySelectorAll("[data-tab]").forEach((btn) =>
    btn.addEventListener("click", () => { state.adminTab = btn.dataset.tab; render(); })
  );
  on("#addProduct", "click", () => {
    const id = "p_" + Date.now();
    saveProducts([...state.products, { id, cat: "ropa", name: "Nuevo producto", detail: "Descripción", price: 0, stock: 0 }]);
    state.adminEditingId = id;
    render();
  });
  document.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = btn.dataset.edit;
      if (state.adminEditingId === id) {
        const row = document.querySelector(`[data-row="${id}"]`);
        const nameEl = row.querySelector(`[data-field="name:${id}"]`);
        const catEl = row.querySelector(`[data-field="cat:${id}"]`);
        const priceEl = row.querySelector(`[data-field="price:${id}"]`);
        const stockEl = row.querySelector(`[data-field="stock:${id}"]`);
        saveProducts(state.products.map((p) => p.id === id ? {
          ...p,
          name: nameEl ? nameEl.value : p.name,
          cat: catEl ? catEl.value : p.cat,
          price: priceEl ? Number(priceEl.value) : p.price,
          stock: stockEl ? Number(stockEl.value) : p.stock,
        } : p));
        state.adminEditingId = null;
      } else {
        state.adminEditingId = id;
      }
      render();
    })
  );
  document.querySelectorAll("[data-del]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (confirm("¿Eliminar este producto?")) {
        saveProducts(state.products.filter((p) => p.id !== btn.dataset.del));
        render();
      }
    })
  );
  document.querySelectorAll("[data-advance]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = btn.dataset.advance;
      saveOrders(state.orders.map((o) => {
        if (o.id !== id) return o;
        const idx = STATUS_FLOW.indexOf(o.status);
        return { ...o, status: STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)] };
      }));
      render();
    })
  );
}

try {
  render();
} catch (e) {
  document.getElementById("app").innerHTML = "<pre style='padding:20px;color:red;white-space:pre-wrap;font-size:12px'>" + (e && e.stack ? e.stack : e) + "</pre>";
                                                                 }
