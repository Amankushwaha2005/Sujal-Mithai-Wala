/* ============================================================
   SHARED REACT CODE — js/shared.js
   Used by: EVERY HTML page
   Contains: Header, Footer, Cart, Product cards, WhatsApp button
   ============================================================ */

var useState = React.useState;
var useEffect = React.useEffect;
var LOGO = "public/logo.jpg";
var PREVIEW = 4;

var NAV = [
  { id: "home", href: "index.html", label: "Home" },
  { id: "mithai", href: "mithai.html", label: "Our Mithai" },
  { id: "about", href: "about.html", label: "About Us" },
  { id: "why", href: "why.html", label: "Why Choose Us" },
  { id: "gallery", href: "gallery.html", label: "Gallery" },
  { id: "visit", href: "visit.html", label: "Visit Store" },
  { id: "contact", href: "contact.html", label: "Contact" },
];

var CAT_PAGES = {
  "Dry Fruit Sweets": "dry-fruit.html",
  "Kaju Specials": "kaju-specials.html",
  "Medium Range": "medium-range.html",
  "Special Laddoo": "special-laddoo.html",
  "Bengali Sweets": "bengali.html",
};

/* --- WhatsApp link helper — used by cart, visit, contact, float button --- */
function shopMailto() {
  return `mailto:${SMW.EMAIL}`;
}

function MailLink({ className, children }) {
  return (
    <a className={className ? `${className} mail-link` : "mail-link"} href={shopMailto()}>
      {children || SMW.EMAIL}
    </a>
  );
}

function waLink(text) {
  const msg = text || "Namaste Sujal Mithai Wala!";
  return `https://wa.me/${SMW.WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

/* --- Price math — used by ProductCard and cart --- */
function estimateLine(product, qtyLabel) {
  const n = parseFloat(qtyLabel) || 1;
  const lower = qtyLabel.toLowerCase();
  if (product.unit === "kg") {
    if (lower.includes("g") && !lower.includes("kg")) return (product.price * n) / 1000;
    return product.price * n;
  }
  return product.price * n;
}

function formatInr(n) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function shopIsOpen(now) {
  const d = now || new Date();
  const h = d.getHours() + d.getMinutes() / 60;
  const close = 23;
  return h >= 8 && h < close;
}

function greetingForNow() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function CountUp({ value, prefix, suffix }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const end = Number(value) || 0;
    const t0 = performance.now();
    const dur = 900;
    let raf = 0;
    function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      setN(Math.round(end * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <strong>
      {prefix || ""}
      {n.toLocaleString("en-IN")}
      {suffix || ""}
    </strong>
  );
}

function ShopStatus() {
  const [open, setOpen] = useState(shopIsOpen);
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setOpen(shopIsOpen(d));
      setClock(d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className={`shop-status ${open ? "is-open" : "is-closed"}`}>
      <i />
      {open ? "Open now" : "Closed now"} · {clock}
    </span>
  );
}

/* --- WhatsApp SVG icon — header float + visit/contact buttons --- */
function WhatsAppIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* --- Cart saved in browser so it stays when you open another HTML page --- */
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("smw-cart") || "[]");
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("smw-cart", JSON.stringify(cart));
}

function CartIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 7h14l-1.2 12.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 7z" strokeLinejoin="round" />
      <path d="M9 7V6a3 3 0 0 1 6 0v1" strokeLinecap="round" />
      <path d="M9 11v4M15 11v4" strokeLinecap="round" />
    </svg>
  );
}

function UserGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.2 19.2c.8-3.2 3.6-5.2 6.8-5.2s6 2 6.8 5.2" strokeLinecap="round" />
    </svg>
  );
}

function AccountMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className={`account ${open ? "open" : ""}`}>
      <button
        className="account-logo"
        type="button"
        aria-label="Account"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <UserGlyph />
      </button>
      {open && (
        <div className="account-drop">
          {SMW.user ? (
            <>
              <p className="auth-name">{SMW.user.name}</p>
              {SMW.user.admin && <a href="admin.html">Admin</a>}
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
                  window.location.reload();
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a href="login.html">Login</a>
              <a href="signup.html">Sign up</a>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   HEADER — sticky top bar with logo + menu + cart
   HTML pages: all
   CSS: .nav .brand .links .cart-pill .menu-btn
   ============================================================ */
function Header({ pageId, menuOpen, setMenuOpen, cartCount, onOpenCart }) {
  const offer = (SMW.offers || []).find((o) => o.active);
  return (
    <>
      {offer && (
        <div className="fest-banner">
          <p>
            <b>{offer.title}</b>
            {offer.message ? ` — ${offer.message}` : ""}
            {offer.discountPercent ? ` · ${offer.discountPercent}% off` : ""}
          </p>
          <a href="mithai.html">Shop now</a>
        </div>
      )}
      <div className="fest-banner delivery-banner">
        <p>{SMW.FREE_DELIVERY}</p>
        <a href="mithai.html">Order now</a>
      </div>
      <header className="nav">
      <a href="index.html" className="brand">
        <span className="logo-circle">
          <img src={LOGO} alt="Sujal Mithai Wala logo" />
        </span>
        <span>
          <strong>Sujal Mithai Wala</strong>
        </span>
      </a>
      <nav className={`links ${menuOpen ? "open" : ""}`}>
        {NAV.map((item) => (
          <a key={item.id} href={item.href} className={pageId === item.id ? "active" : ""}>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="nav-actions">
        <AccountMenu />
        <button className="cart-pill" onClick={onOpenCart} aria-label={`Open selection, ${cartCount} items selected`}>
          <CartIcon />
          {cartCount > 0 && <b>{cartCount}</b>}
        </button>
        <button className="menu-btn" aria-label="Open menu" onClick={() => setMenuOpen((v) => !v)}>
          ☰
        </button>
      </div>
    </header>
    </>
  );
}

/* ============================================================
   FOOTER — logo, links, address, hours
   HTML pages: all
   CSS: .foot .foot-grid .copy
   ============================================================ */
function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot-grid">
        <div>
          <span className="logo-circle">
            <img src={LOGO} alt="" />
          </span>
          <h3>Sujal Mithai Wala</h3>
          <p>Har Mithaas Mein Apnapan ❤️</p>
          <p className="hindi">शुद्धता से कोई समझौता नहीं</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          {NAV.map((item) => (
            <a key={item.id} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <div>
          <h4>Reach Us</h4>
          <p>{SMW.ADDRESS}</p>
          <p>Phone / WhatsApp: {SMW.PHONE}</p>
          <p>
            Email: <MailLink />
          </p>
          <p>{SMW.FREE_DELIVERY}</p>
        </div>
        <div>
          <h4>Opening Hours</h4>
          <p>Monday – Sunday 8:00 AM – 11:00 PM</p>
          <p>Festival Days Open till late</p>
        </div>
      </div>
      <p className="copy">© 2026 Sujal Mithai Wala. All Rights Reserved.</p>
      <p className="copy credit">
        Design and developed by{" "}
        <a href="https://shrishatechnology.com" target="_blank" rel="noreferrer">
          Shrisha Technology
        </a>
      </p>
    </footer>
  );
}

/* ============================================================
   CART DRAWER — selected items, then send WhatsApp
   CSS: .drawer-bg .drawer .cart-list .stepper
   ============================================================ */
function CartDrawer({ open, cart, setCart, onClose }) {
  if (!open) return null;
  const cartItems = cart
    .map((c) => {
      const p = SMW.products.find((x) => x.id === c.id);
      if (!p) return null;
      const line = estimateLine(p, c.qty) * c.count;
      return { ...c, product: p, line };
    })
    .filter(Boolean);
  const total = cartItems.reduce((s, x) => s + x.line, 0);

  function changeCount(index, delta) {
    setCart((prev) => {
      const next = [...prev];
      const item = { ...next[index], count: next[index].count + delta };
      if (item.count <= 0) next.splice(index, 1);
      else next[index] = item;
      return next;
    });
  }

  function whatsappOrder() {
    if (!cartItems.length) {
      window.open(waLink("Namaste! I want to place an order at Sujal Mithai Wala."), "_blank");
      return;
    }
    const lines = cartItems.map((x) => `• ${x.product.name} — ${x.qty} × ${x.count} (${formatInr(x.line)})`);
    const delivery =
      total >= SMW.FREE_DELIVERY_MIN
        ? `\nFree delivery: yes`
        : `\nFree delivery: add ₹${Math.round(SMW.FREE_DELIVERY_MIN - total)} more`;
    const msg = `Namaste Sujal Mithai Wala 🙏\n\nMy order:\n${lines.join("\n")}\n\nEstimated total: ${formatInr(total)}${delivery}\n\nPlease confirm availability.`;
    window.open(waLink(msg), "_blank");
  }

  return (
    <div className="drawer-bg" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>Selected Items</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {!cartItems.length && <p className="empty">Your list is empty. Add mithai to send on WhatsApp.</p>}
        <ul className="cart-list">
          {cartItems.map((x, i) => (
            <li key={`${x.id}-${x.qty}-${i}`}>
              <img src={x.product.image} alt="" />
              <div>
                <strong>{x.product.name}</strong>
                <span>
                  {x.qty} · {formatInr(x.line)}
                </span>
              </div>
              <div className="stepper">
                <button onClick={() => changeCount(i, -1)}>−</button>
                <b>{x.count}</b>
                <button onClick={() => changeCount(i, 1)}>+</button>
              </div>
            </li>
          ))}
        </ul>
        {!!cartItems.length && (
          <footer>
            <p>
              Estimated total <b>{formatInr(total)}</b>
            </p>
            <p className="delivery-note">
              {total >= SMW.FREE_DELIVERY_MIN
                ? `🎉 Free delivery on this order.`
                : `Add ${formatInr(SMW.FREE_DELIVERY_MIN - total)} more for free delivery.`}
            </p>
            <button className="btn primary" onClick={whatsappOrder}>
              Send list on WhatsApp
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}

/* ============================================================
   PRODUCT CARD — photo, price, qty chips, Add button
   Used on: home, mithai, category pages
   CSS: .card .thumb .qty .add .live
   ============================================================ */
function ProductCard({ p, qty, custom, onQty, onCustom, onAdd }) {
  const chosen = (custom[p.id] || "").trim() || qty[p.id] || p.defaultQty;
  const live = estimateLine(p, chosen);
  return (
    <article className={`card ${p.available ? "" : "sold"}`}>
      <div className="thumb">
        <img
          src={p.image}
          alt={p.name}
          onError={(e) => {
            e.currentTarget.src = LOGO;
          }}
        />
        <div className="badges">{p.bestseller && <span className="gold">BESTSELLER</span>}</div>
        <em className={p.available ? "ok" : "no"}>{p.available ? "Available" : "Sold Out"}</em>
      </div>
      <h3>{p.name}</h3>
      <p className="price">
        {formatInr(p.price)}
        <small>per {p.unit}</small>
      </p>
      <p className="live">
        {chosen} → {formatInr(live)}
      </p>
      <p className="desc">{p.desc}</p>
      <div className="qty">
        {p.qty.map((q) => (
          <button key={q} className={qty[p.id] === q && !custom[p.id] ? "on" : ""} onClick={() => onQty(p.id, q)}>
            {q}
          </button>
        ))}
      </div>
      <label>
        Custom quantity (g / kg) for {p.name}
        <input value={custom[p.id] || ""} placeholder={p.defaultQty} onChange={(e) => onCustom(p.id, e.target.value)} />
      </label>
      <button className="btn primary add" disabled={!p.available} onClick={() => onAdd(p)}>
        Add
      </button>
    </article>
  );
}

/* ============================================================
   PRODUCT STRIP — 4 items + See more
   Used on: home (js/pages/home.js) and mithai (js/pages/mithai.js)
   ============================================================ */
function ProductStrip({ title, items, cardProps, open, onSeeMore, moreHref }) {
  const shown = open || items.length <= PREVIEW ? items : items.slice(0, PREVIEW);
  return (
    <section className="wrap">
      <div className="section-head">
        <div>
          <p className="kicker">MITHAI</p>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="grid">
        {shown.map((p) => (
          <ProductCard key={p.id} p={p} {...cardProps} />
        ))}
      </div>
      {items.length > PREVIEW && !open && (
        <div className="see-more-row">
          {moreHref ? (
            <a className="btn primary" href={moreHref}>
              See more
            </a>
          ) : (
            <button className="btn primary" onClick={onSeeMore}>
              See more
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   APP SHELL — wraps every page: header + main + footer + cart
   ============================================================ */
function AppShell({ pageId, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState(loadCart);
  const [qty, setQty] = useState(() => Object.fromEntries(SMW.products.map((p) => [p.id, p.defaultQty])));
  const [custom, setCustom] = useState({});
  const [toast, setToast] = useState("");

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function addItem(product) {
    if (!product.available) return;
    const chosen = custom[product.id]?.trim() || qty[product.id];
    setCart((prev) => {
      const i = prev.findIndex((x) => x.id === product.id && x.qty === chosen);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], count: next[i].count + 1 };
        return next;
      }
      return [...prev, { id: product.id, qty: chosen, count: 1 }];
    });
    setToast(`${product.name} added (${chosen})`);
  }

  function whatsappEmpty() {
    const cartItems = cart
      .map((c) => {
        const p = SMW.products.find((x) => x.id === c.id);
        if (!p) return null;
        const line = estimateLine(p, c.qty) * c.count;
        return { ...c, product: p, line };
      })
      .filter(Boolean);
    const total = cartItems.reduce((s, x) => s + x.line, 0);
    if (!cartItems.length) {
      window.open(waLink("Namaste! I want to place an order at Sujal Mithai Wala."), "_blank");
      return;
    }
    const lines = cartItems.map((x) => `• ${x.product.name} — ${x.qty} × ${x.count} (${formatInr(x.line)})`);
    const msg = `Namaste Sujal Mithai Wala 🙏\n\nMy order:\n${lines.join("\n")}\n\nEstimated total: ${formatInr(total)}\n\nPlease confirm availability.`;
    window.open(waLink(msg), "_blank");
  }

  const cardProps = {
    qty,
    custom,
    onQty: (id, v) => setQty((s) => ({ ...s, [id]: v })),
    onCustom: (id, v) => setCustom((s) => ({ ...s, [id]: v })),
    onAdd: addItem,
  };

  const cartCount = cart.reduce((s, x) => s + x.count, 0);

  return (
    <div className="page">
      <Header
        pageId={pageId}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
      />
      <main>{typeof children === "function" ? children(cardProps) : children}</main>
      <Footer />
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      <button className="wa-float" onClick={whatsappEmpty} aria-label={`WhatsApp ${SMW.PHONE}`}>
        <WhatsAppIcon size={30} />
      </button>
      <CartDrawer open={cartOpen} cart={cart} setCart={setCart} onClose={() => setCartOpen(false)} />
    </div>
  );
}

function mountPage(element) {
  ReactDOM.createRoot(document.getElementById("root")).render(element);
}
