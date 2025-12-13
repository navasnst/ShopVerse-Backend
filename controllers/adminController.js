
const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Settings = require('../models/Setting');
const Notification = require('../models/Notification');
const Admin = require('../models/Admin');

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id, role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// ✅ Admin Registration
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ success: false, message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: "admin", // ✅ ensure role field exists
    });

    res.status(201).json({
      success: true,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: "admin",
      },
      token: generateToken(admin),
    });
  } catch (err) {
    console.error("Admin register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ✅ Admin Login 
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // ✅ Safe handling of profile image
    let profileImage = null;
    const baseURL = process.env.BACKEND_URL || "http://localhost:5000";
    if (admin.profileImage) {
      if (typeof admin.profileImage === "string") {
        // Normal string path
        // profileImage = `http://localhost:5000${admin.profileImage.replace(/\\/g, "/")}`;
        profileImage = `${baseURL}${admin.profileImage.replace(/\\/g, "/")}`;
      } else if (typeof admin.profileImage === "object" && admin.profileImage.path) {
        // If image stored as an object { path: "...", filename: "..." }
        profileImage = `${baseURL}${admin.profileImage.path.replace(/\\/g, "/")}`;
      }
    }

    res.json({
      success: true,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role || "admin",
        profileImage,
      },
      token: generateToken(admin),

    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get Admin Profile
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id).select('-password');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // ✅ Fix: ensure profileImage is a full URL
    let profileImage = null;
    const baseURL = process.env.BACKEND_URL || "http://localhost:5000";
    if (admin.profileImage && typeof admin.profileImage === "string") {
      profileImage = `${baseURL}${admin.profileImage.replace(/\\/g, "/")}`;
    }

    res.json({
      success: true,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        bio: admin.bio,
        role: admin.role,
        profileImage, // ✅ full URL instead of relative path
      },
    });
  } catch (err) {
    console.error('Get admin profile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ✅ Update Admin Profile
exports.updateAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const { name, email, phone, bio } = req.body;
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (phone) admin.phone = phone;
    if (bio) admin.bio = bio;

    if (req.file) {
      admin.profileImage = `/uploads/profileImages/${req.file.filename}`;
    }

    await admin.save();

    // const profileImage = admin.profileImage
    //   const baseURL = process.env.BACKEND_URL || "http://localhost:5000";
    //   ? `${baseURL}${admin.profileImage.replace(/\\/g, "/")}`
    //   : null;
    profileImage: admin.profileImage
      ? `${baseURL}${admin.profileImage.replace(/\\/g, "/")}`
      : null,


      res.json({
        success: true,
        admin: {
          ...admin.toObject(),
          profileImage,
        },
      });
  } catch (err) {
    console.error("Update admin profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Upload Profile Image
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const admin = await Admin.findById(req.user._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    admin.profileImage = `/uploads/profileImages/${req.file.filename}`;
    await admin.save();
    const baseURL = process.env.BACKEND_URL || "http://localhost:5000";
    const imageUrl = `${baseURL}${admin.profileImage.replace(/\\/g, "/")}`;

    res.json({
      success: true,
      message: "Profile image uploaded successfully",
      imageUrl,
    });
  } catch (err) {
    console.error("Upload admin image error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.dashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVendors = await Seller.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    // total revenue from orders marked paid/delivered (adapt if you use transactions)
    const revenueAgg = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // sales over time (last 30 days)
    const salesSeries = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: "$totalPrice" }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 60 }
    ]);
    const formatted = salesSeries.map(s => ({ date: s._id, sales: s.sales }));

    res.json({
      success: true,
      stats: { totalUsers, totalVendors, totalProducts, totalOrders, totalRevenue },
      salesSeries: formatted,
    });
  } catch (err) {
    console.error('Admin dashboard error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ------------------ VENDOR MANAGEMENT ------------------
exports.listVendors = async (req, res) => {
  try {
    const { page = 1, limit = 20, q } = req.query;
    const filter = q ? { $or: [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }, { shopName: new RegExp(q, 'i') }] } : {};
    const vendors = await Seller.find(filter).skip((page - 1) * limit).limit(Number(limit));
    const total = await Seller.countDocuments(filter);
    res.json({ success: true, vendors, total });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

exports.getVendor = async (req, res) => {
  try {
    const vendor = await Seller.findById(req.params.id).lean();
    const products = await Product.find({ vendor: vendor._id });
    res.json({ success: true, vendor, products });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

exports.updateVendor = async (req, res) => {
  try {
    const vendor = await Seller.findById(req.params.id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Not found' });
    Object.assign(vendor, req.body);
    await vendor.save();
    res.json({ success: true, vendor });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

exports.deleteVendor = async (req, res) => {
  try {
    await Seller.findByIdAndDelete(req.params.id);
    // Optionally set vendor products to inactive or reassign
    await Product.updateMany({ vendor: req.params.id }, { $set: { status: 'removed' } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

// ------------------ PRODUCT MANAGEMENT ------------------
exports.listProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, q, category, vendor, status } = req.query;
    const filter = {};
    if (q) filter.title = new RegExp(q, 'i');
    if (category) filter.category = category;
    if (vendor) filter.vendor = vendor;
    if (status) filter.status = status;
    const products = await Product.find(filter).populate('vendor', 'name email shopName').skip((page - 1) * limit).limit(Number(limit));
    const total = await Product.countDocuments(filter);
    res.json({ success: true, products, total });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

exports.updateProduct = async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false });
    Object.assign(p, req.body);
    await p.save();
    res.json({ success: true, product: p });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

exports.approveProduct = async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false });
    p.status = 'active';
    await p.save();

    await Notification.create({
      recipientType: 'seller',
      recipientId: p.vendor,
      title: 'Product approved',
      message: `Your product "${p.title}" has been approved and is now live.`,
      link: `/product/${p._id}`
    });

    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

exports.rejectProduct = async (req, res) => {
  try {
    const { reason } = req.body;
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false });
    p.status = 'rejected';
    p.rejectionReason = reason || 'Not specified';
    await p.save();

    await Notification.create({
      recipientType: 'seller',
      recipientId: p.vendor,
      title: 'Product rejected',
      message: `Your product "${p.title}" was rejected. Reason: ${reason || 'Not specified'}`,
      link: `/seller/products/${p._id}`
    });

    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

// ------------------ ORDERS ------------------

exports.listOrders = async (req, res) => {
  try {
    const { page = 1, limit = 1000, q, status } = req.query;

    const filter = {};
    if (q) filter.orderNumber = new RegExp(q, "i");
    if (status) filter.orderStatus = status;

    const orders = await Order.find(filter)
      .populate("user", "name email")
      .populate("products.product", "title")
      .populate("products.vendor", "shopName name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    res.json({ success: true, orders, total });
  } catch (err) {
    console.error("ADMIN ORDER ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email').populate('products.product');
    res.json({ success: true, order });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false });
    Object.assign(order, req.body); // e.g. { orderStatus: 'shipped' }
    await order.save();
    res.json({ success: true, order });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

exports.refundOrder = async (req, res) => {
  try {
    // Implement refund flow: update paymentStatus, create transaction, notify
    const { id } = req.params;
    const { reason } = req.body;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false });
    order.paymentStatus = 'refunded';
    order.orderStatus = 'cancelled';
    await order.save();

    // notify user
    await Notification.create({
      recipientType: 'user',
      recipientId: order.user,
      title: 'Refund processed',
      message: `Your refund for order ${order._id} has been processed. Reason: ${reason || 'N/A'}`,
      link: `/orders/${order._id}`
    });

    res.json({ success: true, order });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

// ------------------ USERS ------------------

exports.listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, q } = req.query;

    const filter = q ? { name: new RegExp(q, "i") } : {};

    const users = await User.aggregate([
      { $match: filter },

      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "user",
          as: "orders",
        },
      },

      {
        $addFields: {
          totalOrders: { $size: "$orders" },
        },
      },

      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          profileImage: 1,
          createdAt: 1,
          totalOrders: 1,
          role: 1,
          status: 1,
          shippingAddress: 1,
          shopName: 1,
          shopDescription: 1,
        },
      },

      { $skip: (page - 1) * Number(limit) },
      { $limit: Number(limit) }
    ]);

    const total = await User.countDocuments(filter);

    res.json({ success: true, users, total });
  } catch (err) {
    console.error("listUsers error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getUser = async (req, res) => {
  try { const user = await User.findById(req.params.id).populate('orders'); res.json({ success: true, user }); }
  catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

// exports.suspendUser = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     user.suspended = true;
//     await user.save();
//     res.json({ success: true });
//   } catch (err) { console.error(err); res.status(500).json({ success: false }); }
// };


exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Only allow updating certain fields from admin panel
    const allowed = ['name', 'email', 'phone', 'role', 'status', 'suspended', 'shippingAddress', 'shopName', 'shopDescription'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.changeUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.status = status;
    await user.save();


    res.json({ success: true, user });
  } catch (err) {
    console.error('changeUserStatus error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const { suspended } = req.body; // expect boolean
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.suspended = !!suspended;
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    console.error('suspendUser error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try { await User.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

// ------------------ PAYMENTS & TRANSACTIONS ------------------
exports.listTransactions = async (req, res) => {
  try {
    const { vendor, page = 1, limit = 20 } = req.query;
    const filter = vendor ? { vendor } : {};
    const tx = await Transaction.find(filter).skip((page - 1) * limit).limit(Number(limit));
    const total = await Transaction.countDocuments(filter);
    res.json({ success: true, transactions: tx, total });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

exports.listPendingPayouts = async (req, res) => {
  try {
    const payouts = await Transaction.find({ status: 'pending' });
    res.json({ success: true, payouts });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

exports.markPayout = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    tx.status = 'paid';
    await tx.save();
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

// ------------------ SITE SETTINGS ------------------
exports.getSettings = async (req, res) => {
  const settings = await Settings.findOne() || {};
  res.json({ success: true, settings });
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings({});
    Object.assign(settings, req.body);
    if (req.file) settings.logo = `/uploads/${req.file.filename}`;
    await settings.save();
    res.json({ success: true, settings });
  } catch (err) { console.error(err); res.status(500).json({ success: false }); }
};

// ------------------ ADMIN NOTIFICATIONS ------------------
exports.getAdminNotifications = async (req, res) => {
  try {
    // Fetch notifications for admin + those sent to "admin" type
    const notifications = await Notification.find({
      recipientType: "admin",
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, notifications });
  } catch (err) {
    console.error("Error fetching admin notifications:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, message: "Notification marked as read" });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

