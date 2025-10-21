

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { getMyProfile, getMyProducts ,registerSeller,loginSeller} = require('../controllers/sellerController');

router.post('/register', registerSeller);
router.post('/login', loginSeller);
router.get('/profile', protect, authorizeRoles('seller'), getMyProfile);
router.get('/my-products', protect, authorizeRoles('seller'), getMyProducts);

module.exports = router;

