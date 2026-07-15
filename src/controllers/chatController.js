const axios = require("axios");

const chatWithAI = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required"
            });
        }

        const groqApiKey = process.env.GROQ_API_KEY;

        if (!groqApiKey) {
            return res.status(500).json({
                success: false,
                message: "AI service is not configured. Please set GROQ_API_KEY."
            });
        }

        // Call Groq REST API directly using axios (no SDK needed)
        const { data } = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama3-8b-8192",
                messages: [
                    {
                        role: "system",
                        content: (
                            "You are CineAI, an expert movie recommendation assistant. " +
                            "Recommend only real movies. You MUST return a JSON response. " +
                            "The JSON response must contain a 'text' key (a friendly, conversational markdown string " +
                            "explaining your recommendation) and a 'movies' key (an array of integer TMDB movie IDs " +
                            "for the recommended movies, or empty array if none). " +
                            "Example: {\"text\": \"Here are some great picks!\", \"movies\": [550, 680, 27205]}"
                        )
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" }
            },
            {
                headers: {
                    Authorization: `Bearer ${groqApiKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const content = data.choices[0].message.content;

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            parsed = { text: content, movies: [] };
        }

        res.json({
            success: true,
            response: parsed
        });

    } catch (error) {
        console.error("Chat AI error:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: "AI service temporarily unavailable. Please try again."
        });
    }
};

module.exports = {
    chatWithAI
};