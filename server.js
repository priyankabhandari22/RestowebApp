import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Order from "./models/Order.js";
import User from "./models/User.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const mealDbBaseUrl = process.env.THEMEALDB_BASE_URL || "https://www.themealdb.com/api/json/v1/1";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");
const distIndexPath = path.join(distPath, "index.html");

app.use(cors());
app.use(express.json());

const menuCache = {
  items: [],
  loaded: false,
};

const sampleLetters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

const fallbackMenuItems = [
  {
    id: 1,
    name: "Maggi",
    image: "/images/Maggi.jpg",
    category: "Breakfast",
    price: "25₹",
    description: "Quick noodles served hot and fresh.",
  },
  {
    id: 2,
    name: "Rajma Rice",
    image: "/images/rajmachawal.png",
    category: "Lunch",
    price: "100₹",
    description: "Comforting rajma chawal with a simple homestyle taste.",
  },
  {
    id: 3,
    name: "Paneer Bowl",
    image: "/images/paneer.jpg",
    category: "Dinner",
    price: "500₹",
    description: "Paneer curry with fresh herbs and rich seasoning.",
  },
];

const normalizeThemealDbBaseUrl = (baseUrl) => {
  const trimmedBaseUrl = String(baseUrl || "").trim().replace(/\/+$/, "");

  if (!trimmedBaseUrl) {
    return "https://www.themealdb.com/api/json/v1/1";
  }

  if (trimmedBaseUrl.endsWith("/v1")) {
    return `${trimmedBaseUrl}/1`;
  }

  return trimmedBaseUrl;
};

const normalizedMealDbBaseUrl = normalizeThemealDbBaseUrl(mealDbBaseUrl);

const fixedMenuCategories = ["Lunch", "Evening", "Dinner"];

const mapMealCategoryToBucket = (category, mealName = "") => {
  const value = `${category || ""} ${mealName || ""}`.toLowerCase();

  if (value.includes("breakfast") || value.includes("vegetarian") || value.includes("vegan") || value.includes("starter") || value.includes("side") || value.includes("salad") || value.includes("soup")) {
    return "Lunch";
  }

  if (value.includes("dessert") || value.includes("pasta") || value.includes("miscellaneous") || value.includes("baked")) {
    return "Evening";
  }

  if (value.includes("beef") || value.includes("chicken") || value.includes("lamb") || value.includes("pork") || value.includes("goat") || value.includes("seafood") || value.includes("fish") || value.includes("duck") || value.includes("meat")) {
    return "Dinner";
  }

  return "Dinner";
};

const parsePrice = (price) => Number(String(price).replace(/[^\d]/g, "")) || 0;

const formatPrice = (seed) => {
  const amount = 80 + (seed % 16) * 20;
  return `${amount}₹`;
};

const buildDescription = (meal) => {
  const text = meal.strInstructions || `${meal.strMeal} is a featured dish from our live menu.`;
  return text.replace(/\s+/g, " ").trim().slice(0, 140);
};

const normalizeMeal = (meal) => ({
  id: Number(meal.idMeal),
  name: meal.strMeal,
  image: meal.strMealThumb,
  category: mapMealCategoryToBucket(meal.strCategory, meal.strMeal),
  originalCategory: meal.strCategory || "Specials",
  price: formatPrice(Number(meal.idMeal) || 1),
  description: buildDescription(meal),
});

const fetchMealsByLetter = async (letter) => {
  const response = await fetch(`${normalizedMealDbBaseUrl}/search.php?f=${letter}`);

  if (!response.ok) {
    throw new Error(`TheMealDB request failed for ${letter}`);
  }

  const data = await response.json();
  return Array.isArray(data.meals) ? data.meals : [];
};

const loadMenuCatalog = async () => {
  if (menuCache.loaded && menuCache.items.length > 0) {
    return menuCache.items;
  }

  const responses = await Promise.allSettled(sampleLetters.map((letter) => fetchMealsByLetter(letter)));
  const meals = responses.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const uniqueMeals = Array.from(new Map(meals.map((meal) => [meal.idMeal, meal])).values());

  menuCache.items = uniqueMeals.map(normalizeMeal).filter((item) => item.id && item.name && item.image);
  menuCache.loaded = true;

  return menuCache.items;
};

const connectMongo = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.includes("<username>") || mongoUri.includes("<password>") || mongoUri.includes("<cluster>")) {
    console.warn("MONGODB_URI is not set. Order saving will be disabled until you add it to .env.");
    return;
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "restowebapp-api" });
});

app.get("/api/menu", async (req, res) => {
  try {
    let items = await loadMenuCatalog();

    if (!items || items.length === 0) {
      items = fallbackMenuItems;
    }

    const query = String(req.query.search || "").trim().toLowerCase();
    const category = String(req.query.category || "All");

    const filteredItems = items.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesSearch = !query || item.name.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });

    const categories = ["All", ...new Set(items.map((item) => item.category))];

    res.json({
      source: "themealdb",
      items: filteredItems,
      categories: ["All", ...fixedMenuCategories],
      fallback: items === fallbackMenuItems,
    });
  } catch (error) {
    res.json({
      source: "fallback",
      items: fallbackMenuItems,
      categories: ["All", ...fixedMenuCategories],
      fallback: true,
      warning: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "MongoDB is not connected. Add MONGODB_URI to your .env file.",
      });
    }

    const { customer, items, totals, paymentMethod } = req.body || {};

    if (!customer?.fullName || !customer?.phone || !customer?.address || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Customer details and at least one order item are required.",
      });
    }

    const user = await User.findOneAndUpdate(
      { phone: customer.phone },
      {
        fullName: customer.fullName,
        phone: customer.phone,
        address: customer.address,
        landmark: customer.landmark || "",
        deliveryTime: customer.deliveryTime || "asap",
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    const normalizedItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      image: item.image,
      price: parsePrice(item.price),
      quantity: Number(item.quantity) || 1,
    }));

    const order = await Order.create({
      user: user._id,
      items: normalizedItems,
      totals: {
        subtotal: Number(totals?.subtotal) || 0,
        deliveryFee: Number(totals?.deliveryFee) || 0,
        tax: Number(totals?.tax) || 0,
        total: Number(totals?.total) || 0,
      },
      paymentMethod: paymentMethod || "upi-card",
      status: "received",
    }).then((savedOrder) => savedOrder.populate("user"));

    res.status(201).json({
      message: "Order saved successfully.",
      orderId: order._id,
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to save the order.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/orders", async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "MongoDB is not connected.",
      });
    }

    const orders = await Order.find().populate("user").sort({ createdAt: -1 }).limit(20);
    res.json({ orders });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load orders.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/users", async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "MongoDB is not connected.",
      });
    }

    const users = await User.find().sort({ createdAt: -1 }).limit(20);
    res.json({ users });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load users.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

if (fs.existsSync(distIndexPath)) {
  app.use(express.static(distPath));

  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(distIndexPath);
  });
}

const startServer = async () => {
  await connectMongo().catch((error) => {
    console.warn(error instanceof Error ? error.message : error);
  });

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
};

startServer();
