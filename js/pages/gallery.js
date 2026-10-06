/* ============================================================
   GALLERY PAGE — js/pages/gallery.js
   HTML file: gallery.html
   CSS: .gallery .chips .gallery figure
   ============================================================ */

function GalleryPage() {
  const [galleryTag, setGalleryTag] = useState("All");
  const [openGallery, setOpenGallery] = useState(false);
  const filters = ["All"].concat(
    SMW.galleryFilters.filter((g) => g !== "All"),
    SMW.gallery.map((g) => g.tag).filter((t, i, a) => t && SMW.galleryFilters.indexOf(t) < 0 && a.indexOf(t) === i)
  );
  const gals = SMW.gallery.filter((g) => galleryTag === "All" || g.tag === galleryTag);

  return (
    <AppShell pageId="gallery">
      <section className="wrap">
        <p className="kicker">GALLERY</p>
        <h2>A Look Inside Our Shop</h2>
        <p className="sub">Our counters, our kitchen and the mithai that leaves every day.</p>
        <div className="chips">
          {filters.map((g) => (
            <button
              key={g}
              className={galleryTag === g ? "on" : ""}
              onClick={() => {
                setGalleryTag(g);
                setOpenGallery(false);
              }}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="gallery">
          {(openGallery ? gals : gals.slice(0, PREVIEW)).map((g) => (
            <figure key={g.id || g.src}>
              <img
                src={g.src}
                alt={g.label}
                onError={(e) => {
                  e.currentTarget.src = LOGO;
                }}
              />
              <figcaption>{g.label}</figcaption>
            </figure>
          ))}
        </div>
        {gals.length > PREVIEW && !openGallery && (
          <div className="see-more-row">
            <button className="btn primary" onClick={() => setOpenGallery(true)}>
              See more
            </button>
          </div>
        )}
      </section>
    </AppShell>
  );
}

mountPage(<GalleryPage />);
