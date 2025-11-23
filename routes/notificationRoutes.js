const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    getNotifications,
    markAllAsRead,
    markSingleAsRead,
    clearAllNotifications,
} = require("../controllers/notificationController");

// ✅ Get all notifications for logged-in user/seller/admin
router.get("/", protect, getNotifications);

// ✅ Mark all notifications as read
router.put("/mark-all-read", protect, markAllAsRead);

// ✅ Mark a single notification as read
router.put("/:id/read", protect, markSingleAsRead);

// ✅ (Optional) Clear all notifications
router.delete("/clear", protect, clearAllNotifications);

module.exports = router;
