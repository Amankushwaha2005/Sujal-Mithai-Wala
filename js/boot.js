/* ============================================================
   BOOT — js/boot.js
   Used by: every HTML page
   Loads js/shared.js then this page’s JS file, converts JSX with Babel
   Body attribute: data-script="js/pages/home.js"
   ============================================================ */

(function () {
  const pageFile = document.body.getAttribute("data-script");
  const root = document.getElementById("root");

  function runJsx(code, filename) {
    const out = Babel.transform(code, {
      presets: [["react", { runtime: "classic" }]],
      filename: filename,
    }).code;
    (0, eval)(out);
  }

  async function start() {
    try {
      const res = await fetch("/api/catalog");
      if (res.ok) {
        const cat = await res.json();
        if (cat.products && cat.products.length) {
          SMW.products = cat.products;
          const names = [];
          cat.products.forEach(function (p) {
            if (p.category && names.indexOf(p.category) < 0) names.push(p.category);
          });
          SMW.categories = ["All"].concat(names);
        }
        SMW.offers = cat.offers || [];
        SMW.ads = cat.ads || [];
        if (cat.gallery && cat.gallery.length) {
          SMW.gallery = cat.gallery.map(function (g) {
            return { id: g.id, src: g.image, tag: g.tag || "Medium Range", label: g.label || "Photo" };
          });
        }
      }
    } catch (e) {
      SMW.offers = SMW.offers || [];
      SMW.ads = SMW.ads || [];
    }
    SMW.user = null;
    try {
      const me = await fetch("/api/me", { credentials: "same-origin" });
      if (me.ok) {
        const u = await me.json();
        if (u && u.ok) SMW.user = u;
      }
    } catch (e2) {}
    const files = ["js/shared.js", pageFile];
    for (let i = 0; i < files.length; i++) {
      const src = files[i];
      const res = await fetch(src);
      if (!res.ok) throw new Error("Could not load " + src);
      const code = await res.text();
      runJsx(code, src);
    }
  }

  start().catch(function (err) {
    console.error(err);
    if (root) root.innerHTML = "<p style='padding:24px;color:#f4e7d6'>Page load error: " + err.message + "</p>";
  });
})();
