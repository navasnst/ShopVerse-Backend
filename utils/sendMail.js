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
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection once (important for Render)
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Email server error:", err);
  } else {
    console.log("✅ Email server is ready");
  }
});

const sendMail = async ({ to, subject, text, html, replyTo }) => {
  try {
    const info = await transporter.sendMail({
      from: `"ShopVerse" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      replyTo,
    });

    console.log("📩 Email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Email send failed:", error.message);
  }
};

module.exports = sendMail;
