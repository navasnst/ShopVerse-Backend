
const Order = require('../models/Order');
const Product = require("../models/Product")
const path = require("path")
const generateInvoicePDF = require("../utils/generateInvoice")

// ================== CREATE ORDER ==================

exports.createOrder = async (req, res) => {
  try {
    const { products, shippingAddress, paymentMethod } = req.body;

    if (!products || !products.length)
      return res.status(400).json({ success: false, message: "No products in order" });

    if (!shippingAddress)
      return res.status(400).json({ success: false, message: "Shipping address required" });

    const orderProducts = [];

    for (const item of products) {
      const productId = item.product?._id || item.product;

      let vendorId =
        item.vendor ||
        item.vendorId ||
        item.seller ||
        item.sellerId;

      // fallback to DB
      if (!vendorId) {
        const prod = await Product.findById(productId).select("vendor");
        if (!prod)
          return res.status(400).json({ success: false, message: "Product not found" });
        vendorId = prod.vendor;
      }

      orderProducts.push({
        product: productId,
        vendor: vendorId,
        quantity: item.quantity,
        price: item.price,
      });
    }

    const order = await Order.create({
      user: req.user._id,
      seller: orderProducts[0].vendor,
      products: orderProducts,
      totalPrice: orderProducts.reduce(
        (sum, p) => sum + p.quantity * p.price,
        0
      ),
      shippingAddress,
      paymentMethod: paymentMethod || "cod",
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ user: userId })
      .populate("products.product", "title images price")
      .populate("seller", "name shopName"); // optional, if you want seller info

    res.json({ success: true, orders });
  } catch (err) {
    console.error("Get User Orders Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== ADMIN/SELLER: GET ALL ORDERS ==================
exports.getAllOrders = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'seller') query = { seller: req.user._id };

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('seller', 'name shopName')
      .populate('products.product', 'title price images');

    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user._id.toString();

    const orders = await Order.find({
      "products.vendor": sellerId,
    })
      .populate("user", "name email phone")
      .populate("products.product", "title images price");

    const filtered = orders.map(order => ({
      ...order.toObject(),
      products: order.products.filter(
        p => p.vendor.toString() === sellerId
      )
    }));

    res.json({ success: true, orders: filtered });
  } catch (err) {
    console.error("Seller orders error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================== UPDATE ORDER STATUS ==================

exports.updateOrderStatus = async (req, res) => {
  try {
    const sellerId = req.user._id.toString();
    const { id } = req.params;
    const { status, productId } = req.body;

    const order = await Order.findOne({
      _id: id,
      "products.vendor": sellerId,
    });

    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    order.products = order.products.map(p => {
      if (p.vendor.toString() === sellerId && p.product.toString() === productId) {
        p.orderStatus = status;

        if (status === "shipped")
          p.arrivalDate = new Date(Date.now() + 3 * 86400000);

        if (status === "delivered")
          p.arrivalDate = new Date();
      }
      return p;
    });

    await order.save();

    res.json({ success: true, message: "Status updated", order });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================== GET ORDER BY ID ==================
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('products.product', 'title price images')
      .populate('user', 'name email')
      .populate('seller', 'name shopName');

    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });

    if (!req.user)
      return res.status(401).json({ success: false, message: 'Not authorized' });

    if (req.user.role === 'seller' &&
      order.seller &&
      order.seller._id &&
      order.seller._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    if (req.user.role === 'user' &&
      order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error('Error fetching order by ID:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ================== PAY ORDER ==================
exports.payOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    let { paymentStatus, paymentMethod } = req.body;

    if (paymentMethod === "Stripe") paymentMethod = "card";
    if (paymentMethod === "COD") paymentMethod = "cod";

    const order = await Order.findById(orderId).populate("products.product");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 🔥 Reduce stock ONLY when payment is successful
    if (order.paymentStatus !== "paid") {
      for (let item of order.products) {
        const product = await Product.findById(item.product._id);
        if (!product) continue;

        if (product.stock < item.quantity)
          return res.status(400).json({ message: `${product.title} is out of stock` });

        product.stock -= item.quantity; // ✔ correct place
        await product.save();
      }
    }

    // Update order status
    order.paymentStatus = paymentStatus || "paid";
    order.paymentMethod = paymentMethod;

    await order.save();

    res.json({
      success: true,
      message: "Payment updated successfully",
      order,
    });
  } catch (error) {
    console.error("Payment update error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.cancelOrder = async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Ensure the logged-in user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.orderStatus !== "processing") {
      return res.status(400).json({ message: "Cannot cancel this order" });
    }

    order.orderStatus = "cancelled";
    await order.save();

    res.json({ success: true, message: "Order cancelled", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.downloadInvoice = async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await Order.findById(orderId)
      .populate("products.product", "title price images")
      .populate("user", "name email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const filePath = await generateInvoicePDF(order);

    return res.download(filePath);

  } catch (err) {
    console.error("Invoice Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================== TRACK ORDER ==================
exports.trackOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("products.product")
      .populate("seller", "shopName email phone address"); // ⭐ FIX

    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
