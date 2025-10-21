const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { protect } = require('../middleware/authMiddleware');
const Payment = require('../models/Payment');


// @route   POST /api/payment
// @desc    Create a payment intent
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // convert to paise
      currency: 'inr',
      payment_method_types: ['card'],
      description: 'ShopVerse Purchase',
    });

    // Save to DB
    await Payment.create({
      user: req.user._id,
      amount,
      currency: 'inr',
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      description: 'ShopVerse Purchase',
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
