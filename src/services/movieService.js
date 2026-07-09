const tmdbService = require("./tmdbService");
const User = require("../models/User");
const MovieRating = require("../models/MovieRating");

const getMovieWithUserContext = async (movieId, userId) => {
    const movieDetails = await tmdbService.getMovieDetails(movieId);
    
    let isFavorite = false;
    let isWatchlist = false;
    let userRating = null;
    let watchHistory = null;

    if (userId) {
        const user = await User.findById(userId);
        if (user) {
            isFavorite = user.favorites.includes(Number(movieId));
            isWatchlist = user.watchlist.includes(Number(movieId));
            
            const historyItem = user.history.find(h => h.movieId === Number(movieId));
            if (historyItem) {
                watchHistory = {
                    watchedAt: historyItem.watchedAt,
                    duration: historyItem.duration,
                    completed: historyItem.completed
                };
            }
        }

        const ratingDoc = await MovieRating.findOne({ user: userId, movieId: Number(movieId) });
        if (ratingDoc) {
            userRating = ratingDoc.rating;
        }
    }

    return {
        ...movieDetails,
        isFavorite,
        isWatchlist,
        userRating,
        watchHistory
    };
};

module.exports = {
    getMovieWithUserContext
};
