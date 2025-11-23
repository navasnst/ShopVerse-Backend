const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
    {
        platformName: {
            type: String,
            default: "ShopVerse",
        },
        logo: {
            type: String,
            default: "",
        },
        colorTheme: {
            primary: { type: String, default: "#007bff" },
            secondary: { type: String, default: "#6c757d" },
            accent: { type: String, default: "#ffc107" },
            background: { type: String, default: "#ffffff" },
        },
        taxRate: {
            type: Number,
            default: 5, // %
        },
        commissionRate: {
            type: Number,
            default: 10, // %
        },
        shippingCharge: {
            type: Number,
            default: 50, // ₹ or $
        },
        currency: {
            type: String,
            default: "INR",
        },
        contactEmail: {
            type: String,
            default: "support@shopverse.com",
        },
        contactPhone: {
            type: String,
            default: "+91-9000000000",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Setting", settingSchema);
