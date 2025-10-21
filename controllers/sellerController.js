const Seller = require('../models/Seller');
const generateToken = require('../utils/generateToken');
const Product = require('../models/Product');


exports.registerSeller = async (req, res) => {
  try {
    const { name, email, password, role, shopName } = req.body;
    const exists = await Seller.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });

    const seller = await Seller.create({ name, email, password, role: role || 'seller', shopName });
    const token = generateToken({ id: seller._id, role: seller.role });

    res.status(201).json({ success: true, seller: { id: seller._id, name: seller.name, email: seller.email, role: seller.role }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.loginSeller = async (req, res) => {
  try {
    const { email, password } = req.body;
    const seller = await Seller.findOne({ email });
    if (!seller || !(await seller.matchPassword(password))) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }
    const token = generateToken({ id: seller._id, role: seller.role });
    res.json({ success: true, seller: { id: seller._id, name: seller.name, email: seller.email, role: seller.role }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



// Get seller profile with their products
exports.getMyProfile = async (req, res) => {
  try {
    const seller = await Seller.findById(req.user._id).populate('products');
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });
    res.json({ success: true, seller });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Optionally: Get all products by seller
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user._id });
    res.json({ success: true, products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
