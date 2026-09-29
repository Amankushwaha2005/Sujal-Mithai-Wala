/* ============================================================
   HOME PAGE — js/pages/home.js
   HTML file: index.html
   CSS: .hero .hero-photo .rate-row .strip .stats
   Sections: hero slider, rates, name strip, 5 mithai categories
   ============================================================ */

function HomePage() {
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [query, setQuery] = useState("");
  const slides = (() => {
    const seen = {};
    const out = [];
    const ranked = SMW.products.slice().sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));
    ranked.forEach((p) => {
      if (!p.image || seen[p.image] || out.length >= 8) return;
      seen[p.image] = true;
      out.push({ src: p.image, name: p.name, id: p.id });
    });
    return out;
  })();
  const cats = SMW.categories.filter((c) => c !== "All");
  const q = query.trim().toLowerCase();
  const hits = !q
    ? []
    : SMW.products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.desc || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q)
      );

  useEffect(() => {
    if (!slides.length || paused) return;
    const t = setInterval(() => setSlide((i) => (i + 1) % slides.length), 3000);
    return () => clearInterval(t);
  }, [slides.length, paused]);

  const hero = slides[slide] || slides[0];

  return (
    <AppShell pageId="home">
      {(cardProps) => (
        <>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">
                {greetingForNow()} · TRADITIONAL TASTE · FRESHLY MADE
              </p>
              <ShopStatus />
              <h1>
                SUJAL
                <em>MITHAI</em>
                WALA
              </h1>
              <p className="tagline">Har Mithaas Mein Apnapan ❤️</p>
              <p className="hindi">शुद्धता से कोई समझौता नहीं</p>
              <p className="lead">
                Traditional mithaas, ab aapke ek tap door. Dry fruit at ₹1,200/kg, medium range at ₹500/kg.
              </p>
              <label className="live-search">
                Search mithai
                <input
                  type="search"
                  value={query}
                  placeholder="Type kaju, peda, rasmalai…"
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <div className="hero-cta">
                <a className="btn primary" href="mithai.html">
                  Explore Mithai 🍬
                </a>
                <a className="btn ghost" href="visit.html">
                  Visit Our Store
                </a>
              </div>
              <div className="stats">
                <div>
                  <CountUp value={25} suffix="+" />
                  <span>Years of trust</span>
                </div>
                <div>
                  <CountUp value={SMW.products.length} suffix="+" />
                  <span>Mithai varieties</span>
                </div>
                <div>
                  <CountUp value={500} prefix="₹" />
                  <span>Medium range / kg</span>
                </div>
                <div>
                  <CountUp value={1200} prefix="₹" />
                  <span>Dry fruit / kg</span>
                </div>
              </div>
            </div>
            <div className="hero-photo" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
              <div className="hero-stage">
                {slides.map((s, i) => (
                  <figure key={s.id} className={i === slide ? "on" : ""}>
                    <img
                      src={s.src}
                      alt={s.name}
                      onError={(e) => {
                        e.currentTarget.src = LOGO;
                      }}
                    />
                  </figure>
                ))}
              </div>
              <button
                className="hero-nav prev"
                type="button"
                aria-label="Previous photo"
                onClick={() => setSlide((i) => (i - 1 + slides.length) % slides.length)}
              >
                ‹
              </button>
              <button
                className="hero-nav next"
                type="button"
                aria-label="Next photo"
                onClick={() => setSlide((i) => (i + 1) % slides.length)}
              >
                ›
              </button>
              <p className="hero-caption">{hero ? hero.name : ""}</p>
              <div className="hero-dots">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    className={i === slide ? "on" : ""}
                    aria-label={s.name}
                    onClick={() => setSlide(i)}
                  />
                ))}
              </div>
            </div>
          </section>

          {q ? (
            <section className="wrap">
              <p className="kicker">LIVE SEARCH</p>
              <h2>
                {hits.length} result{hits.length === 1 ? "" : "s"} for “{query.trim()}”
              </h2>
              <div className="grid">
                {hits.map((p) => (
                  <ProductCard key={p.id} p={p} {...cardProps} />
                ))}
              </div>
              {!hits.length && <p className="empty">No mithai matched. Try katli, peda or laddoo.</p>}
            </section>
          ) : (
            <>
              {(SMW.ads || []).filter((a) => a.active && a.image).length > 0 && (
                <section className="ad-rail">
                  {(SMW.ads || [])
                    .filter((a) => a.active && a.image)
                    .map((a) => (
                      <a key={a.id} className="ad-card" href={a.link || "mithai.html"}>
                        <img src={a.image} alt={a.title} />
                        <span>{a.title}</span>
                      </a>
                    ))}
                </section>
              )}
              <div className="rate-row">
                <article>
                  <span>Dry fruit sweets · Kaju specials</span>
                  <b>₹1,200 / kg</b>
                  <p>250 g = ₹300 · 500 g = ₹600 · 1 kg = ₹1,200</p>
                </article>
                <article>
                  <span>Medium range mithai</span>
                  <b>₹500 / kg</b>
                  <p>250 g = ₹125 · 500 g = ₹250 · 1 kg = ₹500</p>
                </article>
              </div>
              <section className="strip">
                {["Kaju Katli", "Motichoor Laddoo", "Rasmalai", "Cham-cham", "Peda", "Gulab Jamun"].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </section>
              {cats.map((c) => (
                <ProductStrip
                  key={c}
                  title={c}
                  items={SMW.products.filter((p) => p.category === c)}
                  cardProps={cardProps}
                  moreHref={CAT_PAGES[c] || "mithai.html"}
                />
              ))}
            </>
          )}
        </>
      )}
    </AppShell>
  );
}

mountPage(<HomePage />);
