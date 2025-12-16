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







const axios = require("axios");

async function sendMail(to, subject, text, html) {
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "ShopVerse",
          email: process.env.EMAIL_USER, // sender email
        },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("📩 Email sent to:", to);
  } catch (err) {
    console.error(
      "❌ Brevo Email Error:",
      err.response?.data || err.message
    );
  }
}

module.exports = sendMail;

