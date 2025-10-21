
const Order = require('../models/Order');

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { products, shippingAddress, seller } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'No products in order' });
    }

    if (!seller || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Seller and shippingAddress are required' });
    }

    // Calculate totalPrice on the server
    const orderProducts = products.map(item => {
      if (!item.product || !item.quantity || !item.price) {
        throw new Error('Each product must have product, quantity, and price');
      }
      return {
        product: item.product,
        quantity: item.quantity,
        price: item.price
      };
    });

    const totalPrice = orderProducts.reduce((acc, item) => acc + item.quantity * item.price, 0);

    // Create the order
    const order = await Order.create({
      user: req.user._id,
      seller,
      products: orderProducts,
      totalPrice,
      shippingAddress,
      paymentStatus: 'paid', // if using Stripe
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// Get all orders for the logged-in user
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('products.product', 'title price').populate('seller', 'name shopName');
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all orders for admin or seller
exports.getAllOrders = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'seller') query = { seller: req.user._id };

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('seller', 'name shopName')
      .populate('products.product', 'title price');

    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update order status (admin/seller)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (req.user.role === 'seller' && order.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    order.orderStatus = orderStatus;
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
