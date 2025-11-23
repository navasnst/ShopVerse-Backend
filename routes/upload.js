const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");

// @desc Upload profile image
// @route POST /api/upload/profile
// @access Public or Protected (based on your need)
router.post("/profile", upload.single("profileImage"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ success: true, imageUrl });
});

module.exports = router;
