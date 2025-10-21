const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getSellers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/sellers', getSellers);


module.exports = router;
