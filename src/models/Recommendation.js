const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    movieId: Number,

    score: Number,

    algorithm: {
        type: String,
        enum: [
            "content",
            "collaborative",
            "hybrid"
        ]
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "Recommendation",
    recommendationSchema
);