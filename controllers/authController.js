const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendMail = require('../utils/sendMail');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, shopName } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });

    const user = await User.create({ name, email, password, role: role || 'user', shopName });
    const token = generateToken({ id: user._id, role: user.role });

    // Send Welcome Mail
    await sendMail(
      user.email,
      "Welcome to ShopVerse 🎉",
      `Hi ${user.name}, welcome to ShopVerse!`,
      `<h3>Hi ${user.name},</h3>
       <p>Welcome to <b>ShopVerse</b>! We're glad to have you onboard.</p>
       <p>Enjoy shopping and selling with us.</p>`
    );

    res.status(201).json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }
    const token = generateToken({ id: user._id, role: user.role });

    // Send login notification email
    await sendMail(
      user.email,
      "Login Alert 🚀",
      `Hi ${user.name}, you just logged in to your ShopVerse account.`,
      `<p>Hi ${user.name},</p>
       <p>You just logged in to <b>ShopVerse</b>.</p>
       <p>If this wasn't you, please reset your password immediately.</p>`
    );


    // ✅ Always send profileImage with full URL
    const profileImage = user.profileImage
      ? user.profileImage.startsWith("http")
        ? user.profileImage
        : `${req.protocol}://${req.get("host")}/uploads/${user.profileImage}`
      : null;

    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
