const User = require('../models/User');
const generateToken = require('../utils/generateToken');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { name, email, password, shopName, shopDescription } = req.body;

    if (name) user.name = name;
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ success: false, message: 'Email already in use' });
      user.email = email;
    }
    if (password) user.password = password;

    if (user.role === 'seller') {
      if (shopName) user.shopName = shopName;
      if (shopDescription) user.shopDescription = shopDescription;
    }

    await user.save();
    const token = generateToken({ id: user._id, role: user.role });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.role === 'seller' && { shopName: user.shopName, shopDescription: user.shopDescription }),
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getSellers = async (req, res) => {
  try {
    const sellers = await User.find({ role: 'seller' }).select('-password');
    res.json({ success: true, count: sellers.length, sellers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
