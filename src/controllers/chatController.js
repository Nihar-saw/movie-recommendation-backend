const axios = require("axios");

const AI_URL = process.env.AI_URL || "http://127.0.0.1:8000";

const chatWithAI = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required"
            });
        }

        const { data } = await axios.post(`${AI_URL}/chat`, { prompt });

        res.json(data);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    chatWithAI
};
