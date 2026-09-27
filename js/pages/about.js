/* ============================================================
   ABOUT US PAGE — js/pages/about.js
   HTML file: about.html
   CSS: .purity .purity-inner .pills .about .timeline
   ============================================================ */

function AboutPage() {
  return (
    <AppShell pageId="about">
      <>
        <section className="purity">
          <div className="wrap purity-inner">
            <span className="logo-circle">
              <img src={LOGO} alt="Sujal Mithai Wala logo" />
            </span>
            <div>
              <p className="kicker">OUR PROMISE</p>
              <h2>शुद्धता से कोई समझौता नहीं</h2>
              <p>Made fresh every morning. Pure desi ghee • No artificial colours • Hygienic kitchen.</p>
              <div className="pills">
                {["Pure desi ghee", "No artificial colours", "Hygienic kitchen", "Fresh daily batches"].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="about">
          <div className="wrap">
            <p className="kicker">ABOUT US</p>
            <h2>More Than Mithai, It’s Our Tradition.</h2>
            <p className="sub">
              Every batch begins before sunrise. Kaju is ground fine, and each tray is finished by hand — the same way
              it was on our very first day.
            </p>
            <ol className="timeline">
              <li>
                <b>1998</b>
                <h3>Our Beginning</h3>
                <p>A single kadhai, one family recipe book and a small counter on Main Bazaar Road.</p>
              </li>
              <li>
                <b>2006</b>
                <h3>Growing With Love</h3>
                <p>Regulars started ordering full trays for weddings — so we grew the kitchen, never the shortcuts.</p>
              </li>
              <li>
                <b>2015</b>
                <h3>Serving Generations</h3>
                <p>Children who came for a single ladoo now bring their own children for festival boxes.</p>
              </li>
              <li>
                <b>Today</b>
                <h3>Same Hands, Same Taste</h3>
                <p>Pure ghee, fresh khoya and daily batches — now just one WhatsApp tap away.</p>
              </li>
            </ol>
          </div>
        </section>
      </>
    </AppShell>
  );
}

mountPage(<AboutPage />);
