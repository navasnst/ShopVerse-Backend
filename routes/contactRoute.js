const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // 1️⃣ Send message to ShopVerse
  try {

    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: name,
          email: email, // sender = user
        },
        to: [
          {
            email: process.env.EMAIL_USER, // ShopVerse inbox
            name: "ShopVerse",
          },
        ],
        subject: `New Contact Form Message from ${name}`,
        htmlContent: `
          <h2>New Message Received</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong><br/>${message}</p>
        `,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    /* -----------------------------
       2️⃣ Confirmation email to user
    ------------------------------ */
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "ShopVerse",
          email: process.env.EMAIL_USER,
        },
        to: [
          {
            email: email,
            name: name,
          },
        ],
        subject: "We received your message!",
        htmlContent: `
          <h2>Thank you, ${name}!</h2>
          <p>We’ve received your message and will get back to you soon.</p>
          <br/>
          <p>Best regards,<br/><strong>ShopVerse Team</strong></p>
        `,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📩 Contact emails sent successfully");
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(
      "❌ Brevo Contact Email Error:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;
