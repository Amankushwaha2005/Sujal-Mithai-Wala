package smw;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Starts a local PostgreSQL (backend/pgsql) and holds users + sessions.
 * Admin account: amankushwahaauraiya2005@gmail.com / sujal123
 */
final class Database {
  static final String ADMIN_EMAIL = "amankushwahaauraiya2005@gmail.com";
  static final String ADMIN_PASSWORD = "sujal123";
  static final int PG_PORT = 5433;
  static final String DB_NAME = "sujal_mithai";
  static final String DB_USER = "sujal";
  static final String DB_PASS = "sujal123";

  private final Path root;
  private final Path pgBin;
  private final Path pgData;
  private final String dbUser;
  private final String dbPass;
  private final boolean externalDb;
  private int dbPort;
  private String url;
  private String lastDbError = "";

  Database(Path root) throws Exception {
    this.root = root;
    Path home = dataHome();
    this.pgBin = findPgBin(root);
    this.pgData = home.resolve("pgdata");
    String jdbc = firstEnv("SMW_JDBC_URL", "DATABASE_URL");
    if (jdbc != null && !jdbc.isBlank()) {
      DbTarget target = parseDatabaseUrl(jdbc.trim());
      this.url = target.url();
      this.dbUser = target.user();
      this.dbPass = target.pass();
      this.dbPort = target.port();
      this.externalDb = true;
    } else {
      String host = envOr("SMW_DB_HOST", "127.0.0.1");
      this.dbPort = envInt("SMW_DB_PORT", isWindows() ? PG_PORT : 5432);
      String name = envOr("SMW_DB_NAME", DB_NAME);
      this.url = "jdbc:postgresql://" + host + ":" + dbPort + "/" + name;
      this.dbUser = envOr("SMW_DB_USER", DB_USER);
      this.dbPass = envOr("SMW_DB_PASS", DB_PASS);
      this.externalDb = false;
    }
    Class.forName("org.postgresql.Driver");
    ensureRunning();
    migrate();
  }

  Connection connect() throws Exception {
    return DriverManager.getConnection(url, dbUser, dbPass);
  }

  User signup(String name, String email, String password) throws Exception {
    email = email.trim().toLowerCase();
    name = name.trim();
    if (name.isBlank() || name.length() > 80) throw new IllegalArgumentException("Name required");
    if (!Passwords.looksLikeEmail(email)) throw new IllegalArgumentException("Valid email required");
    if (password == null || password.length() < 6) throw new IllegalArgumentException("Password must be 6+ characters");
    if (findByEmail(email) != null) throw new IllegalArgumentException("This email is already registered");
    String role = ADMIN_EMAIL.equals(email) ? "admin" : "customer";
    User u = new User(UUID.randomUUID().toString(), name, email, role);
    try (Connection c = connect();
        PreparedStatement ps =
            c.prepareStatement("INSERT INTO users(id, name, email, password_hash, role) VALUES (?,?,?,?,?)")) {
      ps.setString(1, u.id());
      ps.setString(2, u.name());
      ps.setString(3, u.email());
      ps.setString(4, Passwords.hash(password));
      ps.setString(5, role);
      ps.executeUpdate();
    }
    return u;
  }

  User login(String email, String password) throws Exception {
    email = email == null ? "" : email.trim().toLowerCase();
    UserRow row = findByEmail(email);
    if (row == null || !Passwords.verify(password, row.hash())) {
      throw new IllegalArgumentException("Email or password is wrong");
    }
    if (ADMIN_EMAIL.equals(email) && !row.user().admin()) {
      try (Connection c = connect();
          PreparedStatement ps = c.prepareStatement("UPDATE users SET role = 'admin' WHERE email = ?")) {
        ps.setString(1, email);
        ps.executeUpdate();
      }
      return new User(row.user().id(), row.user().name(), row.user().email(), "admin");
    }
    return row.user();
  }

  void resetPassword(String email, String newPassword) throws Exception {
    email = email == null ? "" : email.trim().toLowerCase();
    if (!Passwords.looksLikeEmail(email)) throw new IllegalArgumentException("Valid email required");
    if (newPassword == null || newPassword.length() < 6) {
      throw new IllegalArgumentException("Password must be 6+ characters");
    }
    UserRow row = findByEmail(email);
    if (row == null) throw new IllegalArgumentException("No account found for this email");
    try (Connection c = connect();
        PreparedStatement ps = c.prepareStatement("UPDATE users SET password_hash = ? WHERE email = ?")) {
      ps.setString(1, Passwords.hash(newPassword));
      ps.setString(2, email);
      ps.executeUpdate();
    }
  }

  String createSession(String userId) throws Exception {
    String token = UUID.randomUUID().toString();
    try (Connection c = connect();
        PreparedStatement ps = c.prepareStatement("INSERT INTO sessions(token, user_id) VALUES (?,?)")) {
      ps.setString(1, token);
      ps.setString(2, userId);
      ps.executeUpdate();
    }
    return token;
  }

  User userForToken(String token) throws Exception {
    if (token == null || token.isBlank()) return null;
    try (Connection c = connect();
        PreparedStatement ps =
            c.prepareStatement(
                "SELECT u.id, u.name, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?")) {
      ps.setString(1, token);
      try (ResultSet rs = ps.executeQuery()) {
        if (!rs.next()) return null;
        return new User(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4));
      }
    }
  }

  void deleteSession(String token) throws Exception {
    if (token == null) return;
    try (Connection c = connect();
        PreparedStatement ps = c.prepareStatement("DELETE FROM sessions WHERE token = ?")) {
      ps.setString(1, token);
      ps.executeUpdate();
    }
  }

  JsonObject listUsers() throws Exception {
    JsonArray arr = new JsonArray();
    int total = 0;
    int customers = 0;
    int admins = 0;
    try (Connection c = connect();
        Statement st = c.createStatement();
        ResultSet rs = st.executeQuery("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC")) {
      while (rs.next()) {
        total++;
        String role = rs.getString("role");
        if ("admin".equals(role)) admins++;
        else customers++;
        JsonObject o = new JsonObject();
        o.addProperty("id", rs.getString("id"));
        o.addProperty("name", rs.getString("name"));
        o.addProperty("email", rs.getString("email"));
        o.addProperty("role", role);
        Timestamp ts = rs.getTimestamp("created_at");
        o.addProperty("createdAt", ts == null ? "" : ts.toInstant().toString());
        arr.add(o);
      }
    }
    JsonObject out = new JsonObject();
    out.addProperty("total", total);
    out.addProperty("customers", customers);
    out.addProperty("admins", admins);
    out.add("users", arr);
    return out;
  }

  void updateUser(String id, String name, String email, String role, String newPassword, String actorId)
      throws Exception {
    if (id == null || id.isBlank()) throw new IllegalArgumentException("User id required");
    name = name == null ? "" : name.trim();
    email = email == null ? "" : email.trim().toLowerCase();
    role = "admin".equals(role) ? "admin" : "customer";
    if (name.isBlank()) throw new IllegalArgumentException("Name required");
    if (!Passwords.looksLikeEmail(email)) throw new IllegalArgumentException("Valid email required");
    UserRow taken = findByEmail(email);
    if (taken != null && !id.equals(taken.user().id())) {
      throw new IllegalArgumentException("This email is already registered");
    }
    if (countAdmins() <= 1 && isAdminId(id) && !"admin".equals(role)) {
      throw new IllegalArgumentException("Last admin ko customer nahi bana sakte");
    }
    try (Connection c = connect();
        PreparedStatement ps =
            c.prepareStatement("UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?")) {
      ps.setString(1, name);
      ps.setString(2, email);
      ps.setString(3, role);
      ps.setString(4, id);
      if (ps.executeUpdate() == 0) throw new IllegalArgumentException("User not found");
    }
    if (newPassword != null && !newPassword.isBlank()) {
      if (newPassword.length() < 6) throw new IllegalArgumentException("Password must be 6+ characters");
      try (Connection c = connect();
          PreparedStatement ps = c.prepareStatement("UPDATE users SET password_hash = ? WHERE id = ?")) {
        ps.setString(1, Passwords.hash(newPassword));
        ps.setString(2, id);
        ps.executeUpdate();
      }
    }
  }

  void deleteUser(String id, String actorId) throws Exception {
    if (id == null) throw new IllegalArgumentException("User id required");
    if (id.equals(actorId)) throw new IllegalArgumentException("Apna account yahan se delete nahi hota");
    if (isAdminId(id) && countAdmins() <= 1) {
      throw new IllegalArgumentException("Last admin delete nahi ho sakta");
    }
    try (Connection c = connect();
        PreparedStatement ps = c.prepareStatement("DELETE FROM users WHERE id = ?")) {
      ps.setString(1, id);
      if (ps.executeUpdate() == 0) throw new IllegalArgumentException("User not found");
    }
  }

  private boolean isAdminId(String id) throws Exception {
    try (Connection c = connect();
        PreparedStatement ps = c.prepareStatement("SELECT role FROM users WHERE id = ?")) {
      ps.setString(1, id);
      try (ResultSet rs = ps.executeQuery()) {
        return rs.next() && "admin".equals(rs.getString(1));
      }
    }
  }

  private int countAdmins() throws Exception {
    try (Connection c = connect();
        Statement st = c.createStatement();
        ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM users WHERE role = 'admin'")) {
      rs.next();
      return rs.getInt(1);
    }
  }

  record User(String id, String name, String email, String role) {
    boolean admin() {
      return "admin".equals(role);
    }
  }

  private record UserRow(User user, String hash) {}

  private UserRow findByEmail(String email) throws Exception {
    try (Connection c = connect();
        PreparedStatement ps =
            c.prepareStatement("SELECT id, name, email, role, password_hash FROM users WHERE email = ?")) {
      ps.setString(1, email);
      try (ResultSet rs = ps.executeQuery()) {
        if (!rs.next()) return null;
        User u = new User(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4));
        return new UserRow(u, rs.getString(5));
      }
    }
  }

  private void migrate() throws Exception {
    try (Connection c = connect(); Statement st = c.createStatement()) {
      st.execute(
          """
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          )
          """);
      st.execute(
          """
          CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          )
          """);
    }
    ensureAdmin();
  }

  private void ensureAdmin() throws Exception {
    UserRow mine = findByEmail(ADMIN_EMAIL);
    if (mine != null) {
      try (Connection c = connect();
          PreparedStatement ps = c.prepareStatement("UPDATE users SET role = 'admin' WHERE email = ?")) {
        ps.setString(1, ADMIN_EMAIL);
        ps.executeUpdate();
      }
      return;
    }
    UserRow old = findByEmail("hello@sujalmithaiwala.in");
    if (old != null) {
      try (Connection c = connect();
          PreparedStatement ps = c.prepareStatement("UPDATE users SET email = ?, role = 'admin' WHERE email = ?")) {
        ps.setString(1, ADMIN_EMAIL);
        ps.setString(2, "hello@sujalmithaiwala.in");
        ps.executeUpdate();
      }
      return;
    }
    try (Connection c = connect();
        PreparedStatement ps =
            c.prepareStatement("INSERT INTO users(id, name, email, password_hash, role) VALUES (?,?,?,?,?)")) {
      ps.setString(1, UUID.randomUUID().toString());
      ps.setString(2, "Sujal Admin");
      ps.setString(3, ADMIN_EMAIL);
      ps.setString(4, Passwords.hash(ADMIN_PASSWORD));
      ps.setString(5, "admin");
      ps.executeUpdate();
    }
  }

  private void ensureRunning() throws Exception {
    if (externalDb) {
      if (!canConnect()) {
        throw new IllegalStateException("Database connect failed: " + lastDbError);
      }
      return;
    }
    if (canConnect()) return;
    if (canConnectPostgres()) {
      createDatabaseIfNeeded();
      return;
    }
    if (pgBin == null) {
      throw new IllegalStateException(
          "PostgreSQL nahi mila. Ye Windows .exe wala setup Linux VPS pe nahi chalta.\n"
              + "VPS par ye commands chalao:\n"
              + "  apt-get update && apt-get install -y postgresql postgresql-contrib\n"
              + "  sudo -u postgres psql -c \"CREATE USER sujal WITH PASSWORD 'sujal123';\"\n"
              + "  sudo -u postgres psql -c \"CREATE DATABASE sujal_mithai OWNER sujal;\"\n"
              + "Phir project root se: bash start-vps.sh");
    }
    if (!isWindows() && dbPort == 5432) {
      dbPort = PG_PORT;
      url = "jdbc:postgresql://127.0.0.1:" + dbPort + "/" + envOr("SMW_DB_NAME", DB_NAME);
    }
    Files.createDirectories(pgData.getParent());
    if (!Files.exists(pgData.resolve("PG_VERSION"))) {
      initDb();
    }
    if (!canConnect() && !canConnectPostgres()) {
      startServer();
      waitReady();
    }
    createDatabaseIfNeeded();
  }

  private void initDb() throws Exception {
    Path pw = pgData.getParent().resolve("pg-pw.txt");
    Files.writeString(pw, dbPass, StandardCharsets.UTF_8);
    Process p =
        new ProcessBuilder(
                pgCmd("initdb"),
                "-D",
                pgData.toString(),
                "-U",
                dbUser,
                "-A",
                "password",
                "--pwfile",
                pw.toString(),
                "-E",
                "UTF8")
            .directory(root.toFile())
            .inheritIO()
            .start();
    if (!p.waitFor(2, TimeUnit.MINUTES) || p.exitValue() != 0) {
      throw new IllegalStateException("initdb failed");
    }
    Path conf = pgData.resolve("postgresql.conf");
    String text = Files.readString(conf, StandardCharsets.UTF_8);
    text = text.replaceFirst("(?m)^#?port\\s*=.*", "port = " + dbPort);
    text = text.replaceFirst("(?m)^#?listen_addresses\\s*=.*", "listen_addresses = '127.0.0.1'");
    Files.writeString(conf, text, StandardCharsets.UTF_8);
  }

  private void startServer() throws Exception {
    Path log = pgData.getParent().resolve("postgres.log");
    Process p =
        new ProcessBuilder(pgCmd("pg_ctl"), "-D", pgData.toString(), "-l", log.toString(), "start")
            .directory(root.toFile())
            .inheritIO()
            .start();
    if (!p.waitFor(1, TimeUnit.MINUTES) || p.exitValue() != 0) {
      throw new IllegalStateException("Could not start PostgreSQL. See " + log);
    }
  }

  private void waitReady() throws Exception {
    for (int i = 0; i < 40; i++) {
      if (canConnectPostgres()) return;
      Thread.sleep(250);
    }
    throw new IllegalStateException("PostgreSQL did not become ready");
  }

  private boolean canConnect() {
    try (Connection c = DriverManager.getConnection(url, dbUser, dbPass)) {
      return true;
    } catch (Exception e) {
      lastDbError = e.getMessage() == null ? e.toString() : e.getMessage();
      return false;
    }
  }

  private boolean canConnectPostgres() {
    try (Connection c = DriverManager.getConnection(postgresUrl(), dbUser, dbPass)) {
      return true;
    } catch (Exception e) {
      return false;
    }
  }

  private String postgresUrl() {
    int slash = url.lastIndexOf('/');
    return (slash > "jdbc:postgresql://".length() ? url.substring(0, slash) : "jdbc:postgresql://127.0.0.1:" + dbPort)
        + "/postgres";
  }

  private void createDatabaseIfNeeded() throws Exception {
    if (canConnect()) return;
    String name = envOr("SMW_DB_NAME", DB_NAME);
    try (Connection c = DriverManager.getConnection(postgresUrl(), dbUser, dbPass);
        Statement st = c.createStatement()) {
      st.execute("CREATE DATABASE " + name);
    } catch (Exception e) {
      if (!canConnect()) throw e;
    }
  }

  private String pgCmd(String name) {
    Path linux = pgBin.resolve(name);
    Path win = pgBin.resolve(name + ".exe");
    if (Files.isRegularFile(linux)) return linux.toString();
    if (Files.isRegularFile(win)) return win.toString();
    throw new IllegalStateException("Missing PostgreSQL command: " + name + " in " + pgBin);
  }

  private static Path dataHome() {
    String smw = System.getenv("SMW_DATA");
    if (smw != null && !smw.isBlank()) return Path.of(smw).toAbsolutePath().normalize();
    String local = System.getenv("LOCALAPPDATA");
    if (local != null && !local.isBlank()) return Path.of(local, "sujal-mithai-wala");
    return Path.of(System.getProperty("user.home"), ".sujal-mithai-wala");
  }

  private static Path findPgBin(Path root) {
    java.util.List<Path> guesses = new java.util.ArrayList<>();
    String local = System.getenv("LOCALAPPDATA");
    if (local != null && !local.isBlank()) {
      Path base = Path.of(local, "sujal-mithai-wala", "pgsql");
      guesses.add(base.resolve("bin"));
      guesses.add(base.resolve("pgsql").resolve("bin"));
    }
    guesses.add(root.resolve("backend").resolve("pgsql").resolve("bin"));
    guesses.add(root.resolve("backend").resolve("pgsql").resolve("pgsql").resolve("bin"));
    guesses.add(root.resolve("pgsql").resolve("bin"));
    guesses.add(Path.of("/usr/lib/postgresql/18/bin"));
    guesses.add(Path.of("/usr/lib/postgresql/17/bin"));
    guesses.add(Path.of("/usr/lib/postgresql/16/bin"));
    guesses.add(Path.of("/usr/lib/postgresql/15/bin"));
    guesses.add(Path.of("/usr/lib/postgresql/14/bin"));
    guesses.add(Path.of("/usr/bin"));
    guesses.add(Path.of("C:\\Program Files\\PostgreSQL\\16\\bin"));
    guesses.add(Path.of("C:\\Program Files\\PostgreSQL\\17\\bin"));
    guesses.add(Path.of("C:\\Program Files\\PostgreSQL\\18\\bin"));
    for (Path p : guesses) {
      if (hasPg(p)) return p;
    }
    return null;
  }

  private static boolean hasPg(Path p) {
    return Files.isRegularFile(p.resolve("initdb"))
        || Files.isRegularFile(p.resolve("initdb.exe"))
        || Files.isRegularFile(p.resolve("pg_ctl"))
        || Files.isRegularFile(p.resolve("pg_ctl.exe"));
  }

  private static boolean isWindows() {
    return System.getProperty("os.name", "").toLowerCase().contains("win");
  }

  private static String envOr(String key, String fallback) {
    String v = System.getenv(key);
    return (v == null || v.isBlank()) ? fallback : v.trim();
  }

  private static String firstEnv(String... keys) {
    for (String k : keys) {
      String v = System.getenv(k);
      if (v != null && !v.isBlank()) return v;
    }
    return null;
  }

  private static int envInt(String key, int fallback) {
    String v = System.getenv(key);
    if (v == null || v.isBlank()) return fallback;
    return Integer.parseInt(v.trim());
  }

  private record DbTarget(String url, String user, String pass, int port) {}

  private static DbTarget parseDatabaseUrl(String raw) throws Exception {
    String s = raw.startsWith("jdbc:") ? raw.substring(5) : raw;
    if (s.startsWith("postgres://")) s = "postgresql://" + s.substring("postgres://".length());
    java.net.URI uri = new java.net.URI(s);
    String user = envOr("SMW_DB_USER", DB_USER);
    String pass = envOr("SMW_DB_PASS", DB_PASS);
    String info = uri.getUserInfo();
    if (info != null && !info.isBlank()) {
      int colon = info.indexOf(':');
      if (colon < 0) {
        user = java.net.URLDecoder.decode(info, StandardCharsets.UTF_8);
      } else {
        user = java.net.URLDecoder.decode(info.substring(0, colon), StandardCharsets.UTF_8);
        pass = java.net.URLDecoder.decode(info.substring(colon + 1), StandardCharsets.UTF_8);
      }
    }
    int port = uri.getPort() > 0 ? uri.getPort() : 5432;
    String db = uri.getPath() == null ? DB_NAME : uri.getPath();
    if (db.startsWith("/")) db = db.substring(1);
    if (db.isBlank()) db = DB_NAME;
    String query = uri.getRawQuery();
    String host = uri.getHost();
    if ((query == null || !query.contains("sslmode")) && host != null && host.contains("render.com")) {
      query = (query == null || query.isBlank()) ? "sslmode=require" : query + "&sslmode=require";
    }
    String url = "jdbc:postgresql://" + host + ":" + port + "/" + db + (query == null || query.isBlank() ? "" : "?" + query);
    return new DbTarget(url, user, pass, port);
  }
}
