const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');

// Create order
router.post('/', protect, createOrder);

// Get logged-in user's orders
router.get('/my-orders', protect, getMyOrders);

// Admin & Seller: Get all orders
router.get('/', protect, authorizeRoles('admin', 'seller'), getAllOrders);

// Admin & Seller: Update order status
router.put('/:id', protect, authorizeRoles('admin', 'seller'), updateOrderStatus);

module.exports = router;
