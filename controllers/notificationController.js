const Notification = require("../models/Notification");

/**
 * ✅ Get all notifications for logged-in user
 */
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(30); // Fetch latest 30 notifications

        res.json({ success: true, notifications });
    } catch (err) {
        console.error("❌ Error fetching notifications:", err.message);
        res.status(500).json({ message: "Error fetching notifications" });
    }
};

/**
 * ✅ Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, read: false },
            { $set: { read: true } }
        );

        res.json({ success: true, message: "All notifications marked as read" });
    } catch (err) {
        console.error("❌ Error marking all as read:", err.message);
        res.status(500).json({ message: "Error marking notifications as read" });
    }
};

/**
 * ✅ Mark a single notification as read
 */
exports.markSingleAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $set: { read: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({ success: true, notification });
    } catch (err) {
        console.error("❌ Error marking single notification as read:", err.message);
        res.status(500).json({ message: "Error updating notification" });
    }
};

/**
 * ✅ Clear all notifications for the logged-in user
 */
exports.clearAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ user: req.user.id });
        res.json({ success: true, message: "All notifications cleared" });
    } catch (err) {
        console.error("❌ Error clearing notifications:", err.message);
        res.status(500).json({ message: "Error clearing notifications" });
    }
};

/**
 * ✅ Create notification (for reuse)
 */
exports.createNotification = async (userId, message, type, link = "") => {
    try {
        const notification = new Notification({
            user: userId,
            message,
            type,
            link,
            read: false,
        });
        await notification.save();
        return notification;
    } catch (err) {
        console.error("❌ Error creating notification:", err.message);
    }
};
