const MovieRating = require("../models/MovieRating");

const rateMovie = async (req, res) => {
    try {
        const { movieId, rating } = req.body;

        if (!movieId || !rating) {
            return res.status(400).json({ success: false, message: "movieId and rating are required" });
        }

        const existing = await MovieRating.findOne({ user: req.user._id, movieId });

        if (existing) {
            existing.rating = rating;
            await existing.save();
            return res.json({ success: true, data: existing });
        }

        const newRating = await MovieRating.create({
            user: req.user._id,
            movieId,
            rating
        });

        res.status(201).json({ success: true, data: newRating });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const myRatings = async (req, res) => {
    try {
        const ratings = await MovieRating.find({ user: req.user._id });
        res.json({ success: true, ratings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAverageRating = async (req, res) => {
    try {
        const { movieId } = req.params;

        const result = await MovieRating.aggregate([
            { $match: { movieId: Number(movieId) } },
            {
                $group: {
                    _id: "$movieId",
                    averageRating: { $avg: "$rating" },
                    totalRatings: { $sum: 1 }
                }
            }
        ]);

        if (result.length === 0) {
            return res.json({ success: true, averageRating: null, totalRatings: 0 });
        }

        res.json({
            success: true,
            averageRating: Math.round(result[0].averageRating * 10) / 10,
            totalRatings: result[0].totalRatings
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getUserRating = async (req, res) => {
    try {
        const { movieId } = req.params;
        const existing = await MovieRating.findOne({ user: req.user._id, movieId: Number(movieId) });
        res.json({ success: true, rating: existing ? existing.rating : null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    rateMovie,
    myRatings,
    getAverageRating,
    getUserRating
};