const axios = require("axios");
const { AI_URL } = require("../config/env");
const User = require("../models/User");
const cache = require("./recommendationCache");

/**
 * Recompute the user's preference vector by sending their
 * watchlist + favorites + history movie IDs to the Python ML backend.
 * Stores the resulting vector and taste profile in MongoDB.
 */
const updatePreferenceVector = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        // Collect all TMDB IDs the user has interacted with
        const allTmdbIds = [
            ...new Set([
                ...(user.watchlist || []),
                ...(user.favorites || []),
                ...(user.history || []).map(h => h.movieId)
            ])
        ].filter(Boolean);

        if (allTmdbIds.length === 0) {
            // No data to compute from
            user.preferenceVector = [];
            user.tasteProfile = { genres: [], keywords: [], directors: [] };
            await user.save();
            return;
        }

        // Call Python ML backend to compute the vector
        const { data } = await axios.post(`${AI_URL}/vector`, {
            tmdb_ids: allTmdbIds
        });

        if (data.success && data.vector && data.vector.length > 0) {
            user.preferenceVector = data.vector;

            // Build a simple taste profile from the movies in their watchlist
            // We will enrich this from TMDB data
            const tmdbService = require("./tmdbService");
            const genres = new Set();
            const directors = new Set();

            // Fetch details for up to 10 movies (to avoid too many API calls)
            const sampleIds = allTmdbIds.slice(0, 10);
            await Promise.all(sampleIds.map(async (tmdbId) => {
                try {
                    const details = await tmdbService.getMovieDetails(tmdbId);
                    if (details.genres) {
                        details.genres.forEach(g => genres.add(g.name));
                    }
                    if (details.credits && details.credits.crew) {
                        details.credits.crew
                            .filter(c => c.job === "Director")
                            .forEach(d => directors.add(d.name));
                    }
                } catch (err) {
                    // Ignore individual movie fetch errors
                }
            }));

            user.tasteProfile = {
                genres: [...genres],
                keywords: [],
                directors: [...directors]
            };

            await user.save();
        }

        // Invalidate the cached personalized recommendations for this user
        await invalidateCache(userId);

    } catch (error) {
        console.error("Error updating preference vector:", error.message);
    }
};

/**
 * Invalidate cached personalized recommendations for a user
 */
const invalidateCache = async (userId) => {
    try {
        const cacheKey = `recommendation:personalized:${userId}`;
        const redis = require("../config/redis");
        await redis.del(cacheKey);
    } catch (err) {
        // Cache invalidation is best-effort
        console.error("Cache invalidation error:", err.message);
    }
};

module.exports = {
    updatePreferenceVector,
    invalidateCache
};
