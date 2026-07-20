const axios = require("axios");
const aiService = require("../services/aiService");
const tmdbService = require("../services/tmdbService");
const User = require("../models/User");
const cache = require("../services/recommendationCache");

// Genre mapping for TMDB discover API
const GENRE_MAP = {
    action: 28, adventure: 12, animation: 16, comedy: 35, crime: 80,
    documentary: 99, drama: 18, family: 10751, fantasy: 14, history: 36,
    horror: 27, mystery: 9648, romance: 10749, "sci-fi": 878,
    "science fiction": 878, thriller: 53, war: 10752, western: 37,
    music: 10402, "tv movie": 10770
};

// Keyword → genre mappings for natural language
const KEYWORD_GENRE_MAP = {
    scary: 27, spooky: 27, creepy: 27, ghost: 27, zombie: 27, haunted: 27,
    funny: 35, hilarious: 35, laugh: 35, humor: 35,
    sad: 18, emotional: 18, crying: 18, heartbreaking: 18, tear: 18,
    love: 10749, romantic: 10749, relationship: 10749, "love story": 10749,
    space: 878, alien: 878, futuristic: 878, robot: 878, dystopian: 878,
    fight: 28, superhero: 28, explosion: 28, martial: 28, war: 10752,
    suspense: 53, "edge of seat": 53, psychological: 53, tense: 53,
    magic: 14, wizard: 14, dragon: 14, fairy: 14, mythical: 14,
    detective: 9648, whodunit: 9648, clue: 9648, investigation: 9648,
    anime: 16, cartoon: 16, animated: 16, pixar: 16,
    kids: 10751, children: 10751, "family friendly": 10751,
    historical: 36, "world war": 10752, "true story": 36,
    documentary: 99, "real life": 99, "based on true": 36,
    crime: 80, mafia: 80, gangster: 80, heist: 80, robbery: 80,
};

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
        let userGenres = [];
        try {
            const user = await User.findById(req.user._id);
            if (user) {
                const tp = user.tasteProfile || {};
                const genres = (tp.genres || []).join(", ");
                const directors = (tp.directors || []).join(", ");
                userGenres = tp.genres || [];

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
                        model: "llama-3.1-8b-instant",
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
                        timeout: 12000
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
                console.error("Groq AI failed, falling back to TMDB-based recommendations...", err.message);
                // Fallthrough to TMDB-based fallback
            }
        }

        // --- Smart TMDB-Based Fallback ---
        console.log("Using TMDB fallback for prompt:", prompt);
        const lowerPrompt = prompt.toLowerCase();

        // 1. Detect genre(s) from the prompt
        let detectedGenreIds = [];
        let detectedGenreNames = [];

        // Check direct genre names first
        for (const [name, id] of Object.entries(GENRE_MAP)) {
            if (lowerPrompt.includes(name)) {
                if (!detectedGenreIds.includes(id)) {
                    detectedGenreIds.push(id);
                    detectedGenreNames.push(name.charAt(0).toUpperCase() + name.slice(1));
                }
            }
        }

        // Check keyword associations
        for (const [keyword, id] of Object.entries(KEYWORD_GENRE_MAP)) {
            if (lowerPrompt.includes(keyword)) {
                if (!detectedGenreIds.includes(id)) {
                    detectedGenreIds.push(id);
                    // Find the genre name from GENRE_MAP
                    const gName = Object.keys(GENRE_MAP).find(k => GENRE_MAP[k] === id) || keyword;
                    detectedGenreNames.push(gName.charAt(0).toUpperCase() + gName.slice(1));
                }
            }
        }

        // 2. Try to extract a specific movie title for "like X" queries
        let specificMovieQuery = null;
        const likePatterns = [
            /(?:like|similar to|same as|remind me of|vibe of|feel of)\s+['"]?(.+?)['"]?\s*$/i,
            /movies?\s+like\s+['"]?(.+?)['"]?\s*$/i,
            /recommend.*?(?:like|similar)\s+['"]?(.+?)['"]?\s*$/i,
        ];
        for (const pattern of likePatterns) {
            const match = lowerPrompt.match(pattern);
            if (match && match[1] && match[1].length > 2) {
                specificMovieQuery = match[1].trim();
                break;
            }
        }

        let movieResults = [];
        let reasonMessage = "";

        // 3. If user asked for "movies like X", search TMDB for that movie and get its recommendations
        if (specificMovieQuery) {
            try {
                const searchResult = await tmdbService.searchMovies(specificMovieQuery);
                const searchResults = searchResult.results || [];
                if (searchResults.length > 0) {
                    const matchedMovie = searchResults[0];
                    // Use TMDB's recommendation endpoint
                    const tmdb = axios.create({
                        baseURL: "https://api.themoviedb.org/3",
                        params: { api_key: process.env.TMDB_API_KEY }
                    });
                    const { data: recData } = await tmdb.get(`/movie/${matchedMovie.id}/recommendations`);
                    movieResults = (recData.results || []).slice(0, 6);
                    reasonMessage = `Great choice! Here are movies similar to **${matchedMovie.title}** that you'll love:`;
                }
            } catch (err) {
                console.error("TMDB movie-specific recommendation failed:", err.message);
            }
        }

        // 4. If we detected genres, use TMDB discover
        if (movieResults.length === 0 && detectedGenreIds.length > 0) {
            try {
                const genreStr = detectedGenreIds.join(",");
                const tmdb = axios.create({
                    baseURL: "https://api.themoviedb.org/3",
                    params: { api_key: process.env.TMDB_API_KEY }
                });
                const { data: discoverData } = await tmdb.get("/discover/movie", {
                    params: {
                        with_genres: genreStr,
                        sort_by: "vote_average.desc",
                        "vote_count.gte": 500,
                        page: 1
                    }
                });
                movieResults = (discoverData.results || []).slice(0, 6);
                reasonMessage = `Here are some top-rated **${detectedGenreNames.join(" & ")}** movies I found for you:`;
            } catch (err) {
                console.error("TMDB genre discover failed:", err.message);
            }
        }

        // 5. General popular movies fallback
        if (movieResults.length === 0) {
            try {
                const popular = await tmdbService.getPopularMovies();
                movieResults = (popular.results || []).slice(0, 6);
                reasonMessage = "Here are some popular movies you might enjoy:";
            } catch (err) {
                console.error("TMDB popular fallback failed:", err.message);
            }
        }

        // Extract TMDB IDs from results
        const movieIds = movieResults.map(m => m.id);

        return res.json({
            success: true,
            response: {
                text: reasonMessage || "Here are some movies I recommend:",
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