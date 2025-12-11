
const Seller = require("../models/Seller");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Review = require("../models/Review");
const Notification = require("../models/Notification");
const generateToken = require("../utils/generateToken");
const sendMail = require("../utils/sendMail");

// 🔹 AUTH CONTROLLERS
// =========================

exports.registerSeller = async (req, res) => {
  try {
    const { name, email, password, role, shopName } = req.body;
    const exists = await Seller.findOne({ email });
    if (exists)
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });

    const seller = await Seller.create({
      name,
      email,
      password,
      role: role || "seller",
      shopName,
    });

    const token = generateToken({ id: seller._id, role: seller.role });

    // Welcome mail
    await sendMail(
      seller.email,
      "Welcome to ShopVerse 🎉",
      `Hi ${seller.name} (Seller), welcome to ShopVerse!`,
      `<h3>Hi ${seller.name} <b>(Seller)</b>,</h3>
       <p>Welcome to <b>ShopVerse</b>! We're glad to have you onboard.</p>
       <p>Enjoy selling with us 🚀</p>`
    );

    res.status(201).json({
      success: true,
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        role: seller.role,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.loginSeller = async (req, res) => {
  try {
    const { email, password } = req.body;
    const seller = await Seller.findOne({ email });
    if (!seller || !(await seller.matchPassword(password))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    const token = generateToken({ id: seller._id, role: seller.role });

    // Send login alert email
    await sendMail(
      seller.email,
      "Login Alert 🚀",
      `Hi ${seller.name} (Seller), you just logged in to your ShopVerse account.`,
      `<p>Hi ${seller.name} <b>(Seller)</b>,</p>
       <p>You just logged in to <b>ShopVerse</b>.</p>
       <p>If this wasn't you, please reset your password immediately.</p>`
    );

    res.json({
      success: true,
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        role: seller.role,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔹 SELLER DASHBOARD
// =========================

exports.getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // 1️⃣ BASIC STATS

    const totalProducts = await Product.countDocuments({ vendor: sellerId });

    // const totalOrders = await Order.countDocuments({ seller: sellerId });
    const totalOrders = await Order.countDocuments({
      $or: [
        { seller: sellerId },
        { "products.vendor": sellerId }
      ]
    });

    const pendingOrders = await Order.countDocuments({
      seller: sellerId,
      orderStatus: "processing",
    });


    // 2️⃣ TOTAL SALES & EARNINGS

    const deliveredOrders = await Order.find({
      seller: sellerId,
      orderStatus: "delivered",
    });

    let totalSales = 0;

    deliveredOrders.forEach((order) => {
      order.products.forEach((p) => {
        totalSales += p.price * p.quantity;
      });
    });

    const commissionRate = 0.1; // 10%
    const totalEarnings = totalSales - totalSales * commissionRate;


    // 3️⃣ SALES SERIES (LINE CHART)

    const salesSeriesAgg = await Order.aggregate([
      { $match: { seller: sellerId, paymentStatus: "paid" } },
      { $unwind: "$products" },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          sales: {
            $sum: { $multiply: ["$products.price", "$products.quantity"] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const salesSeries = salesSeriesAgg.map((s) => ({
      date: s._id,
      sales: s.sales,
    }));


    // 4️⃣ TOP PRODUCTS (BAR CHART)

    const topProductsAgg = await Order.aggregate([
      { $match: { seller: sellerId, orderStatus: "delivered" } },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          sold: { $sum: "$products.quantity" },
        },
      },
      { $sort: { sold: -1 } },
      { $limit: 5 },
    ]);

    const topProducts = await Promise.all(
      topProductsAgg.map(async (p) => {
        const prod = await Product.findById(p._id).select("title");
        return { title: prod?.title || "Deleted Product", sold: p.sold };
      })
    );


    // 5️⃣ RECENT ORDERS TABLE

    const recentQuery = await Order.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name");

    const recentOrders = recentQuery.map((order) => {
      const total = order.products.reduce(
        (sum, p) => sum + p.price * p.quantity,
        0
      );
      return {
        _id: order._id,
        orderId: order._id.toString().slice(-6),
        customerName: order.user?.name || "Unknown",
        status: order.orderStatus,
        total,
      };
    });


    // FINAL RESPONSE

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        pendingOrders,
        totalSales,
        totalEarnings,
      },
      salesSeries,
      topProducts,
      recentOrders,
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// 🔹 PROFILE MANAGEMENT
// =========================

exports.getMyProfile = async (req, res) => {
  try {
    const seller = await Seller.findById(req.user._id).populate("products");
    if (!seller)
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });

    res.json({ success: true, seller });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const BASE_URL = "https://shopverse-backend-xls7.onrender.com"; // or process.env.API_BASE_URL

exports.updateMyProfile = async (req, res) => {
  try {
    const { name, shopName, email, bio } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (shopName) updateData.shopName = shopName;
    if (email) updateData.email = email;
    if (bio) updateData.bio = bio;

    // Image
    if (req.file) {
      updateData.profileImage = `/uploads/profileImages/${req.file.filename}`;
    }

    const updatedSeller = await Seller.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select("-password");

    if (!updatedSeller) return res.status(404).json({ success: false, message: "Seller not found" });

    // ✅ normalize image URL
    const profileImage = updatedSeller.profileImage
      ? `${BASE_URL}${updatedSeller.profileImage.replace(/\\/g, "/")}`
      : null;

    res.json({
      success: true,
      seller: { ...updatedSeller.toObject(), profileImage },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔹 PRODUCT MANAGEMENT
// =========================

exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user._id }).lean(); // lean() allows adding virtuals manually
    // Add virtuals
    const enhanced = products.map((p) => ({
      ...p,
      isInStock: p.stock > 0,
      isOfferActive: p.offer > 0 && p.offerEndDate && new Date(p.offerEndDate) > new Date(),
    }));
    res.json({ success: true, products: enhanced });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.addProduct = async (req, res) => {
  try {
    // ✅ Get the seller and check if active
    const seller = await Seller.findById(req.user._id);
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });

    if (seller.status !== "active") {
      return res.status(403).json({ success: false, message: "Inactive vendors cannot add products" });
    }

    const { name, description, price, category, stock, offer, offerEndDate } = req.body;
    const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      images,
      vendor: req.user._id,
      status: "pending", // waits for admin approval
      offer: offer || 0,
      offerEndDate: offerEndDate || null,
    });

    await Notification.create({
      user: req.user._id,
      role: "seller",
      message: `Your product "${name}" is waiting admin approval.`,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error("Add Product Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, vendor: req.user._id });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    Object.assign(product, req.body);
    if (req.files?.length) {
      product.images = req.files.map((f) => `/uploads/${f.filename}`);
    }
    await product.save();

    res.json({ success: true, message: "Product updated", product });
  } catch (err) {
    console.error("Update Product Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOneAndDelete({
      _id: id,
      vendor: req.user._id,
    });

    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete Product Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔹 ORDER MANAGEMENT
// =========================
exports.getMyOrders = async (req, res) => {
  try {
    const sellerId = req.user._id.toString();

    const orders = await Order.find({
      "products.vendor": sellerId,
    })
      .populate("products.product", "title images price")
      .populate("user", "name email")
      .populate("seller", "shopName");

    const filtered = orders.map(o => ({
      ...o.toObject(),
      products: o.products.filter(p => p.vendor.toString() === sellerId),
    }));

    res.json({ success: true, orders: filtered });
  } catch (err) {
    console.error("Get seller orders error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getSellerOrders = async (req, res) => {
  const sellerId = req.user._id;

  const orders = await Order.find({
    "products.vendor": sellerId
  })
    .populate("user", "name email phone address")
    .populate("products.product", "title images price");

  const sellerOrders = orders.map(order => ({
    ...order.toObject(),
    products: order.products.filter(
      p => p.vendor?.toString() === sellerId.toString()
    )
  }));

  res.json({ success: true, orders: sellerOrders });
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findOne({
      _id: id,
      "products.vendor": sellerId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not your order"
      });
    }

    order.products = order.products.map(p => {
      if (p.vendor.toString() === sellerId.toString()) {
        p.orderStatus = status;

        // Auto arrival date
        if (status === "shipped") {
          p.arrivalDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        }
        if (status === "delivered") {
          p.arrivalDate = new Date();
        }
      }
      return p;
    });

    await order.save();

    res.json({ success: true, message: "Order status updated", order });

  } catch (err) {
    console.error("Update Order Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// 🔹 EARNINGS
// =========================

exports.getEarnings = async (req, res) => {
  try {
    const orders = await Order.find({
      "items.vendor": req.user._id,
      status: "delivered",
    });

    let totalSales = 0;
    let totalOrders = 0;
    let totalCommission = 0;
    const commissionRate = 0.1; // 10%

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.vendor.toString() === req.user._id.toString()) {
          totalOrders++;
          totalSales += item.price * item.quantity;
          totalCommission += item.price * item.quantity * commissionRate;
        }
      });
    });

    const netEarnings = totalSales - totalCommission;

    res.json({
      success: true,
      totalSales,
      totalOrders,
      totalCommission,
      netEarnings,
    });
  } catch (err) {
    console.error("Earnings Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔹 REVIEWS
// =========================

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ vendor: req.user._id }).populate(
      "user",
      "name"
    );
    const avgRating =
      reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1);

    res.json({
      success: true,
      averageRating: avgRating.toFixed(1),
      reviews,
    });
  } catch (err) {
    console.error("Reviews Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔹 NOTIFICATIONS
// =========================

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
      role: "seller",
    }).sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (err) {
    console.error("Notifications Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/seller/delete
exports.deleteSellerAccount = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const seller = await Seller.findByIdAndDelete(sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.status(200).json({ message: "Seller account deleted successfully" });
  } catch (err) {
    console.error("Error deleting seller:", err);
    res.status(500).json({ message: "Server error" });
  }
};

