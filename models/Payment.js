
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "inr",
    },
    paymentIntentId: {
      type: String,
      required: true,
    },
    chargeId: { type: String }, // optional - for tracking successful charge
    paymentMethod: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "requires_payment_method",
        "requires_confirmation",
        "requires_action",
        "processing",
        "succeeded",
        "canceled",
        "failed",
      ],
      default: "requires_payment_method",
    },
    receiptUrl: {
      type: String,
    },
    description: {
      type: String,
      default: "ShopVerse Purchase",
    },
  },
  { timestamps: true }
);

// ✅ Optional: add index for faster user history lookups
paymentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
