
const Admin = require("../models/Admin");
const Seller = require("../models/Seller");
const bcrypt = require("bcryptjs");

// ===============================
// ✅ ADMIN PROFILE CONTROLLERS
// ===============================

// Get Admin Profile
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Admin Profile
exports.updateAdminProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // ✅ Handle image
    if (req.file) {
      updateData.profileImage = `/uploads/profileImages/${req.file.filename}`;
    }

    // ✅ Handle password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    }).select("-password");

    if (!updatedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json(updatedAdmin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===============================
// ✅ SELLER PROFILE CONTROLLERS
// ===============================

// Get Seller Profile
exports.getSellerProfile = async (req, res) => {
  try {
    const seller = await Seller.findById(req.user._id).select("-password");
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }
    res.json(seller);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Seller Profile
const BASE_URL = "https://shopverse-backend-xls7.onrender.com"; // or process.env.API_BASE_URL

exports.updateSellerProfile = async (req, res) => {
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
