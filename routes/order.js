const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  payOrder,
  cancelOrder,
  downloadInvoice,
  getSellerOrders,
  trackOrder,
} = require('../controllers/orderController');

// Create a new order
router.post('/', protect, createOrder);

// Seller orders
router.get("/seller/my-orders", protect, getSellerOrders);

// User orders
router.get('/my-orders', protect, getMyOrders);

// ❗ MUST COME ABOVE "/:id" — IMPORTANT
router.get('/:id/tracking', protect, trackOrder);

// Invoice (also MUST be above /:id)
router.get('/:id/invoice', protect, downloadInvoice);

// Cancel order
router.put('/:id/cancel', protect, cancelOrder);

// ✔ Now this will not override /tracking or /invoice
router.get('/:id', protect, getOrderById);

// Admin/Seller
router.get('/', protect, authorizeRoles('admin', 'seller'), getAllOrders);

// Admin/Seller update
router.put('/:id', protect, authorizeRoles('admin', 'seller'), updateOrderStatus);

// Pay
router.put('/:id/pay', protect, payOrder);

module.exports = router;
