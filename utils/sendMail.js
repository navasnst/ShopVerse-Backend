// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: process.env.EMAIL_USER, 
//         pass: process.env.EMAIL_PASS, 
//     },
// });

// async function sendMail(to, subject, text, html) {
//     try {
//         const info = await transporter.sendMail({
//             from: `"ShopVerse" <${process.env.EMAIL_USER}>`,
//             to,
//             subject,
//             text,
//             html,
//         });
//         console.log("📩 Email sent: " + info.response);
//     } catch (err) {
//         console.error("❌ Email error:", err);
//     }
// }

// module.exports = sendMail;

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // MUST be false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ verify once at startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP connection failed:", error);
  } else {
    console.log("✅ SMTP server is ready to send emails");
  }
});

async function sendMail(to, subject, text, html) {
  try {
    await transporter.sendMail({
      from: `"ShopVerse" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`📧 Mail sent to ${to}`);
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
  }
}

module.exports = sendMail;

