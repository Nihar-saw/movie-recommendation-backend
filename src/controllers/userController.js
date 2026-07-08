const userService = require("../services/userService");

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

};

module.exports = {
    getProfile,
    addFavorite,
    removeFavorite,
    addWatchlist,
    removeWatchlist
};