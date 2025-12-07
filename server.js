const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./config/db");
const nodemailer = require("nodemailer");

// Load env variables
dotenv.config();

// Connect DB
connectDB();

// Stripe
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

// ✅ CORS must come before Helmet and routes
app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://shopverse-frontend-lcwg.onrender.com",
    credentials: true,
  })
);

// ✅ Allow CORS headers globally (for static + API)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CLIENT_URL || "https://shopverse-frontend-lcwg.onrender.com");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// ✅ Important: Helmet should not block cross-origin images
app.use(
  helmet({
    crossOriginResourcePolicy: false, // 👈 allow images to be loaded from other origins
  })
);

app.use(express.json());
app.use(morgan("dev"));

// ✅ Serve uploads with full access (for images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/user"));
app.use("/api/products", require("./routes/product"));
app.use("/api/seller", require("./routes/seller"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/orders", require("./routes/order"));
app.use("/api/chatbot", require("./routes/chatbot"));
app.use("/api/uploads", require("./routes/upload"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/contact", require("./routes/contactRoute"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/reviews", require("./routes/review"));
app.use("/api/notifications", require("./routes/notificationRoutes"));



// Health check
app.get("/api/health", (req, res) => res.json({ status: "OK", uptime: process.uptime() }));

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, "/frontend/build")));
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"))
  );
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res
    .status(err.statusCode || 500)
    .json({ success: false, message: err.message || "Server error" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
