
const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getSellers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');


router.get('/profile', protect, getProfile);

router.put('/profile', protect, updateProfile);

router.put('/profile/upload-image', protect, upload.single("profileImage"), updateProfile);

router.get('/sellers', getSellers);

module.exports = router;
