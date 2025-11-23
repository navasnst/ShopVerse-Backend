
const Review = require("../models/Review");
const Product = require("../models/Product");
const { createNotification } = require("./notificationController");


// Get all reviews for seller's products
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Fetch all reviews for this product
    const reviews = await Review.find({ product: productId })
      .populate("user", "name email") // populate user info
      .sort({ createdAt: -1 }); // latest first

    res.json({
      success: true,
      productId: product._id,
      productName: product.title,
      reviews: reviews || [],
    });
  } catch (err) {
    console.error("Error fetching product reviews:", err.message);
    res.status(500).json({
      success: false,
      message: "Error fetching product reviews",
    });
  }
};

// ✅ Get all reviews for seller's products
exports.getSellerReviews = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Get all products for this seller
    const products = await Product.find({ vendor: sellerId });

    const reviewsData = await Promise.all(
      products.map(async (product) => {
        const reviews = await Review.find({ product: product._id })
          .populate("user", "name email")
          .sort({ createdAt: -1 });

        // Calculate average rating
        const averageRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        return {
          productId: product._id,
          productName: product.title,
          averageRating: averageRating.toFixed(1),
          reviews,
        };
      })
    );

    res.json({ success: true, data: reviewsData });
  } catch (err) {
    console.error("Error fetching seller reviews:", err.message);
    res.status(500).json({ success: false, message: "Error fetching seller reviews" });
  }
};

// ✅ Add or update a review
exports.addOrUpdateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let review = await Review.findOne({
      user: req.user.id,
      product: productId
    });

    if (review) {
      review.rating = rating;
      review.comment = comment;
      await review.save();
    } else {
      review = new Review({
        user: req.user.id,
        product: productId,
        rating,
        comment,
      });
      await review.save();
    }

    // ⭐ Recalculate average rating
    const allReviews = await Review.find({ product: productId });

    const avgRating =
      allReviews.reduce((acc, curr) => acc + curr.rating, 0) /
      allReviews.length;

    // ⭐ Save rating + count
    await Product.updateOne(
      { _id: productId },
      {
        rating: avgRating,
        numReviews: allReviews.length,
      },
      { runValidators: false }
    );

    res.status(201).json({
      success: true,
      message: review.isNew ? "Review added" : "Review updated",
      review,
      rating: avgRating,
      numReviews: allReviews.length,
    });
  } catch (err) {
    console.error("Error saving review:", err.message);
    res.status(500).json({ message: "Error saving review" });
  }
};

// ✅ Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOne({
      _id: reviewId,
      user: req.user.id,
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await review.deleteOne();

    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    console.error("Error deleting review:", err.message);
    res.status(500).json({ message: "Error deleting review" });
  }
};
