const aiService = require("./aiService");
const tmdbService = require("./tmdbService");
const cache = require("./recommendationCache");
const User = require("../models/User");

const enrichRecommendations = async (recommendations) => {
    if (!recommendations || !Array.isArray(recommendations)) return [];
    
    // Enrich each movie in parallel using TMDB
    const promises = recommendations.map(async (rec) => {
        try {
            const tmdbId = rec.tmdbId || rec.movieId; // fallback
            if (!tmdbId) return null;
            
            const movieDetails = await tmdbService.getMovieDetails(tmdbId);
            return {
                ...rec,
                title: movieDetails.title,
                posterPath: movieDetails.poster_path,
                backdropPath: movieDetails.backdrop_path,
                releaseDate: movieDetails.release_date,
                voteAverage: movieDetails.vote_average,
                overview: movieDetails.overview
            };
        } catch (err) {
            console.error(`Failed to enrich movie details for ID ${rec.tmdbId || rec.movieId}:`, err.message);
            return rec; // return raw if TMDB fails
        }
    });

    const results = await Promise.all(promises);
    return results.filter(Boolean);
};

const getRecommendations = async (movieName) => {
    const cacheKey = `recommendation:content:${movieName.toLowerCase().trim()}`;
    
    // Check Cache
    const cachedData = await cache.getRecommendation(cacheKey);
    if (cachedData) {
        console.log("Serving recommendations from cache");
        return cachedData;
    }

    // Call ML Python service
    const rawRecs = await aiService.getRecommendations(movieName);
    
    // Enrich
    const enrichedRecs = await enrichRecommendations(rawRecs);

    // Save to Cache
    await cache.cacheRecommendation(cacheKey, enrichedRecs);

    return enrichedRecs;
};

const getHybridRecommendations = async (movieName, userId) => {
    const cacheKey = `recommendation:hybrid:${userId}:${movieName ? movieName.toLowerCase().trim() : "none"}`;
    
    // Check Cache
    const cachedData = await cache.getRecommendation(cacheKey);
    if (cachedData) {
        console.log("Serving hybrid recommendations from cache");
        return cachedData;
    }

    // Call ML Python service
    const rawRecs = await aiService.getHybridRecommendations(movieName, userId);
    
    // Enrich both content and collaborative lists
    const contentEnriched = await enrichRecommendations(rawRecs.content || []);
    const collaborativeEnriched = await enrichRecommendations(rawRecs.collaborative || []);

    const enrichedRecs = {
        content: contentEnriched,
        collaborative: collaborativeEnriched
    };

    // Save to Cache (cache for 10 minutes to allow updates to favorites/history)
    await cache.cacheRecommendation(cacheKey, enrichedRecs);

    return enrichedRecs;
};

module.exports = {
    getRecommendations,
    getHybridRecommendations
};
