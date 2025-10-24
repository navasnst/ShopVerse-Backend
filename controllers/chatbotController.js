const fs = require('fs');
const path = require('path');
const Message = require('../models/Message');

const intentsPath = path.join(__dirname, '../chatbot/intents.json');
const intents = JSON.parse(fs.readFileSync(intentsPath, 'utf8'));

exports.chatbotReply = async (req, res) => {
    const { userId, message } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Save user message
    await Message.create({ user: userId, role: 'user', content: message });

    // Match intent
    const lower = message.toLowerCase();
    let reply = "Sorry, I didn’t understand that. Could you please rephrase?";

    for (const intent of intents) {
        for (const pattern of intent.patterns) {
            if (lower.includes(pattern.toLowerCase())) {
                reply = intent.responses[Math.floor(Math.random() * intent.responses.length)];
                break;
            }
        }
    }

    // Save bot reply
    await Message.create({ user: userId, role: 'bot', content: reply });

    res.json({ reply });
};
