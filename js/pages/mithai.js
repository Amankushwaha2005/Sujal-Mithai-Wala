/* ============================================================
   OUR MITHAI PAGE — js/pages/mithai.js
   HTML file: mithai.html
   CSS: .toolbar .chips .grid .empty
   ============================================================ */

function MithaiPage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [openCats, setOpenCats] = useState({});
  const cats = SMW.categories.filter((c) => c !== "All");

  const q = query.trim().toLowerCase();
  const filtered = SMW.products.filter((p) => {
    const matchCat = cat === "All" || p.category === cat;
    const matchQ =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.desc.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <AppShell pageId="mithai">
      {(cardProps) => (
        <section className="wrap">
          <p className="kicker">OUR MITHAI</p>
          <h2>Freshly Made, Every Single Day</h2>
          <p className="sub">
            Pick your sweets, choose the quantity and send the whole list to us on WhatsApp — no account, no checkout.
          </p>
          <div className="toolbar">
            <input
              type="search"
              placeholder="Search kaju katli, peda, milkcake…"
              aria-label="Search mithai"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="chips" role="tablist">
            {SMW.categories.map((c) => (
              <button key={c} className={cat === c ? "on" : ""} aria-pressed={cat === c} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
          {!query.trim() && cat === "All" ? (
            cats.map((c) => (
              <ProductStrip
                key={c}
                title={c}
                items={SMW.products.filter((p) => p.category === c)}
                cardProps={cardProps}
                open={!!openCats[c]}
                onSeeMore={() => setOpenCats((s) => ({ ...s, [c]: true }))}
                moreHref={CAT_PAGES[c] || "mithai.html"}
              />
            ))
          ) : (
            <>
              <div className="grid">
                {(openCats[cat] || filtered.length <= PREVIEW ? filtered : filtered.slice(0, PREVIEW)).map((p) => (
                  <ProductCard key={p.id} p={p} {...cardProps} />
                ))}
              </div>
              {filtered.length > PREVIEW && !openCats[cat] && (
                <div className="see-more-row">
                  <button className="btn primary" onClick={() => setOpenCats((s) => ({ ...s, [cat]: true }))}>
                    See more
                  </button>
                </div>
              )}
            </>
          )}
          {!filtered.length && <p className="empty">No items match your search. Try katli, peda or milkcake.</p>}
        </section>
      )}
    </AppShell>
  );
}

mountPage(<MithaiPage />);
