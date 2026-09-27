/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.google.gson.Gson
 *  com.google.gson.JsonArray
 *  com.google.gson.JsonElement
 *  com.google.gson.JsonObject
 *  com.google.gson.JsonParser
 */
package smw;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
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
import java.nio.file.LinkOption;
import java.nio.file.OpenOption;
import java.nio.file.Path;
import java.util.UUID;
import java.util.concurrent.Executors;
import smw.Database;
import smw.Multipart;
import smw.Store;

public class App {
    private static final int PORT = 8080;
    private static final Gson GSON = new Gson();
    private final Path root;
    private final Store store;
    private final Database db;

    public static void main(String[] stringArray) throws Exception {
        Path path = Path.of(stringArray.length > 0 ? stringArray[0] : ".", new String[0]).toAbsolutePath().normalize();
        new App(path).start();
    }

    App(Path path) throws Exception {
        this.root = path;
        this.store = new Store(path);
        this.db = new Database(path);
    }

    void start() throws IOException {
        HttpServer httpServer = HttpServer.create(new InetSocketAddress("0.0.0.0", 8080), 0);
        httpServer.createContext("/api/", this::api);
        httpServer.createContext("/", this::staticFile);
        httpServer.setExecutor(Executors.newCachedThreadPool());
        httpServer.start();
        System.out.println("Sujal Mithai Wala running:");
        System.out.println("  Website : http://127.0.0.1:8080/");
        System.out.println("  Admin   : http://127.0.0.1:8080/admin.html");
        System.out.println("  Admin email: amankushwahaauraiya2005@gmail.com  password: sujal123");
    }

    private void api(HttpExchange httpExchange) throws IOException {
        try {
            String string = httpExchange.getRequestURI().getPath();
            String string2 = httpExchange.getRequestMethod();
            if ("OPTIONS".equals(string2)) {
                App.send(httpExchange, 204, "application/json", "");
                return;
            }
            if (string.equals("/api/catalog") && "GET".equals(string2)) {
                App.sendJson(httpExchange, 200, this.store.catalog());
                return;
            }
            if (string.equals("/api/signup") && "POST".equals(string2)) {
                JsonObject jsonObject = App.readJson(httpExchange);
                Database.User user = this.db.signup(jsonObject.has("name") ? jsonObject.get("name").getAsString() : "", jsonObject.has("email") ? jsonObject.get("email").getAsString() : "", jsonObject.has("password") ? jsonObject.get("password").getAsString() : "");
                App.setSessionCookie(httpExchange, this.db.createSession(user.id()));
                App.sendJson(httpExchange, 200, App.userJson(user));
                return;
            }
            if (string.equals("/api/login") && "POST".equals(string2)) {
                JsonObject jsonObject = App.readJson(httpExchange);
                if (!jsonObject.has("email") || jsonObject.get("email").getAsString().isBlank()) {
                    App.error(httpExchange, 400, "Email se login kijiye");
                    return;
                }
                Database.User user = this.db.login(jsonObject.get("email").getAsString(), jsonObject.has("password") ? jsonObject.get("password").getAsString() : "");
                App.setSessionCookie(httpExchange, this.db.createSession(user.id()));
                App.sendJson(httpExchange, 200, App.userJson(user));
                return;
            }
            if (string.equals("/api/forgot") && "POST".equals(string2)) {
                String string3;
                JsonObject jsonObject = App.readJson(httpExchange);
                String string4 = jsonObject.has("password") ? jsonObject.get("password").getAsString() : "";
                String string5 = string3 = jsonObject.has("confirm") ? jsonObject.get("confirm").getAsString() : "";
                if (!string4.equals(string3)) {
                    App.error(httpExchange, 400, "Dono password same hone chahiye");
                    return;
                }
                this.db.resetPassword(jsonObject.has("email") ? jsonObject.get("email").getAsString() : "", string4);
                JsonObject jsonObject2 = new JsonObject();
                jsonObject2.addProperty("ok", Boolean.valueOf(true));
                App.sendJson(httpExchange, 200, jsonObject2);
                return;
            }
            if (string.equals("/api/logout") && "POST".equals(string2)) {
                this.db.deleteSession(App.cookie(httpExchange, "smw"));
                JsonObject jsonObject = new JsonObject();
                jsonObject.addProperty("ok", Boolean.valueOf(true));
                App.sendJson(httpExchange, 200, jsonObject);
                return;
            }
            if (string.equals("/api/me") && "GET".equals(string2)) {
                Database.User user = this.db.userForToken(App.cookie(httpExchange, "smw"));
                if (user == null) {
                    JsonObject jsonObject = new JsonObject();
                    jsonObject.addProperty("ok", Boolean.valueOf(false));
                    App.sendJson(httpExchange, 200, jsonObject);
                    return;
                }
                App.sendJson(httpExchange, 200, App.userJson(user));
                return;
            }
            if (string.equals("/api/session") && "GET".equals(string2)) {
                Database.User user = this.db.userForToken(App.cookie(httpExchange, "smw"));
                JsonObject jsonObject = App.userJson(user);
                jsonObject.addProperty("ok", Boolean.valueOf(user != null && user.admin()));
                App.sendJson(httpExchange, 200, jsonObject);
                return;
            }
            if (!this.isAdmin(httpExchange)) {
                App.error(httpExchange, 401, "Admin login required");
                return;
            }
            if (string.equals("/api/users") && "GET".equals(string2)) {
                App.sendJson(httpExchange, 200, this.db.listUsers());
                return;
            }
            if (string.startsWith("/api/users/") && "PUT".equals(string2)) {
                String string6 = string.substring("/api/users/".length());
                Database.User user = this.db.userForToken(App.cookie(httpExchange, "smw"));
                JsonObject jsonObject = App.readJson(httpExchange);
                this.db.updateUser(string6, jsonObject.has("name") ? jsonObject.get("name").getAsString() : "", jsonObject.has("email") ? jsonObject.get("email").getAsString() : "", jsonObject.has("role") ? jsonObject.get("role").getAsString() : "customer", jsonObject.has("password") ? jsonObject.get("password").getAsString() : "", user == null ? "" : user.id());
                App.sendJson(httpExchange, 200, this.db.listUsers());
                return;
            }
            if (string.startsWith("/api/users/") && "DELETE".equals(string2)) {
                String string7 = string.substring("/api/users/".length());
                Database.User user = this.db.userForToken(App.cookie(httpExchange, "smw"));
                this.db.deleteUser(string7, user == null ? "" : user.id());
                App.sendJson(httpExchange, 200, this.db.listUsers());
                return;
            }
            if (string.equals("/api/products") && "POST".equals(string2)) {
                App.sendJson(httpExchange, 200, this.createProduct(httpExchange));
                return;
            }
            if (string.startsWith("/api/products/") && "PUT".equals(string2)) {
                String string8 = string.substring("/api/products/".length());
                boolean bl = this.store.updateProduct(string8, App.readJson(httpExchange));
                if (bl) {
                    App.sendJson(httpExchange, 200, this.store.catalog());
                } else {
                    App.error(httpExchange, 404, "Mithai not found");
                }
                return;
            }
            if (string.startsWith("/api/products/") && "DELETE".equals(string2)) {
                String string9 = string.substring("/api/products/".length());
                boolean bl = this.store.deleteProduct(string9);
                if (bl) {
                    App.sendJson(httpExchange, 200, this.store.catalog());
                } else {
                    App.error(httpExchange, 404, "Mithai not found");
                }
                return;
            }
            if (string.equals("/api/offers") && "POST".equals(string2)) {
                JsonObject jsonObject = App.readJson(httpExchange);
                if (!jsonObject.has("id")) {
                    jsonObject.addProperty("id", Store.newId("offer"));
                }
                if (!jsonObject.has("active")) {
                    jsonObject.addProperty("active", Boolean.valueOf(true));
                }
                App.sendJson(httpExchange, 200, this.store.addOffer(jsonObject));
                return;
            }
            if (string.startsWith("/api/offers/") && "PUT".equals(string2)) {
                String string10 = string.substring("/api/offers/".length());
                if (this.store.updateOffer(string10, App.readJson(httpExchange))) {
                    App.sendJson(httpExchange, 200, this.store.catalog());
                } else {
                    App.error(httpExchange, 404, "Offer not found");
                }
                return;
            }
            if (string.startsWith("/api/offers/") && "DELETE".equals(string2)) {
                String string11 = string.substring("/api/offers/".length());
                if (this.store.deleteOffer(string11)) {
                    App.sendJson(httpExchange, 200, this.store.catalog());
                } else {
                    App.error(httpExchange, 404, "Offer not found");
                }
                return;
            }
            if (string.equals("/api/ads") && "POST".equals(string2)) {
                App.sendJson(httpExchange, 200, this.createAd(httpExchange));
                return;
            }
            if (string.startsWith("/api/ads/") && "PUT".equals(string2)) {
                String string12 = string.substring("/api/ads/".length());
                if (this.store.updateAd(string12, App.readJson(httpExchange))) {
                    App.sendJson(httpExchange, 200, this.store.catalog());
                } else {
                    App.error(httpExchange, 404, "Ad not found");
                }
                return;
            }
            if (string.startsWith("/api/ads/") && "DELETE".equals(string2)) {
                String string13 = string.substring("/api/ads/".length());
                if (this.store.deleteAd(string13)) {
                    App.sendJson(httpExchange, 200, this.store.catalog());
                } else {
                    App.error(httpExchange, 404, "Ad not found");
                }
                return;
            }
            App.error(httpExchange, 404, "Unknown API");
        }
        catch (IllegalArgumentException illegalArgumentException) {
            App.error(httpExchange, 400, illegalArgumentException.getMessage());
        }
        catch (Exception exception) {
            exception.printStackTrace();
            App.error(httpExchange, 500, exception.getMessage() == null ? "Server error" : exception.getMessage());
        }
    }

    private JsonObject createProduct(HttpExchange httpExchange) throws Exception {
        Object object;
        String string = App.header(httpExchange, "Content-Type");
        JsonObject jsonObject = new JsonObject();
        if (string != null && string.toLowerCase().startsWith("multipart/")) {
            object = Multipart.parse(App.readBytes(httpExchange), string);
            jsonObject.addProperty("name", ((Multipart)object).fields.getOrDefault("name", "New mithai"));
            jsonObject.addProperty("price", (Number)App.parsePrice(((Multipart)object).fields.getOrDefault("price", "0")));
            jsonObject.addProperty("unit", ((Multipart)object).fields.getOrDefault("unit", "kg"));
            jsonObject.addProperty("category", ((Multipart)object).fields.getOrDefault("category", "Medium Range"));
            jsonObject.addProperty("desc", ((Multipart)object).fields.getOrDefault("desc", ""));
            jsonObject.addProperty("available", Boolean.valueOf(true));
            if (((Multipart)object).file != null && ((Multipart)object).file.length > 0) {
                jsonObject.addProperty("image", this.saveUpload(((Multipart)object).fileName, ((Multipart)object).file));
            } else {
                jsonObject.addProperty("image", "public/logo.jpg");
            }
        } else {
            jsonObject = App.readJson(httpExchange);
            if (!jsonObject.has("image")) {
                jsonObject.addProperty("image", "public/logo.jpg");
            }
        }
        object = jsonObject.has("unit") ? jsonObject.get("unit").getAsString() : "kg";
        this.applyQty(jsonObject, (String)object);
        if (!jsonObject.has("id")) {
            jsonObject.addProperty("id", Store.slug(jsonObject.get("name").getAsString()));
        }
        return this.store.addProduct(jsonObject);
    }

    private JsonObject createAd(HttpExchange httpExchange) throws Exception {
        String string = App.header(httpExchange, "Content-Type");
        JsonObject jsonObject = new JsonObject();
        if (string != null && string.toLowerCase().startsWith("multipart/")) {
            Multipart multipart = Multipart.parse(App.readBytes(httpExchange), string);
            jsonObject.addProperty("title", multipart.fields.getOrDefault("title", "Ad"));
            jsonObject.addProperty("link", multipart.fields.getOrDefault("link", "mithai.html"));
            jsonObject.addProperty("active", Boolean.valueOf(true));
            if (multipart.file != null && multipart.file.length > 0) {
                jsonObject.addProperty("image", this.saveUpload(multipart.fileName, multipart.file));
            } else {
                jsonObject.addProperty("image", "public/logo.jpg");
            }
        } else {
            jsonObject = App.readJson(httpExchange);
        }
        if (!jsonObject.has("id")) {
            jsonObject.addProperty("id", Store.newId("ad"));
        }
        if (!jsonObject.has("active")) {
            jsonObject.addProperty("active", Boolean.valueOf(true));
        }
        return this.store.addAd(jsonObject);
    }

    private void applyQty(JsonObject jsonObject, String string) {
        String string2;
        JsonArray jsonArray = new JsonArray();
        if ("piece".equals(string)) {
            for (String string3 : new String[]{"1 piece", "2 pieces", "4 pieces", "6 pieces", "12 pieces"}) {
                jsonArray.add(string3);
            }
            string2 = "1 piece";
        } else if ("bowl".equals(string)) {
            for (String string4 : new String[]{"1 bowl", "2 bowls", "4 bowls", "6 bowls"}) {
                jsonArray.add(string4);
            }
            string2 = "1 bowl";
        } else {
            for (String string5 : new String[]{"250 g", "500 g", "750 g", "1 kg", "1.5 kg", "2 kg", "3 kg", "5 kg"}) {
                jsonArray.add(string5);
            }
            string2 = "500 g";
        }
        jsonObject.add("qty", (JsonElement)jsonArray);
        jsonObject.addProperty("defaultQty", string2);
        jsonObject.addProperty("unit", string);
    }

    private String saveUpload(String string, byte[] byArray) throws IOException {
        String string2;
        String string3 = ".jpg";
        String string4 = string2 = string == null ? "" : string.toLowerCase();
        if (string2.endsWith(".png")) {
            string3 = ".png";
        } else if (string2.endsWith(".webp")) {
            string3 = ".webp";
        } else if (string2.endsWith(".jpeg") || string2.endsWith(".jpg")) {
            string3 = ".jpg";
        } else if (string2.endsWith(".gif")) {
            string3 = ".gif";
        }
        String string5 = "up-" + UUID.randomUUID().toString().substring(0, 10) + string3;
        Path path = this.root.resolve("public").resolve("uploads").resolve(string5);
        Files.write(path, byArray, new OpenOption[0]);
        return "public/uploads/" + string5;
    }

    private void staticFile(HttpExchange httpExchange) throws IOException {
        String string;
        Path path;
        if (!"GET".equals(httpExchange.getRequestMethod()) && !"HEAD".equals(httpExchange.getRequestMethod())) {
            App.error(httpExchange, 405, "Method not allowed");
            return;
        }
        String string2 = httpExchange.getRequestURI().getPath();
        if (string2 == null || string2.equals("/")) {
            string2 = "/index.html";
        }
        if (!(path = this.root.resolve((string = URLDecoder.decode(string2, StandardCharsets.UTF_8)).replaceFirst("^/", "")).normalize()).startsWith(this.root) || string.contains("..")) {
            App.error(httpExchange, 403, "Forbidden");
            return;
        }
        String string3 = this.root.relativize(path).toString().replace('\\', '/');
        if (string3.startsWith("data/") || string3.startsWith("backend/") || string3.startsWith("node_modules/")) {
            App.error(httpExchange, 403, "Forbidden");
            return;
        }
        if (Files.isDirectory(path, new LinkOption[0])) {
            path = path.resolve("index.html");
        }
        if (!Files.isRegularFile(path, new LinkOption[0])) {
            App.error(httpExchange, 404, "Not found");
            return;
        }
        byte[] byArray = Files.readAllBytes(path);
        String string4 = App.mime(path.getFileName().toString());
        httpExchange.getResponseHeaders().set("Content-Type", string4);
        App.cors(httpExchange.getResponseHeaders());
        if ("HEAD".equals(httpExchange.getRequestMethod())) {
            httpExchange.sendResponseHeaders(200, -1L);
            httpExchange.close();
            return;
        }
        httpExchange.sendResponseHeaders(200, byArray.length);
        try (OutputStream outputStream = httpExchange.getResponseBody();){
            outputStream.write(byArray);
        }
    }

    private boolean isAdmin(HttpExchange httpExchange) throws Exception {
        Database.User user = this.db.userForToken(App.cookie(httpExchange, "smw"));
        return user != null && user.admin();
    }

    private static JsonObject userJson(Database.User user) {
        JsonObject jsonObject = new JsonObject();
        if (user == null) {
            jsonObject.addProperty("ok", Boolean.valueOf(false));
            return jsonObject;
        }
        jsonObject.addProperty("ok", Boolean.valueOf(true));
        jsonObject.addProperty("id", user.id());
        jsonObject.addProperty("name", user.name());
        jsonObject.addProperty("email", user.email());
        jsonObject.addProperty("role", user.role());
        jsonObject.addProperty("admin", Boolean.valueOf(user.admin()));
        return jsonObject;
    }

    private static void setSessionCookie(HttpExchange httpExchange, String string) {
        httpExchange.getResponseHeaders().add("Set-Cookie", "smw=" + string + "; Path=/; HttpOnly; SameSite=Lax");
    }

    private static String cookie(HttpExchange httpExchange, String string) {
        String string2 = App.header(httpExchange, "Cookie");
        if (string2 == null) {
            return null;
        }
        for (String string3 : string2.split(";")) {
            String[] stringArray = string3.trim().split("=", 2);
            if (stringArray.length != 2 || !string.equals(stringArray[0])) continue;
            return stringArray[1];
        }
        return null;
    }

    private static String header(HttpExchange httpExchange, String string) {
        return httpExchange.getRequestHeaders().getFirst(string);
    }

    private static JsonObject readJson(HttpExchange httpExchange) throws IOException {
        String string = new String(App.readBytes(httpExchange), StandardCharsets.UTF_8);
        if (string.isBlank()) {
            return new JsonObject();
        }
        return JsonParser.parseString((String)string).getAsJsonObject();
    }

    private static byte[] readBytes(HttpExchange httpExchange) throws IOException {
        try (InputStream inputStream = httpExchange.getRequestBody();){
            byte[] byArray = inputStream.readAllBytes();
            return byArray;
        }
    }

    private static double parsePrice(String string) {
        try {
            return Double.parseDouble(string.trim());
        }
        catch (Exception exception) {
            return 0.0;
        }
    }

    private static void sendJson(HttpExchange httpExchange, int n, Object object) throws IOException {
        App.send(httpExchange, n, "application/json; charset=utf-8", GSON.toJson(object));
    }

    private static void error(HttpExchange httpExchange, int n, String string) throws IOException {
        JsonObject jsonObject = new JsonObject();
        jsonObject.addProperty("error", string);
        App.sendJson(httpExchange, n, jsonObject);
    }

    private static void send(HttpExchange httpExchange, int n, String string, String string2) throws IOException {
        byte[] byArray = string2.getBytes(StandardCharsets.UTF_8);
        httpExchange.getResponseHeaders().set("Content-Type", string);
        App.cors(httpExchange.getResponseHeaders());
        if (n == 204) {
            httpExchange.sendResponseHeaders(204, -1L);
            httpExchange.close();
            return;
        }
        httpExchange.sendResponseHeaders(n, byArray.length);
        try (OutputStream outputStream = httpExchange.getResponseBody();){
            outputStream.write(byArray);
        }
    }

    private static void cors(Headers headers) {
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Access-Control-Allow-Headers", "Content-Type");
        headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    }

    private static String mime(String string) {
        String string2 = string.toLowerCase();
        if (string2.endsWith(".html")) {
            return "text/html; charset=utf-8";
        }
        if (string2.endsWith(".css")) {
            return "text/css; charset=utf-8";
        }
        if (string2.endsWith(".js")) {
            return "application/javascript; charset=utf-8";
        }
        if (string2.endsWith(".json")) {
            return "application/json; charset=utf-8";
        }
        if (string2.endsWith(".png")) {
            return "image/png";
        }
        if (string2.endsWith(".jpg") || string2.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (string2.endsWith(".webp")) {
            return "image/webp";
        }
        if (string2.endsWith(".gif")) {
            return "image/gif";
        }
        if (string2.endsWith(".svg")) {
            return "image/svg+xml";
        }
        return "application/octet-stream";
    }
}
