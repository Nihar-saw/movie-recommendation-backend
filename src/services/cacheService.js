const Recommendation = require("../models/Recommendation");

const saveRecommendations = async (
    user,
    recommendations,
    algorithm
) => {

    await Recommendation.deleteMany({
        user
    });

    const docs = recommendations.map(movie => ({
        user,
        movieId: movie.movieId,
        score: movie.score,
        algorithm
    }));

    await Recommendation.insertMany(docs);

};

const getRecommendations = async (user) => {

    return await Recommendation.find({
        user
    }).sort({
        score: -1
    });

};

module.exports = {
    saveRecommendations,
    getRecommendations
};