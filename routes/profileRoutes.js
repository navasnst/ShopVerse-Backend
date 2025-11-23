
const express = require("express");
const router = express.Router();
const {
  getAdminProfile,
  updateAdminProfile,
  getSellerProfile,
  updateSellerProfile,
} = require("../controllers/profileController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// ======================= ADMIN PROFILE =======================

// ✅ Get Admin Profile
router.get("/admin", protect, getAdminProfile);

// ✅ Update Admin Profile (with image upload)
router.put("/admin", protect, upload.single("profileImage"), updateAdminProfile);

// ======================= SELLER PROFILE =======================

// ✅ Get Seller Profile
router.get("/seller", protect, getSellerProfile);

// ✅ Update Seller Profile (with image upload)
router.put("/seller", protect, upload.single("profileImage"), updateSellerProfile);

// ======================= GENERAL UPLOAD (optional) =======================

// ✅ Standalone profile image upload (not tied to DB)
router.post("/upload", upload.single("profileImage"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/profileImages/${req.file.filename}`;
  res.json({ success: true, imageUrl });
});

module.exports = router;
