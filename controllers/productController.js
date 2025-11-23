
const Product = require('../models/Product');
const User = require('../models/User');

// ------------------------
// Helper: Normalize images input
// ------------------------
const normalizeImages = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  return [images]; // if single string
};

// =========================
// ADD PRODUCT
// =========================
exports.addProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      stock = 0,
      category,
      brand,
      rating = 0,
      numReviews = 0,
      images,
      offerPrice,
      offerEndDate,
    } = req.body;

    const imageArray = normalizeImages(images);

    const product = await Product.create({
      title,
      description,
      price: Number(price),
      stock: Number(stock),
      category,
      images: imageArray,
      vendor: req.user._id,
      brand,
      rating: Number(rating),
      numReviews: Number(numReviews),
      offerPrice: offerPrice ? Number(offerPrice) : null,
      offerEndDate: offerEndDate ? new Date(offerEndDate) : null,
      offer: offerPrice ? Math.round(((price - offerPrice) / price) * 100) : 0
    });

    await product.populate('vendor', 'name shopName email');

    res.status(201).json({ success: true, product });

  } catch (err) {
    console.error('createProduct error', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};


// search products //
exports.searchProducts = async (req, res) => {
  try {
    const q = req.query.q;

    const products = await Product.find({
      title: { $regex: q, $options: "i" },
    });

    res.json({ products });
    console.log("Search query:", req.query.q);
    console.log("Found products:", products);

  } catch (error) {
    res.status(500).json({ message: "Search failed", error });
  }
};


// =========================
// GET PRODUCTS
// =========================
exports.getProducts = async (req, res) => {
  try {
    const { category, brand, vendor, minPrice, maxPrice, rating, q } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const sort = req.query.sort || 'latest';

    const filter = {};

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (vendor) filter.vendor = vendor;
    if (rating) filter.rating = { $gte: Number(rating) };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { brand: new RegExp(q, 'i') },
      ];
    }

    let query = Product.find(filter).populate('vendor', 'name shopName');

    if (sort === 'latest') query = query.sort({ createdAt: -1 });
    else if (sort === 'price_asc') query = query.sort({ price: 1 });
    else if (sort === 'price_desc') query = query.sort({ price: -1 });
    else query = query.sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);
    const products = await query.skip((page - 1) * limit).limit(limit);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });

  } catch (err) {
    console.error('getProducts error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// =========================
// GET PRODUCT BY ID
// =========================
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('vendor', 'name shopName email');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    res.json({ success: true, product });

  } catch (err) {
    console.error('getProductById error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =========================
// UPDATE PRODUCT
// =========================
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (product.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updatable = ['title', 'description', 'price', 'stock', 'category', 'brand', 'rating', 'numReviews', 'status'];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (['price', 'stock', 'rating', 'numReviews'].includes(field))
          product[field] = Number(req.body[field]);
        else
          product[field] = req.body[field];
      }
    });

    // -------------------------------
    // ADD NEW IMAGES FROM CLOUDINARY
    // -------------------------------
    if (req.body.images) {
      const newImages = normalizeImages(req.body.images);
      product.images = product.images.concat(newImages); // append
    }

    await product.save();
    await product.populate('vendor', 'name shopName');

    res.json({ success: true, product });

  } catch (err) {
    console.error('updateProduct error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =========================
// DELETE PRODUCT
// =========================
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (product.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }


    await product.deleteOne();
    res.json({ success: true, message: 'Product removed' });

  } catch (err) {
    console.error('deleteProduct error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getLatestProducts = async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 }).limit(25);
  res.json({ success: true, products });
};
