const User = require("../models/User");

const getUserById = async (id) => {
    return await User.findById(id);
};

const addFavorite = async (userId, movieId) => {

    const user = await User.findById(userId);

    if (!user)
        throw new Error("User not found");

    if (!user.favorites.includes(movieId)) {
        user.favorites.push(movieId);
    }

    await user.save();

    return user.favorites;
};

const removeFavorite = async (userId, movieId) => {

    const user = await User.findById(userId);

    user.favorites = user.favorites.filter(
        id => id !== Number(movieId)
    );

    await user.save();

    return user.favorites;
};

const addWatchlist = async (userId, movieId) => {

    const user = await User.findById(userId);

    if (!user.watchlist.includes(movieId)) {
        user.watchlist.push(movieId);
    }

    await user.save();

    return user.watchlist;
};

const removeWatchlist = async (userId, movieId) => {

    const user = await User.findById(userId);

    user.watchlist = user.watchlist.filter(
        id => id !== Number(movieId)
    );

    await user.save();

    return user.watchlist;
};

module.exports = {
    getUserById,
    addFavorite,
    removeFavorite,
    addWatchlist,
    removeWatchlist
};