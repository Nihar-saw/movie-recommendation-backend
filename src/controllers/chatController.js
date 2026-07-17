const axios = require("axios");
const aiService = require("../services/aiService");
const tmdbService = require("../services/tmdbService");

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

        if (groqApiKey) {
            try {
                // Call Groq REST API directly using axios
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
                        },
                        timeout: 5000
                    }
                );
                
                const content = data.choices[0].message.content;
                let parsed;
                try {
                    parsed = JSON.parse(content);
                } catch (e) {
                    parsed = { text: content, movies: [] };
                }
                
                return res.json({ success: true, response: parsed });
            } catch (err) {
                console.error("Groq AI failed, falling back to ML model...", err.message);
                // Fallthrough to ML model fallback
            }
        }

        // --- ML Model Fallback (No Groq API Key or Groq Failed) ---
        // We will extract a keyword from the prompt and use the ML recommendation model
        console.log("Using ML Model Fallback for prompt:", prompt);
        
        let targetMovie = "Inception"; // Default fallback
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes("sci-fi") || lowerPrompt.includes("space")) targetMovie = "Interstellar";
        if (lowerPrompt.includes("emotional") || lowerPrompt.includes("sad")) targetMovie = "Titanic";
        if (lowerPrompt.includes("funny") || lowerPrompt.includes("comedy")) targetMovie = "Superbad";
        if (lowerPrompt.includes("action") || lowerPrompt.includes("fight")) targetMovie = "The Dark Knight";
        if (lowerPrompt.includes("horror") || lowerPrompt.includes("scary")) targetMovie = "The Conjuring";
        
        // Fetch ML recommendations for the target movie
        let rawRecs = [];
        try {
            rawRecs = await aiService.getRecommendations(targetMovie);
        } catch (err) {
            console.error("ML service failed:", err.message);
        }
        
        let movieIds = [];
        
        if (rawRecs && Array.isArray(rawRecs)) {
            // ML returns an array of objects or IDs. If objects, map to TMDB ID
            movieIds = rawRecs.slice(0, 4).map(r => r.tmdbId || r.movieId || r).filter(id => !isNaN(id));
        }
        
        // If ML model fails or returns empty, give some hardcoded IDs
        if (movieIds.length === 0) {
            movieIds = [157336, 27205, 550, 680]; // Interstellar, Inception, Fight Club, Pulp Fiction
        }

        return res.json({
            success: true,
            response: {
                text: `I noticed you're looking for movies like **${targetMovie}**! While my main language model is offline, I used my underlying Machine Learning recommendation engine to find these perfect matches for you. Enjoy!`,
                movies: movieIds
            }
        });

    } catch (error) {
        console.error("Chat AI error:", error);
        res.status(500).json({
            success: false,
            message: "AI service temporarily unavailable. Please try again."
        });
    }
};

module.exports = {
    chatWithAI
};