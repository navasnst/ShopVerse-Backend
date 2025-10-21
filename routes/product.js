const express = require('express');
const router = express.Router();
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const {authorizeRoles} = require('../middleware/roleMiddleware');


// public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// private routes(seller/admin)
router.post('/', protect, authorizeRoles('seller', 'admin'), createProduct);
router.put('/:id', protect, authorizeRoles('seller', 'admin'), updateProduct);
router.delete('/:id', protect, authorizeRoles('seller', 'admin'), deleteProduct);


module.exports = router;


