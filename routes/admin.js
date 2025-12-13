
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const adminController = require('../controllers/adminController');
const Admin = require('../models/Admin');

const {
    registerAdmin,
    loginAdmin,
    getAdminProfile,
    updateAdminProfile,
    uploadProfileImage,
} = require('../controllers/adminController');

// ✅ Public routes (no token required)
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);

// ✅ Protected admin routes
router.use(protect, authorizeRoles('admin')); // all routes below require admin role

// ✅ Admin profile management
router.get('/profile', getAdminProfile);
router.put('/profile', upload.single('profileImage'), updateAdminProfile);
router.post('/profile/upload-image', upload.single('profileImage'), uploadProfileImage);

// ✅ Dashboard
router.get('/dashboard', adminController.dashboard);

// ✅ Vendor management
router.get('/vendors', adminController.listVendors);
router.get('/vendors/:id', adminController.getVendor);
router.put('/vendors/:id', adminController.updateVendor);
router.delete('/vendors/:id', adminController.deleteVendor);

// ✅ Product management
router.get('/products', adminController.listProducts);
router.put('/products/:id', adminController.updateProduct); // edit
router.delete('/products/:id', adminController.deleteProduct);
router.post('/products/:id/approve', adminController.approveProduct);
router.post('/products/:id/reject', adminController.rejectProduct);

// ✅ Order management
router.get('/orders', adminController.listOrders);
router.get('/orders/:id', adminController.getOrder);
router.put('/orders/:id', adminController.updateOrder);
router.post('/orders/:id/refund', adminController.refundOrder);

// ✅ User management
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id', adminController.updateUser);
router.put('/users/:id/status', adminController.changeUserStatus);
router.put('/users/:id/suspend', adminController.suspendUser);
router.delete('/users/:id', adminController.deleteUser);

// ✅ Payments & transactions
router.get('/transactions', adminController.listTransactions);
router.get('/payouts', adminController.listPendingPayouts);
router.post('/transactions/:id/payout', adminController.markPayout);

// ✅ settings
router.get('/settings', adminController.getSettings);
router.put('/settings', upload.single('logo'), adminController.updateSettings);

// ✅ Notifications
router.get('/notifications', adminController.getAdminNotifications);
router.put('/notifications/:id/read', adminController.markNotificationAsRead);

module.exports = router;







