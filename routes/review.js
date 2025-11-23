
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getProductReviews,
  getSellerReviews,
  addOrUpdateReview,
  deleteReview,
} = require("../controllers/reviewController");

router.get("/:productId", getProductReviews);
router.get("/", protect, getSellerReviews);
router.post("/:productId", protect, addOrUpdateReview);
router.delete("/:reviewId", protect, deleteReview);

module.exports = router;
