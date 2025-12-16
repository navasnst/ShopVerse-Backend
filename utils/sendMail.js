
const axios = require("axios");

function isValidEmail(email) {
  return typeof email === "string" && /\S+@\S+\.\S+/.test(email);
}

async function sendMail(to, subject, text, html) {
  try {
    if (!isValidEmail(to)) {
      console.error("❌ Invalid email skipped:", to);
      return; // ⛔ stop sending
    }

    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "ShopVerse",
          email: process.env.EMAIL_USER,
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

