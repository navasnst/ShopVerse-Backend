
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    category: { type: String, required: true },
    brand: { type: String },

    images: [
      {
        type: String,
        trim: true,
      }
    ],

    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    offer: {
      type: Number,
      default: 0,
    },

    offerPrice: { type: Number, default: null },

    offerEndDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ✅ Virtual to check if product is in stock
productSchema.virtual("isInStock").get(function () {
  return this.stock > 0;
});

// Optional: Virtual to check if offer is active
productSchema.virtual("isOfferActive").get(function () {
  return this.offer > 0 && this.offerEndDate && this.offerEndDate > new Date();
});

module.exports = mongoose.model("Product", productSchema);
