const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seller",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        commission: {
            type: Number,
            required: true,
            default: 0,
        },
        netAmount: {
            type: Number,
            required: true,
            default: function () {
                return this.amount - this.commission;
            },
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending",
        },
        paymentMethod: {
            type: String,
            enum: ["cod", "card", "upi", "bank-transfer"],
            default: "card",
        },
        payoutStatus: {
            type: String,
            enum: ["pending", "processing", "completed"],
            default: "pending",
        },
        transactionDate: {
            type: Date,
            default: Date.now,
        },
        referenceId: {
            type: String,
            unique: true,
            required: true,
        },
        notes: {
            type: String,
        },
    },
    { timestamps: true }
);

// Automatically calculate netAmount before saving
transactionSchema.pre("save", function (next) {
    this.netAmount = this.amount - this.commission;
    next();
});

module.exports = mongoose.model("Transaction", transactionSchema);
