const axios = require("axios");
const { AI_URL } = require("../config/env");
const User = require("../models/User");
const cache = require("../services/recommendationCache");
const { updatePreferenceVector } = require("../services/preferenceService");
const tmdbService = require("../services/tmdbService");

const getPersonalizedRecommendations = async (req, res) => {
    try {
        const userId = req.user._id;
        const cacheKey = `recommendation:personalized:${userId}`;

        // 1. Check cache first
        const cachedData = await cache.getRecommendation(cacheKey);
        if (cachedData) {
            return res.json({
                success: true,
                recommendations: cachedData
            });
        }

        // 2. Get the user and their preference vector
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // If the preference vector hasn't been computed yet, compute it now
        if (!user.preferenceVector || user.preferenceVector.length === 0) {
            await updatePreferenceVector(userId);
            // Re-fetch the user after update
            const updatedUser = await User.findById(userId);
            if (!updatedUser.preferenceVector || updatedUser.preferenceVector.length === 0) {
                return res.json({
                    success: true,
                    recommendations: [],
                    message: "Not enough data to generate personalized recommendations. Add movies to your watchlist!"
                });
            }
            user.preferenceVector = updatedUser.preferenceVector;
            user.tasteProfile = updatedUser.tasteProfile;
        }

        // 3. Build the exclude list (watchlist + favorites + history)
        const excludeIds = [
            ...new Set([
                ...(user.watchlist || []),
                ...(user.favorites || []),
                ...(user.history || []).map(h => h.movieId)
            ])
        ].filter(Boolean);

        // 4. Call the Python ML backend for personalized recommendations
        const { data } = await axios.post(`${AI_URL}/recommend/personalized`, {
            preference_vector: user.preferenceVector,
            user_id: userId.toString(),
            exclude_tmdb_ids: excludeIds,
            taste_profile: user.tasteProfile || {}
        });

        if (!data.success) {
            return res.status(500).json({
                success: false,
                message: data.error || "ML service error"
            });
        }

        // 5. Enrich recommendations with full TMDB data
        const enriched = [];
        for (const rec of (data.recommendations || [])) {
            try {
                const tmdbId = rec.tmdbId;
                if (!tmdbId) {
                    enriched.push(rec);
                    continue;
                }
                const details = await tmdbService.getMovieDetails(tmdbId);
                enriched.push({
                    movieId: tmdbId,
                    title: details.title || rec.title,
                    poster: details.poster_path
                        ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
                        : null,
                    backdrop: details.backdrop_path
                        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
                        : null,
                    overview: details.overview,
                    release_date: details.release_date,
                    vote_average: details.vote_average,
                    genres: (details.genres || []).map(g => g.name),
                    match: Math.round((rec.score || 0) * 100),
                    reason: rec.reason || "A personalized recommendation for you."
                });
            } catch (err) {
                // If TMDB enrichment fails, still include the raw rec
                enriched.push({
                    movieId: rec.tmdbId,
                    title: rec.title,
                    poster: null,
                    match: Math.round((rec.score || 0) * 100),
                    reason: rec.reason || "A personalized recommendation for you."
                });
            }
        }

        // 6. Cache for 30 minutes
        await cache.cacheRecommendation(cacheKey, enriched);

        return res.json({
            success: true,
            recommendations: enriched
        });

    } catch (error) {
        console.error("Personalized recommendations error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getPersonalizedRecommendations
};
