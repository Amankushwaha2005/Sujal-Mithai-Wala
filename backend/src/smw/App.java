package smw;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.Executors;

/**
 * Java backend for Sujal Mithai Wala.
 * Serves the website + /api for admin (photos, rates, festival offers, ads).
 */
public class App {
  private static final int DEFAULT_PORT = 8080;
  private static final Gson GSON = new Gson();
  private final Path root;
  private final Store store;
  private final Database db;
  private final int port;
  private final String bind;

  public static void main(String[] args) throws Exception {
    Path given = Path.of(args.length > 0 ? args[0] : ".").toAbsolutePath().normalize();
    Path root = websiteRoot(given);
    if (!root.equals(given)) {
      System.out.println("Website root: " + root);
    }
    new App(root).start();
  }

  /** Find index.html even when the process is started from the backend folder. */
  static Path websiteRoot(Path start) {
    Path cur = start;
    for (int i = 0; i < 4 && cur != null; i++) {
      if (Files.isRegularFile(cur.resolve("index.html")) && Files.isDirectory(cur.resolve("public"))) {
        return cur;
      }
      cur = cur.getParent();
    }
    return start;
  }

  App(Path root) throws Exception {
    this.root = root;
    this.store = new Store(root);
    this.db = new Database(root);
    this.port = envInt("PORT", envInt("SMW_PORT", DEFAULT_PORT));
    String b = System.getenv("SMW_BIND");
    this.bind = (b == null || b.isBlank()) ? "0.0.0.0" : b.trim();
  }

  void start() throws IOException {
    HttpServer server = HttpServer.create(new InetSocketAddress(bind, port), 0);
    server.createContext("/api/", this::api);
    server.createContext("/", this::staticFile);
    server.setExecutor(Executors.newCachedThreadPool());
    server.start();
    System.out.println("Sujal Mithai Wala running:");
    System.out.println("  Bind    : " + bind + ":" + port);
    System.out.println("  Website : http://127.0.0.1:" + port + "/");
    System.out.println("  Admin   : http://127.0.0.1:" + port + "/admin.html");
    System.out.println("  Admin email: " + Database.ADMIN_EMAIL + "  password: " + Database.ADMIN_PASSWORD);
  }

  private static int envInt(String key, int fallback) {
    String v = System.getenv(key);
    if (v == null || v.isBlank()) return fallback;
    return Integer.parseInt(v.trim());
  }

  private void api(HttpExchange ex) throws IOException {
    try {
      String path = ex.getRequestURI().getPath();
      String method = ex.getRequestMethod();
      if ("OPTIONS".equals(method)) {
        send(ex, 204, "application/json", "");
        return;
      }
      if (path.equals("/api/catalog") && "GET".equals(method)) {
        sendJson(ex, 200, store.catalog());
        return;
      }
      if (path.equals("/api/signup") && "POST".equals(method)) {
        JsonObject body = readJson(ex);
        Database.User u =
            db.signup(
                body.has("name") ? body.get("name").getAsString() : "",
                body.has("email") ? body.get("email").getAsString() : "",
                body.has("password") ? body.get("password").getAsString() : "");
        setSessionCookie(ex, db.createSession(u.id()));
        sendJson(ex, 200, userJson(u));
        return;
      }
      if (path.equals("/api/login") && "POST".equals(method)) {
        JsonObject body = readJson(ex);
        if (!body.has("email") || body.get("email").getAsString().isBlank()) {
          error(ex, 400, "Please login with your email");
          return;
        }
        Database.User u =
            db.login(
                body.get("email").getAsString(),
                body.has("password") ? body.get("password").getAsString() : "");
        setSessionCookie(ex, db.createSession(u.id()));
        sendJson(ex, 200, userJson(u));
        return;
      }
      if (path.equals("/api/forgot") && "POST".equals(method)) {
        JsonObject body = readJson(ex);
        String pass = body.has("password") ? body.get("password").getAsString() : "";
        String confirm = body.has("confirm") ? body.get("confirm").getAsString() : "";
        if (!pass.equals(confirm)) {
          error(ex, 400, "Dono password same hone chahiye");
          return;
        }
        db.resetPassword(body.has("email") ? body.get("email").getAsString() : "", pass);
        JsonObject ok = new JsonObject();
        ok.addProperty("ok", true);
        sendJson(ex, 200, ok);
        return;
      }
      if (path.equals("/api/logout") && "POST".equals(method)) {
        db.deleteSession(cookie(ex, "smw"));
        JsonObject ok = new JsonObject();
        ok.addProperty("ok", true);
        sendJson(ex, 200, ok);
        return;
      }
      if (path.equals("/api/me") && "GET".equals(method)) {
        Database.User u = db.userForToken(cookie(ex, "smw"));
        if (u == null) {
          JsonObject o = new JsonObject();
          o.addProperty("ok", false);
          sendJson(ex, 200, o);
          return;
        }
        sendJson(ex, 200, userJson(u));
        return;
      }
      if (path.equals("/api/session") && "GET".equals(method)) {
        Database.User u = db.userForToken(cookie(ex, "smw"));
        JsonObject o = userJson(u);
        o.addProperty("ok", u != null && u.admin());
        sendJson(ex, 200, o);
        return;
      }
      if (!isAdmin(ex)) {
        error(ex, 401, "Admin login required");
        return;
      }
      if (path.equals("/api/users") && "GET".equals(method)) {
        sendJson(ex, 200, db.listUsers());
        return;
      }
      if (path.startsWith("/api/users/") && "PUT".equals(method)) {
        String id = path.substring("/api/users/".length());
        Database.User actor = db.userForToken(cookie(ex, "smw"));
        JsonObject body = readJson(ex);
        db.updateUser(
            id,
            body.has("name") ? body.get("name").getAsString() : "",
            body.has("email") ? body.get("email").getAsString() : "",
            body.has("role") ? body.get("role").getAsString() : "customer",
            body.has("password") ? body.get("password").getAsString() : "",
            actor == null ? "" : actor.id());
        sendJson(ex, 200, db.listUsers());
        return;
      }
      if (path.startsWith("/api/users/") && "DELETE".equals(method)) {
        String id = path.substring("/api/users/".length());
        Database.User actor = db.userForToken(cookie(ex, "smw"));
        db.deleteUser(id, actor == null ? "" : actor.id());
        sendJson(ex, 200, db.listUsers());
        return;
      }
      if (path.equals("/api/products") && "POST".equals(method)) {
        sendJson(ex, 200, createProduct(ex));
        return;
      }
      if (path.startsWith("/api/products/") && "PUT".equals(method)) {
        String id = path.substring("/api/products/".length());
        boolean ok = store.updateProduct(id, readJson(ex));
        if (ok) sendJson(ex, 200, store.catalog());
        else error(ex, 404, "Mithai not found");
        return;
      }
      if (path.startsWith("/api/products/") && "DELETE".equals(method)) {
        String id = path.substring("/api/products/".length());
        boolean ok = store.deleteProduct(id);
        if (ok) sendJson(ex, 200, store.catalog());
        else error(ex, 404, "Mithai not found");
        return;
      }
      if (path.equals("/api/offers") && "POST".equals(method)) {
        JsonObject o = readJson(ex);
        if (!o.has("id")) o.addProperty("id", Store.newId("offer"));
        if (!o.has("active")) o.addProperty("active", true);
        sendJson(ex, 200, store.addOffer(o));
        return;
      }
      if (path.startsWith("/api/offers/") && "PUT".equals(method)) {
        String id = path.substring("/api/offers/".length());
        if (store.updateOffer(id, readJson(ex))) sendJson(ex, 200, store.catalog());
        else error(ex, 404, "Offer not found");
        return;
      }
      if (path.startsWith("/api/offers/") && "DELETE".equals(method)) {
        String id = path.substring("/api/offers/".length());
        if (store.deleteOffer(id)) sendJson(ex, 200, store.catalog());
        else error(ex, 404, "Offer not found");
        return;
      }
      if (path.equals("/api/ads") && "POST".equals(method)) {
        sendJson(ex, 200, createAd(ex));
        return;
      }
      if (path.startsWith("/api/ads/") && "PUT".equals(method)) {
        String id = path.substring("/api/ads/".length());
        if (store.updateAd(id, readJson(ex))) sendJson(ex, 200, store.catalog());
        else error(ex, 404, "Ad not found");
        return;
      }
      if (path.startsWith("/api/ads/") && "DELETE".equals(method)) {
        String id = path.substring("/api/ads/".length());
        if (store.deleteAd(id)) sendJson(ex, 200, store.catalog());
        else error(ex, 404, "Ad not found");
        return;
      }
      error(ex, 404, "Unknown API");
    } catch (IllegalArgumentException e) {
      error(ex, 400, e.getMessage());
    } catch (Exception e) {
      e.printStackTrace();
      error(ex, 500, e.getMessage() == null ? "Server error" : e.getMessage());
    }
  }

  private JsonObject createProduct(HttpExchange ex) throws Exception {
    String ct = header(ex, "Content-Type");
    JsonObject p = new JsonObject();
    if (ct != null && ct.toLowerCase().startsWith("multipart/")) {
      Multipart mp = Multipart.parse(readBytes(ex), ct);
      p.addProperty("name", mp.fields.getOrDefault("name", "New mithai"));
      p.addProperty("price", parsePrice(mp.fields.getOrDefault("price", "0")));
      p.addProperty("unit", mp.fields.getOrDefault("unit", "kg"));
      p.addProperty("category", mp.fields.getOrDefault("category", "Medium Range"));
      p.addProperty("desc", mp.fields.getOrDefault("desc", ""));
      p.addProperty("available", true);
      if (mp.file != null && mp.file.length > 0) {
        p.addProperty("image", saveUpload(mp.fileName, mp.file));
      } else {
        p.addProperty("image", "public/logo.jpg");
      }
    } else {
      p = readJson(ex);
      if (!p.has("image")) p.addProperty("image", "public/logo.jpg");
    }
    String unit = p.has("unit") ? p.get("unit").getAsString() : "kg";
    applyQty(p, unit);
    if (!p.has("id")) p.addProperty("id", Store.slug(p.get("name").getAsString()));
    return store.addProduct(p);
  }

  private JsonObject createAd(HttpExchange ex) throws Exception {
    String ct = header(ex, "Content-Type");
    JsonObject a = new JsonObject();
    if (ct != null && ct.toLowerCase().startsWith("multipart/")) {
      Multipart mp = Multipart.parse(readBytes(ex), ct);
      a.addProperty("title", mp.fields.getOrDefault("title", "Ad"));
      a.addProperty("link", mp.fields.getOrDefault("link", "mithai.html"));
      a.addProperty("active", true);
      if (mp.file != null && mp.file.length > 0) {
        a.addProperty("image", saveUpload(mp.fileName, mp.file));
      } else {
        a.addProperty("image", "public/logo.jpg");
      }
    } else {
      a = readJson(ex);
    }
    if (!a.has("id")) a.addProperty("id", Store.newId("ad"));
    if (!a.has("active")) a.addProperty("active", true);
    return store.addAd(a);
  }

  private void applyQty(JsonObject p, String unit) {
    JsonArray qty = new JsonArray();
    String def;
    if ("piece".equals(unit)) {
      for (String q : new String[] {"1 piece", "2 pieces", "4 pieces", "6 pieces", "12 pieces"}) qty.add(q);
      def = "1 piece";
    } else if ("bowl".equals(unit)) {
      for (String q : new String[] {"1 bowl", "2 bowls", "4 bowls", "6 bowls"}) qty.add(q);
      def = "1 bowl";
    } else {
      for (String q : new String[] {"250 g", "500 g", "750 g", "1 kg", "1.5 kg", "2 kg", "3 kg", "5 kg"}) qty.add(q);
      def = "500 g";
    }
    p.add("qty", qty);
    p.addProperty("defaultQty", def);
    p.addProperty("unit", unit);
  }

  private String saveUpload(String original, byte[] bytes) throws IOException {
    String ext = ".jpg";
    String lower = original == null ? "" : original.toLowerCase();
    if (lower.endsWith(".png")) ext = ".png";
    else if (lower.endsWith(".webp")) ext = ".webp";
    else if (lower.endsWith(".jpeg") || lower.endsWith(".jpg")) ext = ".jpg";
    else if (lower.endsWith(".gif")) ext = ".gif";
    String name = "up-" + UUID.randomUUID().toString().substring(0, 10) + ext;
    Path dest = root.resolve("public").resolve("uploads").resolve(name);
    Files.write(dest, bytes);
    return "public/uploads/" + name;
  }

  private void staticFile(HttpExchange ex) throws IOException {
    if (!"GET".equals(ex.getRequestMethod()) && !"HEAD".equals(ex.getRequestMethod())) {
      error(ex, 405, "Method not allowed");
      return;
    }
    String raw = ex.getRequestURI().getPath();
    if (raw == null || raw.equals("/")) raw = "/index.html";
    String decoded = URLDecoder.decode(raw, StandardCharsets.UTF_8);
    Path file = root.resolve(decoded.replaceFirst("^/", "")).normalize();
    if (!file.startsWith(root) || decoded.contains("..")) {
      error(ex, 403, "Forbidden");
      return;
    }
    String rel = root.relativize(file).toString().replace('\\', '/');
    if (rel.startsWith("data/") || rel.startsWith("backend/") || rel.startsWith("node_modules/")) {
      error(ex, 403, "Forbidden");
      return;
    }
    if (Files.isDirectory(file)) file = file.resolve("index.html");
    if (!Files.isRegularFile(file)) {
      error(ex, 404, "Not found");
      return;
    }
    byte[] bytes = Files.readAllBytes(file);
    String mime = mime(file.getFileName().toString());
    ex.getResponseHeaders().set("Content-Type", mime);
    cors(ex.getResponseHeaders());
    if ("HEAD".equals(ex.getRequestMethod())) {
      ex.sendResponseHeaders(200, -1);
      ex.close();
      return;
    }
    ex.sendResponseHeaders(200, bytes.length);
    try (OutputStream os = ex.getResponseBody()) {
      os.write(bytes);
    }
  }

  private boolean isAdmin(HttpExchange ex) throws Exception {
    Database.User u = db.userForToken(cookie(ex, "smw"));
    return u != null && u.admin();
  }

  private static JsonObject userJson(Database.User u) {
    JsonObject o = new JsonObject();
    if (u == null) {
      o.addProperty("ok", false);
      return o;
    }
    o.addProperty("ok", true);
    o.addProperty("id", u.id());
    o.addProperty("name", u.name());
    o.addProperty("email", u.email());
    o.addProperty("role", u.role());
    o.addProperty("admin", u.admin());
    return o;
  }

  private static void setSessionCookie(HttpExchange ex, String token) {
    ex.getResponseHeaders().add("Set-Cookie", "smw=" + token + "; Path=/; HttpOnly; SameSite=Lax");
  }

  private static String cookie(HttpExchange ex, String name) {
    String c = header(ex, "Cookie");
    if (c == null) return null;
    for (String part : c.split(";")) {
      String[] kv = part.trim().split("=", 2);
      if (kv.length == 2 && name.equals(kv[0])) return kv[1];
    }
    return null;
  }

  private static String header(HttpExchange ex, String name) {
    return ex.getRequestHeaders().getFirst(name);
  }

  private static JsonObject readJson(HttpExchange ex) throws IOException {
    String s = new String(readBytes(ex), StandardCharsets.UTF_8);
    if (s.isBlank()) return new JsonObject();
    return JsonParser.parseString(s).getAsJsonObject();
  }

  private static byte[] readBytes(HttpExchange ex) throws IOException {
    try (InputStream in = ex.getRequestBody()) {
      return in.readAllBytes();
    }
  }

  private static double parsePrice(String s) {
    try {
      return Double.parseDouble(s.trim());
    } catch (Exception e) {
      return 0;
    }
  }

  private static void sendJson(HttpExchange ex, int code, Object obj) throws IOException {
    send(ex, code, "application/json; charset=utf-8", GSON.toJson(obj));
  }

  private static void error(HttpExchange ex, int code, String msg) throws IOException {
    JsonObject o = new JsonObject();
    o.addProperty("error", msg);
    sendJson(ex, code, o);
  }

  private static void send(HttpExchange ex, int code, String type, String body) throws IOException {
    byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
    ex.getResponseHeaders().set("Content-Type", type);
    cors(ex.getResponseHeaders());
    if (code == 204) {
      ex.sendResponseHeaders(204, -1);
      ex.close();
      return;
    }
    ex.sendResponseHeaders(code, bytes.length);
    try (OutputStream os = ex.getResponseBody()) {
      os.write(bytes);
    }
  }

  private static void cors(Headers h) {
    h.set("Access-Control-Allow-Origin", "*");
    h.set("Access-Control-Allow-Headers", "Content-Type");
    h.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  }

  private static String mime(String name) {
    String n = name.toLowerCase();
    if (n.endsWith(".html")) return "text/html; charset=utf-8";
    if (n.endsWith(".css")) return "text/css; charset=utf-8";
    if (n.endsWith(".js")) return "application/javascript; charset=utf-8";
    if (n.endsWith(".json")) return "application/json; charset=utf-8";
    if (n.endsWith(".png")) return "image/png";
    if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
    if (n.endsWith(".webp")) return "image/webp";
    if (n.endsWith(".gif")) return "image/gif";
    if (n.endsWith(".svg")) return "image/svg+xml";
    return "application/octet-stream";
  }
}
