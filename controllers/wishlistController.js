const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

// ✅ Get wishlist items
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id }).populate("products.product");
    res.json(wishlist || { products: [] });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Add product to wishlist
exports.addToWishlist = async (req, res) => {
  const { productId } = req.body;
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) wishlist = new Wishlist({ user: req.user.id, products: [] });

    const exists = wishlist.products.find((p) => p.product.toString() === productId);
    if (exists) return res.status(400).json({ message: "Product already in wishlist" });

    wishlist.products.push({ product: productId });
    await wishlist.save();

    res.json({ message: "Added to wishlist", wishlist });
  } catch (err) {
    res.status(500).json({ message: "Error adding to wishlist" });
  }
};

// ✅ Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  const { productId } = req.params;
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

    wishlist.products = wishlist.products.filter((p) => p.product.toString() !== productId);
    await wishlist.save();

    res.json({ message: "Removed from wishlist", wishlist });
  } catch (err) {
    res.status(500).json({ message: "Error removing product" });
  }
};
