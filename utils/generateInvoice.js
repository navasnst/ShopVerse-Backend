const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateInvoicePDF = (order) => {
    return new Promise((resolve, reject) => {
        try {
            const invoiceDir = path.join(__dirname, "..", "invoices");

            if (!fs.existsSync(invoiceDir)) {
                fs.mkdirSync(invoiceDir);
            }

            const filePath = path.join(invoiceDir, `invoice_${order._id}.pdf`);
            const doc = new PDFDocument();

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.fontSize(20).text("ShopVerse - Invoice", { align: "center" });
            doc.moveDown();

            // Customer details
            const s = order.shippingAddress; // Short alias

            doc.fontSize(12).text(`Order ID: ${order._id}`);
            doc.text(`Customer: ${s.fullName}`);
            doc.text(`Phone: ${s.phone}`);
            doc.text(`Address: ${s.street}, ${s.city}, ${s.state}, ${s.postalCode}, ${s.country}`);
            doc.moveDown();

            // Product table header
            doc.fontSize(14).text("Products:", { underline: true });
            doc.moveDown(0.5);

            order.products.forEach((item, index) => {
                doc.text(
                    `${index + 1}. ${item.product?.title || "Product"} — Qty: ${item.quantity} — ₹${item.price}`
                );
            });

            doc.moveDown(1);

            // Total
            doc.fontSize(14).text(`Total Amount: ₹${order.totalPrice}`, { bold: true });

            doc.end();

            stream.on("finish", () => resolve(filePath));
            stream.on("error", reject);

        } catch (err) {
            reject(err);
        }
    });
};

module.exports = generateInvoicePDF;
