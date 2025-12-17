
const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // 1️⃣ Email to ShopVerse (Admin)
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "ShopVerse Contact",
          email: process.env.EMAIL_USER, // ✅ VERIFIED EMAIL
        },
        to: [
          {
            email: process.env.EMAIL_USER,
            name: "ShopVerse",
          },
        ],
        replyTo: {
          email: email, // ✅ user email here
          name: name,
        },
        subject: `New Contact Message from ${name}`,
        htmlContent: `
          <h2>New Contact Message</h2>
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

    // 2️⃣ Confirmation mail to User
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "ShopVerse",
          email: process.env.EMAIL_USER, // ✅ VERIFIED EMAIL
        },
        to: [
          {
            email: email,
            name: name,
          },
        ],
        subject: "We received your message!",
        htmlContent: `
          <h3>Hello ${name},</h3>
          <p>Thank you for contacting <strong>ShopVerse</strong>.</p>
          <p>We have received your message and will reply shortly.</p>
          <br/>
          <p>Best regards,<br/>ShopVerse Team</p>
        `,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(
      "❌ Brevo Error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Email sending failed" });
  }
});

module.exports = router;
