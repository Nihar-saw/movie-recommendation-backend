const userService = require("../services/userService");
const { updatePreferenceVector } = require("../services/preferenceService");

const getProfile = async (req, res) => {

    const user = await userService.getUserById(req.user._id);

    res.json({
        success: true,
        user
    });

};

const addFavorite = async (req, res) => {

    const favorites = await userService.addFavorite(
        req.user._id,
        req.body.movieId
    );

    res.json({
        success: true,
        favorites
    });

    // Update preference vector in background
    updatePreferenceVector(req.user._id).catch(err =>
        console.error("Background vector update error:", err.message)
    );

};

const removeFavorite = async (req, res) => {

    const favorites = await userService.removeFavorite(
        req.user._id,
        req.params.movieId
    );

    res.json({
        success: true,
        favorites
    });

    // Update preference vector in background
    updatePreferenceVector(req.user._id).catch(err =>
        console.error("Background vector update error:", err.message)
    );

};

const addWatchlist = async (req, res) => {

    const watchlist = await userService.addWatchlist(
        req.user._id,
        req.body.movieId
    );

    res.json({
        success: true,
        watchlist
    });

    // Update preference vector in background
    updatePreferenceVector(req.user._id).catch(err =>
        console.error("Background vector update error:", err.message)
    );

};

const removeWatchlist = async (req, res) => {

    const watchlist = await userService.removeWatchlist(
        req.user._id,
        req.params.movieId
    );

    res.json({
        success: true,
        watchlist
    });

    // Update preference vector in background
    updatePreferenceVector(req.user._id).catch(err =>
        console.error("Background vector update error:", err.message)
    );

};

module.exports = {
    getProfile,
    addFavorite,
    removeFavorite,
    addWatchlist,
    removeWatchlist
};