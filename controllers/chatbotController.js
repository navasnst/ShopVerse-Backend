
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Message = require("../models/Message");

const intentsPath = path.join(__dirname, "../chatbot/intents.json");

// ✅ Safe loading of intents
let intents = { intents: [] };
try {
  if (fs.existsSync(intentsPath)) {
    const fileData = fs.readFileSync(intentsPath, "utf8");
    intents = JSON.parse(fileData);

    // Fallback if file exists but has wrong format
    if (!intents.intents || !Array.isArray(intents.intents)) {
      console.warn("⚠️ Invalid intents.json format. Resetting to empty list.");
      intents = { intents: [] };
    }
  } else {
    console.warn("⚠️ intents.json file not found!");
  }
} catch (err) {
  console.error("⚠️ Error reading intents.json:", err.message);
  intents = { intents: [] };
}

exports.chatbotReply = async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    let finalUserId = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      finalUserId = new mongoose.Types.ObjectId(userId);
    }

    try {
      await Message.create({
        user: finalUserId,
        sender: "user",
        text: message,
      });
    } catch (err) {
      console.warn("⚠️ Could not save user message:", err.message);
    }

    // ✅ Handle case where no intents are loaded
    if (!intents.intents || intents.intents.length === 0) {
      console.warn("⚠️ No chatbot intents loaded.");
      return res.json({
        reply:
          "Sorry, my training data isn’t loaded yet. Please contact support.",
      });
    }

    // ✅ Find matching intent
    const intent = intents.intents.find((intent) =>
      intent.patterns.some(
        (pattern) => pattern.toLowerCase() === message.toLowerCase()
      )
    );

    const botReply = intent
      ? intent.responses[Math.floor(Math.random() * intent.responses.length)]
      : "Sorry, I didn’t understand that. Could you rephrase?";

    try {
      await Message.create({
        user: finalUserId,
        sender: "bot",
        text: botReply,
      });
    } catch (err) {
      console.warn("⚠️ Could not save bot message:", err.message);
    }

    return res.json({ reply: botReply });
  } catch (err) {
    console.error("💥 Chatbot error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
