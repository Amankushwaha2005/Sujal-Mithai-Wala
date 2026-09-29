/* ============================================================
   CONTACT PAGE — js/pages/contact.js
   HTML file: contact.html
   CSS: .faq .contact .contact-card
   ============================================================ */

function ContactPage() {
  return (
    <AppShell pageId="contact">
      <>
        <section className="wrap faq">
          <p className="kicker">FAQ</p>
          <h2>Quick Answers</h2>
          {[
            [
              "How do I order mithai?",
              "Add items to the list, open Selected Items, then send the WhatsApp order. We confirm stock and pickup time.",
            ],
            [
              "Can I order in grams?",
              "Yes — pick 250 g, 500 g, 1 kg or type a custom quantity. The price updates instantly.",
            ],
            [
              "Are prices final?",
              "Listed prices are ₹1,200/kg for dry fruit & kaju specials, ₹500/kg for medium range. We confirm before packing.",
            ],
            ["Do you take bulk / wedding orders?", "Yes — message the list on WhatsApp. Large trays need a little extra time."],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
        <section className="wrap contact">
          <p className="kicker">CONTACT</p>
          <h2>Talk To Us Directly</h2>
          <p className="sub">Bulk orders, wedding trays or a simple availability check — a message is always faster.</p>
          <div className="contact-card">
            <h3>Sujal Mithai Wala</h3>
            <p>
              <b>Phone / WhatsApp</b>
              {SMW.PHONE}
            </p>
            <p>
              <b>Email</b>
              <MailLink />
            </p>
            <p>
              <b>Address</b>
              {SMW.ADDRESS}
            </p>
            <div className="hero-cta">
              <a className="btn primary" href={`tel:+${SMW.WHATSAPP}`}>
                Call {SMW.PHONE}
              </a>
              <a className="btn ghost wa-btn" href={waLink()} target="_blank" rel="noreferrer">
                <WhatsAppIcon size={18} /> WhatsApp {SMW.PHONE}
              </a>
              <MailLink className="btn ghost">Email {SMW.EMAIL}</MailLink>
              <a className="btn ghost" href={SMW.MAPS} target="_blank" rel="noreferrer">
                Get Directions
              </a>
            </div>
          </div>
        </section>
      </>
    </AppShell>
  );
}

mountPage(<ContactPage />);
