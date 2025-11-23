
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  registerSeller,
  loginSeller,
  getMyProfile,
  updateMyProfile,
  getMyProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getMyOrders,
  updateOrderStatus,
  getEarnings,
  getReviews,
  getNotifications,
  getSellerDashboard,
  deleteSellerAccount,
  getSellerOrders,
} = require("../controllers/sellerController");

// 🧾 Seller Auth
router.post("/register", registerSeller);
router.post("/login", loginSeller);

// 👤 Seller Profile
router.get("/profile", protect, authorizeRoles("seller"), getMyProfile);
router.put("/profile", protect, authorizeRoles("seller"), upload.single("profileImage"), updateMyProfile);

// 🛍️ Product Management
router.get("/my-products", protect, authorizeRoles("seller"), getMyProducts);
router.post("/add-product", protect, authorizeRoles("seller"), upload.array("images", 5), addProduct);
router.put("/product/:id", protect, authorizeRoles("seller"), upload.array("images", 5), updateProduct);
router.delete("/product/:id", protect, authorizeRoles("seller"), deleteProduct);

// 📦 Order Management
router.get("/seller/my-orders", protect, authorizeRoles("seller"), getSellerOrders);
router.get("/my-orders", protect, authorizeRoles("seller"), getMyOrders);
router.put("/orders/:id/status", protect, authorizeRoles("seller"), updateOrderStatus);

// 💰 Earnings & Payments
router.get("/earnings", protect, authorizeRoles("seller"), getEarnings);

// ⭐ Reviews & Ratings
router.get("/reviews", protect, authorizeRoles("seller"), getReviews);

// 🔔 Notifications
router.get("/notifications", protect, authorizeRoles("seller"), getNotifications);

// 🏠 Seller Dashboard
router.get("/dashboard", protect, authorizeRoles("seller"), getSellerDashboard);

router.delete("/delete", protect, authorizeRoles("seller"), deleteSellerAccount);


module.exports = router;

