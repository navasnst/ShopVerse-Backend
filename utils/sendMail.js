const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
    },
});

async function sendMail(to, subject, text, html) {
    try {
        const info = await transporter.sendMail({
            from: `"ShopVerse" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log("📩 Email sent: " + info.response);
    } catch (err) {
        console.error("❌ Email error:", err);
    }
}

module.exports = sendMail;








