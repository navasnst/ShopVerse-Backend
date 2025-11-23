
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const path = require("path");

// =========================
// 🔹 Get user profile
// =========================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // ✅ Build full URL for profile image if local
    if (user.profileImage && !user.profileImage.startsWith("http")) {
      user.profileImage = `${req.protocol}://${req.get("host")}/${user.profileImage}`;
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("❌ Get profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =========================
// 🔹 Update user/seller/admin profile
// =========================

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const {
      name,
      email,
      password,
      shopName,
      shopDescription,
      phone,
      shippingAddress,
    } = req.body;

    // ✅ Update only if fields are provided
    if (name) user.name = name;

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists)
        return res
          .status(400)
          .json({ success: false, message: "Email already in use" });
      user.email = email;
    }

    if (password) user.password = password;
    if (phone !== undefined) user.phone = phone; // only update if provided
    if (shippingAddress !== undefined) user.shippingAddress = shippingAddress;

    // ✅ Handle uploaded profile image
    if (req.file) {
      user.profileImage = `uploads/profileImages/${req.file.filename}`;
    }

    // Seller-specific fields
    if (user.role === "seller") {
      if (shopName) user.shopName = shopName;
      if (shopDescription) user.shopDescription = shopDescription;
    }

    // ✅ Save without requiring all fields (prevents validation errors for partial updates)
    const updatedUser = await user.save({ validateBeforeSave: false });

    const token = generateToken({ id: updatedUser._id, role: updatedUser.role });

    const fullImageUrl = updatedUser.profileImage
      ? updatedUser.profileImage.startsWith("http")
        ? updatedUser.profileImage
        : `${req.protocol}://${req.get("host")}/${updatedUser.profileImage}`
      : null;

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        shippingAddress: updatedUser.shippingAddress,
        profileImage: fullImageUrl,
        ...(updatedUser.role === "seller" && {
          shopName: updatedUser.shopName,
          shopDescription: updatedUser.shopDescription,
        }),
      },
      token,
    });
  } catch (err) {
    console.error("❌ Update profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =========================
// 🔹 Get all sellers (for admin view)
// =========================
exports.getSellers = async (req, res) => {
  try {
    const sellers = await User.find({ role: "seller" }).select("-password");

    const formatted = sellers.map((seller) => ({
      ...seller._doc,
      profileImage:
        seller.profileImage && !seller.profileImage.startsWith("http")
          ? `${req.protocol}://${req.get("host")}/${seller.profileImage}`
          : seller.profileImage || null,
    }));

    res.json({ success: true, count: formatted.length, sellers: formatted });
  } catch (err) {
    console.error("❌ Get sellers error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


