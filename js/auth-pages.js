/* ============================================================
   LOGIN / SIGNUP / FORGOT — login.html, signup.html, forgot.html
   ============================================================ */

document.getElementById("authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("authMsg");
  msg.textContent = "";
  const fd = new FormData(e.target);
  const mode = e.target.getAttribute("data-mode");
  try {
    if (mode === "forgot") {
      const res = await fetch("/api/forgot", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          password: fd.get("password"),
          confirm: fd.get("confirm"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      msg.textContent = "Password updated. You can log in now.";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 800);
      return;
    }
    const body = {
      email: fd.get("email"),
      password: fd.get("password"),
    };
    if (mode === "signup") body.name = fd.get("name");
    const res = await fetch(mode === "signup" ? "/api/signup" : "/api/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed");
    if (data.admin) window.location.href = "admin.html";
    else window.location.href = "index.html";
  } catch (err) {
    msg.textContent = err.message;
  }
});
