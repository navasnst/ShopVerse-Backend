
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// ✅ Get logged-in user's cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product", "title price images");

    res.status(200).json({
  cart: cart ? cart.items : []
});

  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, vendorId, quantity } = req.body;
    const userId = req.user.id;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    const existingItem = cart.items.find(
      i => i.product.toString() === productId && i.vendor.toString() === vendorId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        vendor: vendorId,
        quantity
      });
    }

    await cart.save();

    const updatedCart = await cart.populate("items.product", "title price images");

    res.status(200).json({ cart: updatedCart.items });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update quantity
exports.updateQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params; // ✅ get productId from URL
    const userId = req.user.id;

    if (quantity <= 0)
      return res.status(400).json({ message: "Quantity must be positive" });

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.quantity = quantity;
    await cart.save();

    const updatedCart = await cart.populate("items.product", "title price images");
    // res.status(200).json(updatedCart);
    res.status(200).json({
  cart: updatedCart.items
});

  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Remove item
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );
    await cart.save();

    const updatedCart = await cart.populate("items.product", "title price images");
    // res.status(200).json(updatedCart);
    res.status(200).json({
  cart: updatedCart.items
});

  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    await Cart.findOneAndUpdate({ user: userId }, { items: [] });
    res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};
