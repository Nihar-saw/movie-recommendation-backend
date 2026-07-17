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

        // Try to compute the preference vector if missing
        if (!user.preferenceVector || user.preferenceVector.length === 0) {
            try {
                await updatePreferenceVector(userId);
                const updatedUser = await User.findById(userId);
                if (updatedUser) {
                    user.preferenceVector = updatedUser.preferenceVector;
                    user.tasteProfile = updatedUser.tasteProfile;
                }
            } catch (err) {
                console.error("Failed to pre-calculate user vector, will use client fallback:", err.message);
            }
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
        let rawRecommendations = [];
        let mlSuccess = false;

        try {
            const { data } = await axios.post(`${AI_URL}/recommend/personalized`, {
                preference_vector: user.preferenceVector,
                user_id: userId.toString(),
                exclude_tmdb_ids: excludeIds,
                taste_profile: user.tasteProfile || {}
            });

            if (data.success && data.recommendations) {
                rawRecommendations = data.recommendations;
                mlSuccess = true;
            }
        } catch (mlErr) {
            console.error("ML service personalized recommend failed, using robust TMDB fallback:", mlErr.message);
        }

        // If Python ML is down/failed, generate recommendations using TMDB trending & popular movies
        if (!mlSuccess || rawRecommendations.length === 0) {
            try {
                const [trendingData, popularData] = await Promise.all([
                    tmdbService.getTrendingMovies().catch(() => ({ results: [] })),
                    tmdbService.getPopularMovies().catch(() => ({ results: [] }))
                ]);

                const candMovies = [
                    ...(trendingData.results || []),
                    ...(popularData.results || [])
                ];

                // Deduplicate candidates
                const uniqueCandidates = [];
                const seenIds = new Set(excludeIds);
                for (const m of candMovies) {
                    if (m && m.id && !seenIds.has(m.id)) {
                        seenIds.add(m.id);
                        uniqueCandidates.push(m);
                    }
                }

                // Get TMDB Genres to map names
                let genreMap = {};
                try {
                    const genreList = await tmdbService.getGenres();
                    if (genreList && genreList.genres) {
                        genreList.genres.forEach(g => {
                            genreMap[g.id] = g.name;
                        });
                    }
                } catch (_) {}

                let userGenres = user.tasteProfile?.genres || [];
                
                // If tasteProfile is empty, dynamically resolve genres from TMDB
                if (userGenres.length === 0 && excludeIds.length > 0) {
                    const sampleIds = excludeIds.slice(0, 10);
                    const genreCounts = {};
                    await Promise.all(sampleIds.map(async (id) => {
                        try {
                            const details = await tmdbService.getMovieDetails(id);
                            if (details.genres) {
                                details.genres.forEach(g => {
                                    genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
                                });
                            }
                        } catch (_) {}
                    }));
                    userGenres = Object.entries(genreCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(entry => entry[0]);
                }

                const userDirectors = user.tasteProfile?.directors || [];

                // Score candidates based on taste profile
                const scored = uniqueCandidates.map(m => {
                    const genres = (m.genre_ids || []).map(id => genreMap[id] || "").filter(Boolean);
                    
                    // Count matching genres
                    let matchCount = 0;
                    genres.forEach(g => {
                        if (userGenres.includes(g)) matchCount++;
                    });

                    // Base score on matchCount and popularity
                    const genreScore = genres.length > 0 ? (matchCount / genres.length) : 0;
                    const popScore = m.popularity ? Math.min(m.popularity / 100, 1) : 0;
                    const finalScore = 0.6 * genreScore + 0.4 * popScore;

                    // Generate a reason dynamically
                    let reason = "Matches your interest in movies.";
                    if (matchCount > 0 && userGenres.length > 0) {
                        const matching = genres.filter(g => userGenres.includes(g));
                        reason = `Because you enjoy ${matching.slice(0, 2).join(" and ")} movies.`;
                    } else if (genres.length > 0) {
                        reason = `Matches your preference for ${genres.slice(0, 2).join(" or ")}.`;
                    }

                    return {
                        tmdbId: m.id,
                        movieId: m.id,
                        title: m.title,
                        genres: genres,
                        score: finalScore || 0.5,
                        reason: reason
                    };
                });

                // Sort and take top 20
                scored.sort((a, b) => b.score - a.score);
                rawRecommendations = scored.slice(0, 20);
            } catch (fallbackErr) {
                console.error("Robust fallback also failed:", fallbackErr.message);
            }
        }

        // 5. Enrich recommendations with full TMDB data
        const enriched = [];
        for (const rec of rawRecommendations) {
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
