const User = require("../models/User");
const { updatePreferenceVector } = require("../services/preferenceService");

const addHistory = async (req, res) => {

    const { movieId, duration, completed } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

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

    // Update preference vector in background
    updatePreferenceVector(req.user._id).catch(err =>
        console.error("Background vector update error:", err.message)
    );

};

const getHistory = async (req, res) => {

    const user = await User.findById(req.user._id);

    res.json({
        success: true,
        history: user.history
    });

};

const removeHistory = async (req, res) => {
    const { movieId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    user.history = user.history.filter(m => m.movieId != movieId);
    await user.save();
    res.json({ success: true, history: user.history });

    // Update preference vector in background
    updatePreferenceVector(req.user._id).catch(err =>
        console.error("Background vector update error:", err.message)
    );
};

module.exports = {
    addHistory,
    getHistory,
    removeHistory
};