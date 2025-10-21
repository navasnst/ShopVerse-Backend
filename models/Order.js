const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true },
      },
    ],
    totalPrice: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    orderStatus: { type: String, enum: ['processing', 'shipped', 'delivered', 'cancelled'], default: 'processing' },
    shippingAddress: { type: String, required: true },
  },
  { timestamps: true }
);

orderSchema.pre('save', function (next) {
  if (!this.products || this.products.length === 0) {
    return next(new Error('Products are required to calculate totalPrice'));
  }

  this.totalPrice = this.products.reduce((acc, item) => {
    return acc + item.quantity * item.price;
  }, 0);

  next();
});


module.exports = mongoose.model('Order', orderSchema);
