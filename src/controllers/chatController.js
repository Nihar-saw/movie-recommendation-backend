const axios = require("axios");
const aiService = require("../services/aiService");
const tmdbService = require("../services/tmdbService");
const User = require("../models/User");
const cache = require("../services/recommendationCache");

const chatWithAI = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required"
            });
        }

        // Build personalized context from user data
        let personalizedContext = "";
        try {
            const user = await User.findById(req.user._id);
            if (user) {
                const tp = user.tasteProfile || {};
                const genres = (tp.genres || []).join(", ");
                const directors = (tp.directors || []).join(", ");

                if (genres || directors) {
                    personalizedContext += `\nUser taste profile: Favorite genres: ${genres || "unknown"}. Favorite directors: ${directors || "unknown"}.`;
                }

                // Include cached personalized recommendations if available
                const cacheKey = `recommendation:personalized:${req.user._id}`;
                const cachedRecs = await cache.getRecommendation(cacheKey);
                if (cachedRecs && cachedRecs.length > 0) {
                    const recList = cachedRecs.slice(0, 10).map(r => `${r.title} (${(r.genres || []).slice(0, 2).join(", ")})`).join("; ");
                    personalizedContext += `\nCurrent personalized recommendations for this user: ${recList}`;
                }

                // Include watchlist info
                if (user.watchlist && user.watchlist.length > 0) {
                    personalizedContext += `\nUser has ${user.watchlist.length} movies in their watchlist.`;
                }
                if (user.favorites && user.favorites.length > 0) {
                    personalizedContext += `\nUser has ${user.favorites.length} favorited movies.`;
                }
            }
        } catch (profileErr) {
            console.error("Failed to load user context for chat:", profileErr.message);
        }

        const groqApiKey = process.env.GROQ_API_KEY;

        if (groqApiKey) {
            try {
                const systemPrompt = (
                    "You are CineAI, an expert movie recommendation assistant. " +
                    "Recommend only real movies. You MUST return a JSON response. " +
                    "The JSON response must contain a 'text' key (a friendly, conversational markdown string " +
                    "explaining your recommendation) and a 'movies' key (an array of integer TMDB movie IDs " +
                    "for the recommended movies, or empty array if none). " +
                    "Example: {\"text\": \"Here are some great picks!\", \"movies\": [550, 680, 27205]}" +
                    (personalizedContext ? `\n\n--- USER CONTEXT ---${personalizedContext}` : "") +
                    "\n\nUse this context to give highly personalized answers. " +
                    "Reference their taste profile and current recommendations when relevant. " +
                    "If they ask for something specific (e.g., 'like Interstellar but darker'), " +
                    "filter from their personalized recommendations first, then supplement with your knowledge."
                );

                const { data } = await axios.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    {
                        model: "llama3-8b-8192",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: prompt }
                        ],
                        response_format: { type: "json_object" }
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${groqApiKey}`,
                            "Content-Type": "application/json"
                        },
                        timeout: 8000
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
        console.log("Using ML Model Fallback for prompt:", prompt);
        
        let targetMovie = "";
        let movieIds = [];
        let reasonMessage = "";

        // 1. Clean the prompt to extract potential movie title
        const stopWords = ["recommend", "me", "something", "like", "similar", "to", "movie", "movies", "show", "shows", "but", "darker", "plz", "please", "suggest", "any", "good", "film", "films", "want", "watch", "can", "you", "dark", "happier", "scarier", "funny", "sad"];
        let cleanedQuery = prompt.toLowerCase();
        
        // Remove common punctuation
        cleanedQuery = cleanedQuery.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
        
        // Remove stop words
        stopWords.forEach(word => {
            cleanedQuery = cleanedQuery.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
        });
        cleanedQuery = cleanedQuery.trim();

        if (cleanedQuery.length > 2) {
            try {
                // Search TMDB to verify if it's a real movie title
                const searchResult = await tmdbService.searchMovies(cleanedQuery);
                const results = searchResult.results || searchResult || [];
                
                if (results.length > 0) {
                    const matchedMovie = results[0];
                    targetMovie = matchedMovie.title;
                    const targetTmdbId = matchedMovie.id;

                    // Fetch recommendations for the matched movie
                    let rawRecs = [];
                    try {
                        rawRecs = await aiService.getRecommendations(targetMovie);
                    } catch (err) {
                        console.error("ML service failed for target movie:", err.message);
                    }

                    if (rawRecs && Array.isArray(rawRecs) && rawRecs.length > 0) {
                        movieIds = rawRecs.slice(0, 5).map(r => r.tmdbId || r.movieId || r).filter(id => !isNaN(id) && id !== targetTmdbId);
                    }
                    
                    if (movieIds.length > 0) {
                        reasonMessage = `I found that you are asking about **${targetMovie}**! Here are some recommended movies similar to it from our Machine Learning recommendation engine:`;
                    }
                }
            } catch (err) {
                console.error("Error doing dynamic movie extraction/search:", err.message);
            }
        }

        // 2. Genre Fallback (if no movie was extracted or recommended)
        if (movieIds.length === 0) {
            targetMovie = "Inception"; // Default fallback title
            const lowerPrompt = prompt.toLowerCase();
            if (lowerPrompt.includes("sci-fi") || lowerPrompt.includes("space") || lowerPrompt.includes("science")) {
                targetMovie = "Interstellar";
            } else if (lowerPrompt.includes("emotional") || lowerPrompt.includes("sad") || lowerPrompt.includes("romance")) {
                targetMovie = "Titanic";
            } else if (lowerPrompt.includes("funny") || lowerPrompt.includes("comedy")) {
                targetMovie = "Superbad";
            } else if (lowerPrompt.includes("action") || lowerPrompt.includes("fight") || lowerPrompt.includes("superhero")) {
                targetMovie = "The Dark Knight";
            } else if (lowerPrompt.includes("horror") || lowerPrompt.includes("scary")) {
                targetMovie = "The Conjuring";
            } else if (lowerPrompt.includes("thriller") || lowerPrompt.includes("mystery")) {
                targetMovie = "Shutter Island";
            }

            try {
                const rawRecs = await aiService.getRecommendations(targetMovie);
                if (rawRecs && Array.isArray(rawRecs)) {
                    movieIds = rawRecs.slice(0, 5).map(r => r.tmdbId || r.movieId || r).filter(id => !isNaN(id));
                }
            } catch (err) {
                console.error("ML service failed during genre fallback:", err.message);
            }

            reasonMessage = `I noticed you're looking for recommendations related to **${targetMovie}**! Here are some matching movies from my recommendation engine:`;
        }

        // 3. Absolute Hardcoded Fallback if all else fails
        if (movieIds.length === 0) {
            movieIds = [157336, 27205, 550, 680]; // Interstellar, Inception, Fight Club, Pulp Fiction
            reasonMessage = "Here are some of our top-rated recommendations to check out:";
        }

        return res.json({
            success: true,
            response: {
                text: reasonMessage,
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