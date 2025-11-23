
const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

// All routes require auth
router.get("/", protect, getCart);
router.post("/add", protect, addToCart);           // ✅ Add to cart
router.put("/:productId", protect, updateQuantity);    // ✅ Update quantity
router.delete("/:productId", protect, removeFromCart);
router.delete("/", protect, clearCart);

module.exports = router;
