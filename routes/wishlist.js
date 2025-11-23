const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
} = require("../controllers/wishlistController");

// Get user's wishlist
router.get("/", protect, getWishlist);

// Add to wishlist
router.post("/", protect, addToWishlist);

// Remove item
router.delete("/:productId", protect, removeFromWishlist);

module.exports = router;
