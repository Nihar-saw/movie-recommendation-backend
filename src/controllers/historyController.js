const User = require("../models/User");

const addHistory = async (req, res) => {

    const { movieId, duration, completed } = req.body;

    const user = await User.findById(req.user._id);

    const exists = user.history.find(
        movie => movie.movieId == movieId
    );

    if (exists) {

        exists.duration = duration;
        exists.completed = completed;
        exists.watchedAt = new Date();

    } else {

        user.history.push({
            movieId,
            duration,
            completed
        });

    }

    await user.save();

    res.json({
        success: true,
        history: user.history
    });

};

const getHistory = async (req, res) => {

    const user = await User.findById(req.user._id);

    res.json({
        success: true,
        history: user.history
    });

};

module.exports = {
    addHistory,
    getHistory
};