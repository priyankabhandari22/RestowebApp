import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { fileURLToPath } from "url";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import trackingRoutes from "./routes/trackingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import jwt from "jsonwebtoken";
import DeliveryAgent from "./models/DeliveryAgent.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;
const indianApiUrl = (process.env.INDIAN_RECIPE_API_URL || "http://localhost:3001").replace(/\/+$/, "");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "..", "frontend", "dist");
const distIndexPath = path.join(distPath, "index.html");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = new SocketIOServer(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", methods: ["GET", "POST"] },
});
app.set("io", io);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
      socket.userId = decoded.id;
    } catch {
      // allow connection without user identity
    }
  }
  next();
});

io.on("connection", (socket) => {
  socket.on("join-order", (orderId) => {
    socket.join(`order_${orderId}`);
  });

  socket.on("leave-order", (orderId) => {
    socket.leave(`order_${orderId}`);
  });

  socket.on("agent-location-update", async (data) => {
    const { orderId, latitude, longitude } = data;
    io.to(`order_${orderId}`).emit("rider-location", { latitude, longitude, timestamp: new Date() });
  });

  socket.on("disconnect", () => {});
});

const menuCache = { items: [], loaded: false };

const fallbackMenuItems = [
  { id: 1, name: "Maggi", image: "/images/Maggi.jpg", category: "Breakfast", price: "25₹", description: "Quick noodles served hot and fresh." },
  { id: 2, name: "Rajma Rice", image: "/images/rajmachawal.png", category: "Lunch", price: "100₹", description: "Comforting rajma chawal with a simple homestyle taste." },
  { id: 3, name: "Paneer Bowl", image: "/images/paneer.jpg", category: "Dinner", price: "500₹", description: "Paneer curry with fresh herbs and rich seasoning." },
];

const fixedMenuCategories = ["Lunch", "Evening", "Dinner"];

const mapCourseToBucket = (course) => {
  const value = (course || "").toLowerCase();
  if (value.includes("breakfast") || value.includes("brunch") || value.includes("lunch") || value.includes("main course") || value.includes("one pot") || value.includes("vegetarian")) return "Lunch";
  if (value.includes("side") || value.includes("snack") || value.includes("dessert") || value.includes("appetizer") || value.includes("starter")) return "Evening";
  return "Dinner";
};

const formatPrice = (seed) => `${80 + (seed % 16) * 20}₹`;

const buildDescription = (recipe) => {
  const text = recipe.TranslatedInstructions || recipe.Instructions || `${recipe.TranslatedRecipeName || recipe.RecipeName} is a featured dish from our live menu.`;
  return text.replace(/\s+/g, " ").trim().slice(0, 140);
};

const normalizeRecipe = (recipe) => ({
  id: Number(recipe.id),
  name: recipe.TranslatedRecipeName || recipe.RecipeName,
  image: recipe.ImageURL || "",
  category: mapCourseToBucket(recipe.Course),
  originalCategory: recipe.Course || "Specials",
  price: formatPrice(Number(recipe.id) || 1),
  description: buildDescription(recipe),
});

const fetchWithRetry = async (url, retries = 3, timeoutMs = 8000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
};

const loadMenuFromCSV = () => {
  const jsonPath = path.join(__dirname, "menu-items.json");
  if (!fs.existsSync(jsonPath)) { console.warn("Menu JSON not found at", jsonPath); return []; }
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    if (Array.isArray(data) && data.length > 0) {
      console.log(`Loaded ${data.length} items from menu-items.json.`);
      return data;
    }
  } catch (e) { console.warn("Failed to parse menu JSON:", e.message); }
  return [];
};

const CSVLoadedItems = loadMenuFromCSV();

const COURSES_TO_FETCH = ["Lunch", "Dinner", "Snack", "Dessert", "Side Dish", "Appetizer", "South Indian Breakfast", "North Indian Breakfast", "World Breakfast", "Indian Breakfast"];
const RECIPES_PER_COURSE = 15;

const fetchCourseRecipes = async (course) => {
  try {
    const data = await fetchWithRetry(`${indianApiUrl}/recipes?course=${encodeURIComponent(course)}&limit=${RECIPES_PER_COURSE}`);
    return Array.isArray(data.recipes) ? data.recipes : [];
  } catch { return []; }
};

const loadMenuCatalog = async () => {
  if (menuCache.loaded && menuCache.items.length > 0) return menuCache.items;
  console.log("Fetching recipes from Indian Recipe API...");
  const responses = await Promise.allSettled(COURSES_TO_FETCH.map((course) => fetchCourseRecipes(course)));
  const recipes = responses.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  if (recipes.length > 0) {
    console.log(`Fetched ${recipes.length} recipes from Indian API.`);
    const uniqueRecipes = Array.from(new Map(recipes.map((r) => [r.id, r])).values());
    menuCache.items = uniqueRecipes.map(normalizeRecipe).filter((item) => item.id && item.name);
    menuCache.loaded = true;
    console.log(`Menu catalog initialized with ${menuCache.items.length} Indian dishes.`);
    return menuCache.items;
  }
  if (CSVLoadedItems.length > 0) {
    console.warn("Indian API unreachable — using CSV fallback.");
    menuCache.items = CSVLoadedItems;
    menuCache.loaded = true;
    return menuCache.items;
  }
  console.warn("No recipes fetched from Indian API or CSV.");
  return [];
};

setInterval(async () => { if (menuCache.loaded) { menuCache.loaded = false; await loadMenuCatalog().catch(() => {}); } }, 300000);

const connectMongo = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || mongoUri.includes("<username>") || mongoUri.includes("<password>") || mongoUri.includes("<cluster>")) {
    console.warn("MONGODB_URI is not set. Order saving will be disabled.");
    return;
  }
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");
};

app.get("/", (_req, res) => { res.json({ success: true, message: "RestoWeb API is running" }); });

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (_req, res) => {
  const src = menuCache.loaded && menuCache.items.length > 0
    ? (menuCache.items === CSVLoadedItems ? "csv" : "indian")
    : "fallback";
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    menuSource: src,
    menuCount: menuCache.items.length || fallbackMenuItems.length,
  });
});

app.get("/api/menu", async (req, res) => {
  try {
    let items = await loadMenuCatalog();
    if (!items || items.length === 0) items = fallbackMenuItems;
    const query = String(req.query.search || "").trim().toLowerCase();
    const category = String(req.query.category || "All");
    const filteredItems = items.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesSearch = !query || item.name.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
    const source = items === fallbackMenuItems ? "fallback" : (items === CSVLoadedItems ? "csv" : "indian");
    res.json({ source, items: filteredItems, categories: ["All", ...fixedMenuCategories], fallback: items === fallbackMenuItems });
  } catch (error) {
    res.json({ source: items === fallbackMenuItems ? "fallback" : (items === CSVLoadedItems ? "csv" : "indian"), items: filteredItems, categories: ["All", ...fixedMenuCategories], fallback: items === fallbackMenuItems });
  }
});

if (fs.existsSync(distIndexPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (_req, res) => { res.sendFile(distIndexPath); });
}

const startServer = async () => {
  await connectMongo().catch((error) => { console.warn(error instanceof Error ? error.message : error); });
  server.listen(port, () => { console.log(`Server listening on http://localhost:${port}`); });
};

startServer();
