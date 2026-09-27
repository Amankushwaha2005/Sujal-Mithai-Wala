/* ============================================================
   CATEGORY PAGES — js/pages/category.js
   HTML files:
     dry-fruit.html      (Dry Fruit Sweets)
     kaju-specials.html  (Kaju Specials)
     medium-range.html   (Medium Range)
     special-laddoo.html (Special Laddoo)
     bengali.html        (Bengali Sweets)
   Reads data-category from the HTML <body>
   CSS: same product grid as mithai (.grid .card)
   ============================================================ */

function CategoryPage() {
  const cat = document.body.getAttribute("data-category");
  const items = SMW.products.filter((p) => p.category === cat);

  return (
    <AppShell pageId="mithai">
      {(cardProps) => (
        <section className="wrap">
          <p className="kicker">MITHAI</p>
          <h2>{cat}</h2>
          <p className="sub">Full list for this category. Add items, then send on WhatsApp.</p>
          <div className="grid">
            {items.map((p) => (
              <ProductCard key={p.id} p={p} {...cardProps} />
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

mountPage(<CategoryPage />);
