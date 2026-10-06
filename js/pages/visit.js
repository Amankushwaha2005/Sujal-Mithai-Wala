/* ============================================================
   VISIT STORE PAGE — js/pages/visit.js
   HTML file: visit.html
   CSS: .visit .visit-grid .info .map-card
   ============================================================ */

function VisitPage() {
  return (
    <AppShell pageId="visit">
      <section className="visit">
        <div className="wrap visit-grid">
          <div>
            <p className="kicker">VISIT OUR STORE</p>
            <h2>Come Say Namaste In Person</h2>
            <p className="sub">Walk in for a warm peda, or send your list ahead on WhatsApp and pick it up ready.</p>
            <ShopStatus />
            <h3>Sujal Mithai Wala</h3>
            <ul className="info">
              <li>
                <b>Address</b>
                {SMW.ADDRESS}
              </li>
              <li>
                <b>Phone / WhatsApp</b>
                {SMW.PHONE}
              </li>
              <li>
                <b>Email</b>
                <MailLink />
              </li>
              <li>
                <b>Opening Hours</b>
                Monday – Sunday: 8:00 AM – 11:00 PM
                <br />
                Festival Days: Open till late
              </li>
            </ul>
            <div className="hero-cta">
              <a className="btn primary" href={SMW.MAPS} target="_blank" rel="noreferrer">
                Directions
              </a>
              <a className="btn ghost" href={`tel:+${SMW.WHATSAPP}`}>
                Call {SMW.PHONE}
              </a>
              <a className="btn ghost wa-btn" href={waLink()} target="_blank" rel="noreferrer">
                <WhatsAppIcon size={18} /> WhatsApp {SMW.PHONE}
              </a>
              <MailLink className="btn ghost">Email</MailLink>
            </div>
          </div>
          <div className="map-card">
            <iframe
              title="Sujal Mithai Wala — Infront of Kanji House, Tehsil Road, Churkhibal, Jalaun"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={SMW.MAP_EMBED}
            />
          </div>
        </div>
      </section>
    </AppShell>
  );
}

mountPage(<VisitPage />);
