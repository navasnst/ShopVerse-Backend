const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientType: {
      type: String,
      enum: ["user", "seller", "admin"],
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "recipientType", // Dynamic reference based on type
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String }, // optional redirect link (like /orders/:id)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
