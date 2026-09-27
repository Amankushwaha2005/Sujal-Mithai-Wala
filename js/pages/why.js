/* ============================================================
   WHY CHOOSE US PAGE — js/pages/why.js
   HTML file: why.html
   CSS: .reasons .quotes .stories
   ============================================================ */

function WhyPage() {
  return (
    <AppShell pageId="why">
      <>
        <section className="wrap">
          <p className="kicker">WHY CHOOSE US</p>
          <h2>Seven Reasons Families Keep Coming Back</h2>
          <div className="reasons">
            {[
              ["Freshly Prepared", "Small batches made through the day — never a day-old tray."],
              ["Quality Ingredients", "Pure desi ghee, slow-cooked khoya and graded dry fruits only."],
              ["Made With Love", "Family recipes, finished by hand, tasted before they reach you."],
              ["Hygienic Preparation", "Clean kitchen, covered trays, gloved handling at the counter."],
              ["Traditional Recipes", "Slow-cooked khoya and classic methods we refuse to shortcut."],
              ["Premium Packaging", "Festive boxes that look as good as the mithai inside."],
              ["WhatsApp Ordering", "Build a list, send it, pick up ready. No app, no account."],
            ].map(([t, d]) => (
              <article key={t}>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="wrap stories">
          <p className="kicker">LOVE FROM REGULARS</p>
          <h2>What Neighbourhood Families Say</h2>
          <div className="quotes">
            {[
              ["The peda tastes like my nani’s kitchen — fresh every morning.", "Anjali S.", "Peda regular"],
              ["Ordered kaju katli for Diwali — packed beautifully, every piece fresh.", "Rohit M.", "Dry fruit sweets"],
              ["Pinni and gujia from here go straight into our festive thali.", "Neha K.", "Medium range"],
            ].map(([q, n, t]) => (
              <blockquote key={n}>
                <p>“{q}”</p>
                <cite>
                  {n}
                  <span>{t}</span>
                </cite>
              </blockquote>
            ))}
          </div>
        </section>
      </>
    </AppShell>
  );
}

mountPage(<WhyPage />);
