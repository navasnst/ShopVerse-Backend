const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// POST /api/chatbot/message
router.post('/message', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Message text required' });

        // Save user's message
        const userMessage = await Message.create({ sender: 'user', text });

        // --- Simple AI Response Logic ---
        let botReply = '';

        if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
            botReply = 'Hello! 👋 How can I assist you today?';
        } else if (text.toLowerCase().includes('order')) {
            botReply = 'You can check your order status under "My Orders" section.';
        } else if (text.toLowerCase().includes('refund')) {
            botReply = 'Refunds are processed within 3-5 business days after confirmation.';
        } else if (text.toLowerCase().includes('product')) {
            botReply = 'Please tell me the product name, and I will help you with more details.';
        } else if (text.toLowerCase().includes('help')) {
            botReply = 'Sure! You can ask about orders, payments, refunds, or product details.';
        } else {
            botReply = "I'm still learning 🤖. Please contact support@shopverse.com for complex issues.";
        }

        // Save bot's reply
        const botMessage = await Message.create({ sender: 'bot', text: botReply });

        res.json({
            userMessage,
            botMessage,
        });
    } catch (error) {
        console.error('Chatbot Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
