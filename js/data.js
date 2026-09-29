/* ============================================================
   DATA FILE — js/data.js
   Used by: every HTML page (index, mithai, about, why, gallery,
   visit, contact, dry-fruit, kaju-specials, medium-range,
   special-laddoo, bengali)
   Holds: WhatsApp number, address, product list, gallery photos
   ============================================================ */

window.SMW = window.SMW || {};

SMW.WHATSAPP = "919305965609";
SMW.PHONE = "+91 93059 65609";
SMW.EMAIL = "sujalmithaiwale@gmail.com";
SMW.ADDRESS =
  "Infront of Kanji House, Tehsil Road, Churkhibal, Jalaun, Uttar Pradesh 285123";
SMW.MAP_LAT = 26.1398853;
SMW.MAP_LNG = 79.3349695;
SMW.MAPS = "https://maps.app.goo.gl/UubJ5SHTrGxJbjnBA";
SMW.MAP_EMBED =
  "https://maps.google.com/maps?cid=11600620089420313159&z=17&hl=en&output=embed";
SMW.FREE_DELIVERY_MIN = 200;
SMW.FREE_DELIVERY_KM = 20;
SMW.FREE_DELIVERY =
  "🎉 FREE DELIVERY — Get free delivery on orders of ₹200 or more within a 20 KM range.";

SMW.kgQty = ["250 g", "500 g", "750 g", "1 kg", "1.5 kg", "2 kg", "3 kg", "5 kg"];
SMW.pieceQty = ["1 piece", "2 pieces", "4 pieces", "6 pieces", "12 pieces"];
SMW.bowlQty = ["1 bowl", "2 bowls", "4 bowls", "6 bowls"];

SMW.categories = [
  "All",
  "Dry Fruit Sweets",
  "Kaju Specials",
  "Medium Range",
  "Special Laddoo",
  "Bengali Sweets",
];

const dry = (file) => `public/dryfruit/${file}?v=2`;
const mid = (file) => `public/mithai/${file}?v=2`;
const ben = (file) => `public/bengali/${file}?v=2`;
const lad = (file) => `public/laddoo/${file}?v=2`;

function sweet(id, name, price, category, image, desc, extra = {}) {
  return {
    id,
    name,
    price,
    unit: "kg",
    qty: SMW.kgQty,
    defaultQty: "500 g",
    category,
    image,
    desc,
    available: true,
    ...extra,
  };
}

const DRY = 1200;
const MID = 500;

SMW.products = [
  sweet("kaju-katli", "Kaju Katli", DRY, "Dry Fruit Sweets", dry("kaju-katli.png"), "Silver-leaf cashew diamonds, premium dry-fruit mithai.", { bestseller: true, festive: true }),
  sweet("gulab-katli", "Gulab Katli", DRY, "Dry Fruit Sweets", dry("gulab-katli.png"), "Rose-scented cashew katli with a soft melt.", { festive: true }),
  sweet("khajoor-roll", "Khajoor Roll", DRY, "Dry Fruit Sweets", dry("khajoor-roll.png"), "Date-and-nut rolls, naturally sweet and rich."),
  sweet("anjeer-roll", "Anjeer Roll", DRY, "Dry Fruit Sweets", dry("anjeer-roll.png"), "Fig rolls bound with cashew and almonds."),
  sweet("dry-fruit-laddoo", "Dry Fruit Laddoo", DRY, "Dry Fruit Sweets", dry("dry-fruit-laddoo.png"), "Energy ladoo packed with mixed mewa.", { bestseller: true }),
  sweet("khajoor-laddoo", "Khajoor Laddoo", DRY, "Dry Fruit Sweets", dry("khajoor-laddoo.png"), "Date ladoo with chopped nuts, no extra sugar rush."),
  sweet("mewa-bite", "Mewa Bite", DRY, "Dry Fruit Sweets", dry("mewa-bite.png"), "Small mixed-nut bites for gifting and snacking."),
  sweet("pista-bite", "Pista Bite", DRY, "Dry Fruit Sweets", dry("pista-bite.png"), "Bright pistachio cubes with crushed pista topping."),
  sweet("kaju-gulab", "Kaju Gulab", DRY, "Dry Fruit Sweets", dry("kaju-gulab.png"), "Cashew roses — festive, handmade, premium."),

  sweet("kaju-kamal", "Kaju Kamal", DRY, "Kaju Specials", dry("kaju-kamal.png"), "Lotus-shaped cashew mithai, made for celebrations.", { festive: true }),
  sweet("kaju-boat", "Kaju Boat", DRY, "Kaju Specials", dry("kaju-boat.png"), "Boat-shaped kaju cups filled with dry fruits."),
  sweet("kaju-basket", "Kaju Basket", DRY, "Kaju Specials", dry("kaju-basket.png"), "Tiny cashew baskets loaded with mewa."),
  sweet("kaju-keshar-bati", "Kaju Keshar Bati", DRY, "Kaju Specials", dry("kaju-keshar-bati.png"), "Saffron kaju cups, rich and aromatic."),
  sweet("kaju-mukut", "Kaju Mukut", DRY, "Kaju Specials", dry("kaju-mukut.png"), "Crown-shaped cashew sweets for festive thalis."),
  sweet("kaju-paan", "Kaju Paan", DRY, "Kaju Specials", dry("kaju-paan.png"), "Paan-shaped kaju with a silver-leaf finish."),
  sweet("anjeer-barfi", "Anjeer Barfi", DRY, "Kaju Specials", dry("anjeer-barfi.png"), "Fig barfi layered with cashew — premium dry fruit."),
  sweet("kaju-gilori", "Kaju Gilori", DRY, "Kaju Specials", dry("kaju-gilori.png"), "Triangular kaju gilori, stuffed and folded by hand."),
  sweet("kaju-kalash", "Kaju Kalash", DRY, "Kaju Specials", dry("kaju-kalash.png"), "Kalash-shaped cashew mithai for puja and gifts."),
  sweet("pista-roll", "Pista Roll", DRY, "Kaju Specials", dry("pista-roll.png"), "Soft pistachio rolls with a cashew wrap.", { bestseller: true }),

  sweet("badam-barfi", "Badam Barfi", MID, "Medium Range", mid("badam-barfi.png"), "Classic almond barfi, everyday premium taste.", { bestseller: true }),
  sweet("punjabi-barfi", "Punjabi Barfi", MID, "Medium Range", mid("punjabi-barfi.png"), "Grainy desi barfi from slow-cooked khoya."),
  sweet("butter-scotch-barfi", "Butter Scotch Barfi", MID, "Medium Range", mid("butter-scotch-barfi.png"), "Caramel-note barfi with a buttery finish."),
  sweet("dodha-barfi", "Dodha Barfi", MID, "Medium Range", mid("dodha-barfi.png"), "Dark, caramelised dodha — a Punjabi favourite."),
  sweet("sev-barfi", "Sev Barfi", MID, "Medium Range", mid("sev-barfi.png"), "Soft barfi topped with crisp sweet sev."),
  sweet("besan-barfi", "Besan Barfi", MID, "Medium Range", mid("besan-barfi.png"), "Roasted gram-flour barfi with ghee aroma."),
  sweet("lockey-barfi", "Lockey Barfi", MID, "Medium Range", mid("lockey-barfi.png"), "Lokey / lucky barfi — festive tray favourite."),
  sweet("gulkand-barfi", "Gulkand Barfi", MID, "Medium Range", mid("gulkand-barfi.png"), "Rose-petal gulkand folded into milk barfi."),
  sweet("milkcake", "Milkcake", MID, "Medium Range", mid("milkcake.png"), "Grainy milk cake from reduced full-cream milk.", { bestseller: true }),
  sweet("motikand", "Motikand", MID, "Medium Range", mid("motikand.png"), "Soft motikand squares, mildly sweet."),
  sweet("kalakand", "Kalakand", MID, "Medium Range", mid("kalakand.png"), "Fresh kalakand, set daily in the kadhai."),
  sweet("choorma-laddoo", "Choorma Laddoo", MID, "Medium Range", mid("choorma-laddoo.png"), "Wheat choorma ladoo with ghee and cardamom."),
  sweet("gond-laddoo", "Gond Laddoo", MID, "Medium Range", mid("gond-laddoo.png"), "Winter gond ladoo with nuts and gond crystals."),
  sweet("burada-laddoo", "Burada Laddoo", MID, "Medium Range", mid("burada-laddoo.png"), "Mawa boora ladoo, melt-in-mouth."),
  sweet("gari-lachcha-laddoo", "Gari Lachcha Laddoo", MID, "Medium Range", mid("gari-lachcha-laddoo.png"), "Coconut lachcha ladoo, fragrant and light."),
  sweet("mugdal", "Mugdal", MID, "Medium Range", mid("mugdal.png"), "Moongdal mithai, roasted and set in trays."),
  sweet("alsi-ka-laddoo", "Alsi ka Laddoo", MID, "Medium Range", mid("alsi-ka-laddoo.png"), "Flaxseed ladoo — traditional and wholesome."),
  sweet("till-ka-laddoo", "Till ka Laddoo", MID, "Medium Range", mid("till-ka-laddoo.png"), "Sesame ladoo with jaggery warmth."),
  sweet("daal-ka-laddoo", "Daal ka Laddoo", MID, "Medium Range", mid("daal-ka-laddoo.png"), "Lentil ladoo, roasted dal and ghee."),
  sweet("punjabi-pinni", "Punjabi Pinni", MID, "Medium Range", mid("punjabi-pinni.png"), "Atta-ghee pinni, a winter classic.", { festive: true }),
  sweet("patisa", "Patisa", MID, "Medium Range", mid("patisa.png"), "Flaky patisa / soan-style layers."),
  sweet("soan-papdi", "Soan Papdi", MID, "Medium Range", mid("soan-papdi.png"), "Feather-light soan papdi with pistachio."),
  sweet("khoya-kaju-roll", "Khoya Kaju Roll", MID, "Medium Range", mid("khoya-kaju-roll.png"), "Khoya rolls with a cashew centre."),
  sweet("khoya-kalash", "Khoya Kalash", MID, "Medium Range", mid("khoya-kalash.png"), "Kalash-shaped khoya mithai for the festive thali.", { festive: true }),
  sweet("khoya-gilori", "Khoya Gilori", MID, "Medium Range", mid("khoya-gilori.png"), "Folded khoya gilori, stuffed and sealed."),
  sweet("khoya-strawberry", "Khoya Strawberry", MID, "Medium Range", mid("khoya-strawberry.png"), "Strawberry-shaped khoya, fun and festive."),
  sweet("khoya-apple", "Khoya Apple", MID, "Medium Range", mid("khoya-apple.png"), "Apple-shaped khoya mithai with a pistachio stem."),
  sweet("kheer-kadam", "Kheer Kadam", MID, "Medium Range", mid("kheer-kadam.png"), "Rasgulla core wrapped in flavoured kheer coat."),
  sweet("gujia", "Gujia", MID, "Medium Range", mid("gujia.png"), "Mawa gujiya, crisp shell and rich filling.", { festive: true }),
  sweet("peda", "Peda", MID, "Medium Range", mid("peda.png"), "Fresh mawa peda with pistachio, rolled daily.", { bestseller: true }),
  sweet("khova-mewa-roll", "Khova Mewa Roll", MID, "Medium Range", mid("khova-mewa-roll.png"), "Khoya roll stuffed with mixed dry fruits."),
  sweet("yellow-cutlus", "Yellow Cutlus", MID, "Medium Range", mid("yellow-cutlus.png"), "Bright yellow cutlus — house special at ₹500/kg."),

  sweet("special-motichoor-laddoo", "Special Motichoor Laddoo", 180, "Special Laddoo", lad("special-motichoor-laddoo.png"), "Fine boondi motichoor ladoo, festive favourite.", { bestseller: true, festive: true }),
  sweet("besan-suddh-desi-ghee-laddoo", "Besan ka Suddh Desi Ghee Laddoo", 400, "Special Laddoo", lad("besan-suddh-desi-ghee-laddoo.png"), "Roasted besan ladoo made in pure desi ghee.", { bestseller: true }),
  sweet("marwadi-laddoo", "Marwadi Laddoo", 240, "Special Laddoo", lad("marwadi-laddoo.png"), "Traditional Marwadi ladoo, rich and grainy."),

  sweet("cham-cham", "Cham-cham", 500, "Bengali Sweets", ben("cham-cham.png"), "Soft chena cham-cham soaked in light syrup."),
  sweet("chena-toast", "Chena Toast", 500, "Bengali Sweets", ben("chena-toast.png"), "Toasted chena slices, mildly sweet."),
  sweet("chena-sandwich", "Chena Sandwich", 500, "Bengali Sweets", ben("chena-sandwich.png"), "Layered chena sandwich, Bengali-style."),
  {
    id: "chena-malai-roll",
    name: "Chena Malai Roll",
    price: 40,
    unit: "piece",
    qty: SMW.pieceQty,
    defaultQty: "1 piece",
    category: "Bengali Sweets",
    image: ben("chena-malai-roll.png"),
    desc: "Malai-wrapped chena roll, ₹40 per piece.",
    available: true,
    bestseller: true,
  },
  {
    id: "keshar-bhog",
    name: "Keshar Bhog",
    price: 50,
    unit: "piece",
    qty: SMW.pieceQty,
    defaultQty: "1 piece",
    category: "Bengali Sweets",
    image: ben("keshar-bhog.png"),
    desc: "Saffron-soaked bhog, ₹50 per piece.",
    available: true,
    festive: true,
  },
  {
    id: "raj-bhog",
    name: "Raj Bhog",
    price: 30,
    unit: "piece",
    qty: SMW.pieceQty,
    defaultQty: "1 piece",
    category: "Bengali Sweets",
    image: ben("raj-bhog.png"),
    desc: "Royal rasgulla-style raj bhog, ₹30 per piece.",
    available: true,
  },
  {
    id: "rasmalai",
    name: "Rasmalai",
    price: 40,
    unit: "bowl",
    qty: SMW.bowlQty,
    defaultQty: "1 bowl",
    category: "Bengali Sweets",
    image: ben("rasmalai.png"),
    desc: "Chena patties in saffron milk, ₹40 per bowl.",
    available: true,
    bestseller: true,
  },
  sweet("rabdi", "Rabdi", 500, "Bengali Sweets", ben("rabdi.png"), "Slow-reduced rabdi, thick and creamy."),
  sweet("angori-chena", "Angori Chena", 400, "Bengali Sweets", ben("angori-chena.png"), "Grape-sized chena balls in light syrup."),
  {
    id: "gulab-jamun",
    name: "Gulab Jamun",
    price: 20,
    unit: "piece",
    qty: SMW.pieceQty,
    defaultQty: "1 piece",
    category: "Bengali Sweets",
    image: ben("gulab-jamun.png"),
    desc: "Soft gulab jamun, ₹20 per piece.",
    available: true,
    bestseller: true,
  },
  sweet("maal-pua", "Maal Pua", 400, "Bengali Sweets", ben("maal-pua.png"), "Crisp-edged malpua, soaked just right."),
  sweet("mini-gulab-jamun", "Mini Gulab Jamun", 360, "Bengali Sweets", ben("mini-gulab-jamun.png"), "Bite-size jamuns, ₹360 per kg."),
];

SMW.festiveIds = [
  "kaju-katli",
  "kaju-kamal",
  "pista-roll",
  "dry-fruit-laddoo",
  "gujia",
  "khoya-kalash",
  "punjabi-pinni",
  "peda",
  "special-motichoor-laddoo",
  "keshar-bhog",
  "rasmalai",
];

SMW.gallery = [
  { src: mid("peda.png"), tag: "Medium Range", label: "Peda" },
  { src: mid("milkcake.png"), tag: "Medium Range", label: "Milkcake" },
  { src: mid("gujia.png"), tag: "Festival", label: "Gujia" },
  { src: mid("soan-papdi.png"), tag: "Medium Range", label: "Soan Papdi" },
  { src: mid("punjabi-pinni.png"), tag: "Medium Range", label: "Punjabi Pinni" },
  { src: dry("kaju-katli.png"), tag: "Dry Fruit", label: "Kaju Katli" },
  { src: dry("pista-bite.png"), tag: "Dry Fruit", label: "Pista Bite" },
  { src: dry("kaju-kalash.png"), tag: "Kaju Specials", label: "Kaju Kalash" },
  { src: mid("khoya-apple.png"), tag: "Festival", label: "Khoya Apple" },
  { src: lad("special-motichoor-laddoo.png"), tag: "Special Laddoo", label: "Motichoor Laddoo" },
  { src: ben("rasmalai.png"), tag: "Bengali Sweets", label: "Rasmalai" },
  { src: ben("cham-cham.png"), tag: "Bengali Sweets", label: "Cham-cham" },
];

SMW.galleryFilters = [
  "All",
  "Medium Range",
  "Dry Fruit",
  "Kaju Specials",
  "Special Laddoo",
  "Bengali Sweets",
  "Festival",
];
