
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { protect } = require("../middleware/authMiddleware");
const Payment = require("../models/Payment");

// ✅ Create a Payment Intent (Stripe)
router.post("/", protect, async (req, res) => {
  try {
    const { amount, currency = "inr", description = "ShopVerse Purchase" } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: "Amount is required" });
    }

    // ✅ Create a Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // amount in smallest currency unit
      currency,
      description,
      metadata: { userId: req.user._id.toString() },
      automatic_payment_methods: { enabled: true },
    });

    // ✅ Save payment to MongoDB
    await Payment.create({
      user: req.user._id,
      amount,
      currency,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      description,
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("❌ Stripe Payment Error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong with payment",
    });
  }
});

module.exports = router;







