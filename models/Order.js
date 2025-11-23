
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "Seller" },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        orderStatus: {
          type: String,
          enum: ["processing", "shipped", "delivered", "cancelled"],
          default: "processing"
        },
        arrivalDate: { type: Date },
      },
    ],


    totalPrice: { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: ["cod", "card", "upi"],
      default: "cod",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
  },
  { timestamps: true }
);

// ✅ Auto-calculate total
orderSchema.pre("save", function (next) {
  if (!this.products || this.products.length === 0) {
    return next(new Error("Products are required to calculate totalPrice"));
  }

  if (!this.totalPrice || this.totalPrice === 0) {
    this.totalPrice = this.products.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );
  }

  next();
});

module.exports = mongoose.model("Order", orderSchema);
