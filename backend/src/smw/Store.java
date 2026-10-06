package smw;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/** Saves products, festival offers and ads in data/catalog.json */
final class Store {
  private final Path catalogFile;
  private final Path configFile;
  private final Gson gson = new GsonBuilder().setPrettyPrinting().create();
  private JsonObject catalog;
  private String password;

  Store(Path root) throws Exception {
    Path data = root.resolve("data");
    Files.createDirectories(data);
    Files.createDirectories(root.resolve("public").resolve("uploads"));
    catalogFile = data.resolve("catalog.json");
    configFile = data.resolve("admin-config.json");
    if (Files.exists(catalogFile)) {
      catalog = gson.fromJson(Files.readString(catalogFile, StandardCharsets.UTF_8), JsonObject.class);
    } else {
      catalog = new JsonObject();
      catalog.add("products", new JsonArray());
      catalog.add("offers", new JsonArray());
      catalog.add("ads", new JsonArray());
      save();
    }
    ensureArray("products");
    ensureArray("offers");
    ensureArray("ads");
    ensureArray("gallery");
    seedGallery();
    if (Files.exists(configFile)) {
      JsonObject cfg = gson.fromJson(Files.readString(configFile, StandardCharsets.UTF_8), JsonObject.class);
      password = cfg.get("password").getAsString();
    } else {
      password = "sujal123";
      JsonObject cfg = new JsonObject();
      cfg.addProperty("password", password);
      Files.writeString(configFile, gson.toJson(cfg), StandardCharsets.UTF_8);
    }
  }

  synchronized JsonObject catalog() {
    return catalog;
  }

  String password() {
    return password;
  }

  synchronized void save() throws Exception {
    Files.writeString(catalogFile, gson.toJson(catalog), StandardCharsets.UTF_8);
  }

  synchronized JsonObject addProduct(JsonObject p) throws Exception {
    catalog.getAsJsonArray("products").add(p);
    save();
    return p;
  }

  synchronized boolean updateProduct(String id, JsonObject patch) throws Exception {
    JsonArray arr = catalog.getAsJsonArray("products");
    for (int i = 0; i < arr.size(); i++) {
      JsonObject p = arr.get(i).getAsJsonObject();
      if (id.equals(p.get("id").getAsString())) {
        if (patch.has("name")) p.addProperty("name", patch.get("name").getAsString());
        if (patch.has("price")) p.addProperty("price", patch.get("price").getAsDouble());
        if (patch.has("unit")) p.addProperty("unit", patch.get("unit").getAsString());
        if (patch.has("category")) p.addProperty("category", patch.get("category").getAsString());
        if (patch.has("desc")) p.addProperty("desc", patch.get("desc").getAsString());
        if (patch.has("available")) p.addProperty("available", patch.get("available").getAsBoolean());
        if (patch.has("image")) p.addProperty("image", patch.get("image").getAsString());
        if (patch.has("qty")) p.add("qty", patch.get("qty"));
        if (patch.has("defaultQty")) p.addProperty("defaultQty", patch.get("defaultQty").getAsString());
        save();
        return true;
      }
    }
    return false;
  }

  synchronized boolean deleteProduct(String id) throws Exception {
    JsonArray arr = catalog.getAsJsonArray("products");
    for (int i = 0; i < arr.size(); i++) {
      if (id.equals(arr.get(i).getAsJsonObject().get("id").getAsString())) {
        arr.remove(i);
        save();
        return true;
      }
    }
    return false;
  }

  synchronized JsonObject addOffer(JsonObject o) throws Exception {
    catalog.getAsJsonArray("offers").add(o);
    save();
    return o;
  }

  synchronized boolean updateOffer(String id, JsonObject patch) throws Exception {
    return patchItem("offers", id, patch);
  }

  synchronized boolean deleteOffer(String id) throws Exception {
    return deleteItem("offers", id);
  }

  synchronized JsonObject addAd(JsonObject a) throws Exception {
    catalog.getAsJsonArray("ads").add(a);
    save();
    return a;
  }

  synchronized boolean updateAd(String id, JsonObject patch) throws Exception {
    return patchItem("ads", id, patch);
  }

  synchronized boolean deleteAd(String id) throws Exception {
    return deleteItem("ads", id);
  }

  synchronized JsonObject addGallery(JsonObject g) throws Exception {
    catalog.getAsJsonArray("gallery").add(g);
    save();
    return g;
  }

  synchronized boolean updateGallery(String id, JsonObject patch) throws Exception {
    return patchItem("gallery", id, patch);
  }

  synchronized boolean deleteGallery(String id) throws Exception {
    return deleteItem("gallery", id);
  }

  private void seedGallery() throws Exception {
    JsonArray arr = catalog.getAsJsonArray("gallery");
    if (arr.size() > 0) return;
    String[][] rows = {
      {"public/mithai/peda.png", "Medium Range", "Peda"},
      {"public/mithai/milkcake.png", "Medium Range", "Milkcake"},
      {"public/mithai/gujia.png", "Festival", "Gujia"},
      {"public/mithai/soan-papdi.png", "Medium Range", "Soan Papdi"},
      {"public/mithai/punjabi-pinni.png", "Medium Range", "Punjabi Pinni"},
      {"public/dryfruit/kaju-katli.png", "Dry Fruit", "Kaju Katli"},
      {"public/dryfruit/pista-bite.png", "Dry Fruit", "Pista Bite"},
      {"public/dryfruit/kaju-kalash.png", "Kaju Specials", "Kaju Kalash"},
      {"public/mithai/khoya-apple.png", "Festival", "Khoya Apple"},
      {"public/laddoo/special-motichoor-laddoo.png", "Special Laddoo", "Motichoor Laddoo"},
      {"public/bengali/rasmalai.png", "Bengali Sweets", "Rasmalai"},
      {"public/bengali/cham-cham.png", "Bengali Sweets", "Cham-cham"}
    };
    for (String[] row : rows) {
      JsonObject o = new JsonObject();
      o.addProperty("id", newId("gal"));
      o.addProperty("image", row[0]);
      o.addProperty("tag", row[1]);
      o.addProperty("label", row[2]);
      arr.add(o);
    }
    save();
  }

  static String newId(String prefix) {
    return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
  }

  static String slug(String name) {
    String s = name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    if (s.isBlank()) s = "item";
    return s + "-" + UUID.randomUUID().toString().substring(0, 4);
  }

  private void ensureArray(String key) {
    if (!catalog.has(key) || !catalog.get(key).isJsonArray()) {
      catalog.add(key, new JsonArray());
    }
  }

  private boolean patchItem(String key, String id, JsonObject patch) throws Exception {
    JsonArray arr = catalog.getAsJsonArray(key);
    for (int i = 0; i < arr.size(); i++) {
      JsonObject o = arr.get(i).getAsJsonObject();
      if (id.equals(o.get("id").getAsString())) {
        patch.entrySet().forEach(e -> o.add(e.getKey(), e.getValue()));
        save();
        return true;
      }
    }
    return false;
  }

  private boolean deleteItem(String key, String id) throws Exception {
    JsonArray arr = catalog.getAsJsonArray(key);
    for (int i = 0; i < arr.size(); i++) {
      if (id.equals(arr.get(i).getAsJsonObject().get("id").getAsString())) {
        arr.remove(i);
        save();
        return true;
      }
    }
    return false;
  }
}
