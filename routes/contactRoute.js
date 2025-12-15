// const express = require("express");
// const router = express.Router();
// const nodemailer = require("nodemailer");

// router.post("/", async (req, res) => {
//   const { name, email, message } = req.body;

//   if (!name || !email || !message) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     console.log("Email config:", process.env.EMAIL_USER, process.env.EMAIL_PASS ? "✅ Loaded" : "❌ Missing");

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     // Send message to ShopVerse inbox
//     transporter.sendMail({
//       from: `"${name}" <${email}>`,
//       to: process.env.EMAIL_USER,
//       subject: `New Contact Form Message from ${name}`,
//       html: `
//         <h2>New Message Received</h2>
//         <p><strong>Name:</strong> ${name}</p>
//         <p><strong>Email:</strong> ${email}</p>
//         <p><strong>Message:</strong><br>${message}</p>
//       `,
//     });

//     // Confirmation to user
//     transporter.sendMail({
//       from: `"ShopVerse" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: "We received your message!",
//       html: `
//         <h2>Thank you, ${name}!</h2>
//         <p>We’ve received your message and will get back to you soon.</p>
//         <p>Best regards,<br><strong>ShopVerse Team</strong></p>
//       `,
//     });

//     res.status(200).json({ success: true });
//   } catch (err) {
//     console.error("Error sending email:", err);
//     res.status(500).json({ error: "Failed to send message" });
//   }
// });

// module.exports = router;












const express = require("express");
const router = express.Router();
const sendMail = require("../utils/sendMail");

router.post("/", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Message to ShopVerse
    await sendMail({
      to: process.env.EMAIL_USER,
      subject: `New Contact Message from ${name}`,
      html: `
        <h2>New Message</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b><br/>${message}</p>
      `,
      replyTo: email,
    });

    // Confirmation to user
    await sendMail({
      to: email,
      subject: "We received your message ✔️",
      html: `
        <h3>Hi ${name},</h3>
        <p>Thanks for contacting <b>ShopVerse</b>.</p>
        <p>We’ll get back to you shortly.</p>
      `,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Contact mail error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;
