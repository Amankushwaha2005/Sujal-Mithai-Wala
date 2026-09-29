/* ============================================================
   ADMIN PANEL JS — admin.html
   Talks to Java backend: /api/products /api/offers /api/ads
   ============================================================ */

const loginBox = document.getElementById("loginBox");
const dash = document.getElementById("dash");

async function api(url, opts) {
  const res = await fetch(url, { credentials: "same-origin", ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function showDash(on) {
  loginBox.hidden = on;
  dash.hidden = !on;
}

async function checkSession() {
  try {
    const s = await api("/api/session");
    showDash(!!s.ok);
    if (s.ok) await loadAll();
  } catch (e) {
    showDash(false);
  }
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("loginMsg");
  msg.textContent = "";
  try {
    const fd = new FormData(e.target);
    const u = await api("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
    });
    if (!u.admin) {
      await api("/api/logout", { method: "POST" });
      throw new Error("Yeh email admin nahi hai. Website pe customer login use kijiye.");
    }
    e.target.reset();
    showDash(true);
    await loadAll();
  } catch (err) {
    msg.textContent = err.message;
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await api("/api/logout", { method: "POST" });
  showDash(false);
});

document.getElementById("addProduct").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("prodMsg");
  msg.textContent = "Saving…";
  try {
    const form = e.target;
    const fd = new FormData();
    fd.append("name", form.name.value);
    fd.append("category", form.category.value);
    fd.append("price", form.price.value);
    fd.append("unit", form.unit.value);
    fd.append("desc", form.desc.value);
    if (form.photo.files[0]) fd.append("photo", form.photo.files[0]);
    await api("/api/products", { method: "POST", body: fd });
    form.reset();
    msg.textContent = "Mithai website par add ho gayi.";
    await loadAll();
  } catch (err) {
    msg.textContent = err.message;
  }
});

document.getElementById("addOffer").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("offerMsg");
  try {
    const fd = new FormData(e.target);
    const discount = fd.get("discountPercent");
    await api("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        message: fd.get("message"),
        discountPercent: discount ? Number(discount) : 0,
        active: true,
      }),
    });
    e.target.reset();
    msg.textContent = "Offer website par chal raha hai.";
    await loadAll();
  } catch (err) {
    msg.textContent = err.message;
  }
});

document.getElementById("addAd").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("adMsg");
  try {
    const form = e.target;
    const fd = new FormData();
    fd.append("title", form.title.value);
    fd.append("link", form.link.value || "mithai.html");
    fd.append("photo", form.photo.files[0]);
    await api("/api/ads", { method: "POST", body: fd });
    form.reset();
    msg.textContent = "Ad home page par chal raha hai.";
    await loadAll();
  } catch (err) {
    msg.textContent = err.message;
  }
});

async function loadAll() {
  const cat = await api("/api/catalog");
  renderProducts(cat.products || []);
  renderOffers(cat.offers || []);
  renderAds(cat.ads || []);
  const users = await api("/api/users");
  renderUsers(users);
}

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}

function formatJoined(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function renderUsers(data) {
  document.getElementById("statTotal").textContent = data.total || 0;
  document.getElementById("statCustomers").textContent = data.customers || 0;
  document.getElementById("statAdmins").textContent = data.admins || 0;
  const box = document.getElementById("userList");
  const list = data.users || [];
  if (!list.length) {
    box.innerHTML = "<p class=\"sub\">Abhi koi user nahi hai.</p>";
    return;
  }
  box.innerHTML = list
    .map((u) => {
      const joined = formatJoined(u.createdAt);
      return `
    <article class="admin-user-card" data-id="${escapeHtml(u.id)}">
      <header class="admin-user-head">
        <span class="admin-user-avatar" aria-hidden="true">${escapeHtml(initials(u.name))}</span>
        <div class="admin-user-meta">
          <strong>${escapeHtml(u.name)}</strong>
          <span>${escapeHtml(u.email)}${joined ? " · joined " + escapeHtml(joined) : ""}</span>
        </div>
        <em class="admin-user-badge ${u.role === "admin" ? "is-admin" : "is-customer"}">${escapeHtml(u.role)}</em>
      </header>
      <div class="admin-user-fields">
        <label>Name <input class="u-name" value="${escapeHtml(u.name)}" /></label>
        <label>Email <input class="u-email" type="email" value="${escapeHtml(u.email)}" /></label>
        <label>Role
          <select class="u-role">
            <option value="customer" ${u.role === "customer" ? "selected" : ""}>Customer</option>
            <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
          </select>
        </label>
        <label>New password <input class="u-pass" type="password" placeholder="Leave blank to keep" autocomplete="new-password" /></label>
      </div>
      <div class="admin-user-actions">
        <button class="btn primary save-user" type="button">Save changes</button>
        <button class="btn ghost del-user" type="button">Delete user</button>
      </div>
    </article>`;
    })
    .join("");

  box.querySelectorAll(".save-user").forEach((btn) => {
    btn.onclick = async () => {
      const row = btn.closest(".admin-user-card");
      const msg = document.getElementById("userMsg");
      msg.textContent = "";
      try {
        await api("/api/users/" + encodeURIComponent(row.dataset.id), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.querySelector(".u-name").value,
            email: row.querySelector(".u-email").value,
            role: row.querySelector(".u-role").value,
            password: row.querySelector(".u-pass").value,
          }),
        });
        msg.textContent = "User update ho gaya.";
        await loadAll();
      } catch (err) {
        msg.textContent = err.message;
      }
    };
  });
  box.querySelectorAll(".del-user").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Is user ko delete karein?")) return;
      const msg = document.getElementById("userMsg");
      try {
        await api("/api/users/" + encodeURIComponent(btn.closest(".admin-user-card").dataset.id), {
          method: "DELETE",
        });
        await loadAll();
      } catch (err) {
        msg.textContent = err.message;
      }
    };
  });
}

const PRODUCT_PAGE = 8;
let productCache = [];
let productShow = PRODUCT_PAGE;

function renderProducts(list) {
  productCache = list || [];
  if (productShow > productCache.length) productShow = Math.max(PRODUCT_PAGE, productCache.length);
  drawProducts();
}

function drawProducts() {
  const box = document.getElementById("productList");
  const list = productCache;
  const shown = list.slice(0, productShow);
  box.innerHTML = shown
    .map(
      (p) => `
    <article class="admin-item" data-id="${p.id}">
      <img src="${p.image}" alt="" />
      <div>
        <strong>${escapeHtml(p.name)}</strong>
        <span>${escapeHtml(p.category)} · ₹${p.price} / ${escapeHtml(p.unit)}</span>
      </div>
      <div class="acts">
        <input type="number" min="1" value="${p.price}" aria-label="Rate for ${escapeHtml(p.name)}" />
        <button class="btn ghost save-rate" type="button">Save rate</button>
        <button class="btn ghost del-prod" type="button">Delete</button>
      </div>
    </article>`
    )
    .join("");

  if (list.length > PRODUCT_PAGE) {
    const left = list.length - shown.length;
    const actions = document.createElement("div");
    actions.className = "see-more-row";
    if (left > 0) {
      const more = document.createElement("button");
      more.className = "btn ghost";
      more.type = "button";
      more.textContent = `See more (${left} more)`;
      more.onclick = () => {
        productShow = Math.min(productShow + PRODUCT_PAGE, list.length);
        drawProducts();
      };
      actions.appendChild(more);
    }
    if (productShow > PRODUCT_PAGE) {
      const less = document.createElement("button");
      less.className = "btn ghost";
      less.type = "button";
      less.textContent = "See less";
      less.onclick = () => {
        productShow = PRODUCT_PAGE;
        drawProducts();
      };
      actions.appendChild(less);
    }
    box.appendChild(actions);
  }

  box.querySelectorAll(".save-rate").forEach((btn) => {
    btn.onclick = async () => {
      const row = btn.closest(".admin-item");
      const price = Number(row.querySelector("input").value);
      await api("/api/products/" + encodeURIComponent(row.dataset.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price }),
      });
      await loadAll();
    };
  });
  box.querySelectorAll(".del-prod").forEach((btn) => {
    btn.onclick = async () => {
      const row = btn.closest(".admin-item");
      if (!confirm("Is mithai ko website se hataayein?")) return;
      await api("/api/products/" + encodeURIComponent(row.dataset.id), { method: "DELETE" });
      await loadAll();
    };
  });
}

function renderOffers(list) {
  const box = document.getElementById("offerList");
  box.innerHTML = list
    .map(
      (o) => `
    <article class="admin-item">
      <img src="public/logo.jpg" alt="" />
      <div>
        <strong>${escapeHtml(o.title)}</strong>
        <span>${escapeHtml(o.message)} ${o.discountPercent ? "· " + o.discountPercent + "% off" : ""} · ${o.active ? "ON" : "OFF"}</span>
      </div>
      <div class="acts">
        <button class="btn ghost" type="button" data-toggle="${o.id}">${o.active ? "Stop" : "Start"}</button>
        <button class="btn ghost" type="button" data-del="${o.id}">Delete</button>
      </div>
    </article>`
    )
    .join("");
  box.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-toggle");
      const item = list.find((x) => x.id === id);
      await api("/api/offers/" + encodeURIComponent(id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !item.active }),
      });
      await loadAll();
    };
  });
  box.querySelectorAll("[data-del]").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Offer hataayein?")) return;
      await api("/api/offers/" + encodeURIComponent(btn.getAttribute("data-del")), { method: "DELETE" });
      await loadAll();
    };
  });
}

function renderAds(list) {
  const box = document.getElementById("adList");
  box.innerHTML = list
    .map(
      (a) => `
    <article class="admin-item">
      <img src="${a.image}" alt="" />
      <div>
        <strong>${escapeHtml(a.title)}</strong>
        <span>${escapeHtml(a.link || "")} · ${a.active ? "ON" : "OFF"}</span>
      </div>
      <div class="acts">
        <button class="btn ghost" type="button" data-toggle="${a.id}">${a.active ? "Stop" : "Start"}</button>
        <button class="btn ghost" type="button" data-del="${a.id}">Delete</button>
      </div>
    </article>`
    )
    .join("");
  box.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-toggle");
      const item = list.find((x) => x.id === id);
      await api("/api/ads/" + encodeURIComponent(id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !item.active }),
      });
      await loadAll();
    };
  });
  box.querySelectorAll("[data-del]").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Ad hataayein?")) return;
      await api("/api/ads/" + encodeURIComponent(btn.getAttribute("data-del")), { method: "DELETE" });
      await loadAll();
    };
  });
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

checkSession();
