
const express = require("express");
const router = express.Router();
const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getProductById,
  getLatestProducts,
  searchProducts,
} = require("../controllers/productController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");


router.get("/search",searchProducts);

// public
router.get("/", getProducts);
router.get("/latest", getLatestProducts);
router.get("/:id", getProductById);

// add product — Cloudinary URLs come in req.body.images
router.post(
  "/add-product",
  protect,
  authorizeRoles("seller", "admin"),
  addProduct
);

// update product — no multer, Cloudinary URLs in req.body.images
router.put(
  "/:id",
  protect,
  authorizeRoles("seller", "admin"),
  updateProduct
);

router.delete("/:id", protect, authorizeRoles("seller", "admin"), deleteProduct);




module.exports = router;
