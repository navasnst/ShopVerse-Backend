const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Users
router.get('/users', protect, authorizeRoles('admin'), adminController.getAllUsers);
router.delete('/users/:id', protect, authorizeRoles('admin'), adminController.deleteUser);

// Products
router.get('/products', protect, authorizeRoles('admin'), adminController.getAllProducts);
router.delete('/products/:id', protect, authorizeRoles('admin'), adminController.deleteProduct);

// Sellers
router.get('/sellers', protect, authorizeRoles('admin'), adminController.getAllSellers);
router.delete('/sellers/:id', protect, authorizeRoles('admin'), adminController.deleteSeller);

module.exports = router;
