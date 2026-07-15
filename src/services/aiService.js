const axios = require("axios");
const { AI_URL } = require("../config/env");

const getRecommendations = async (movieName) => {

    const { data } = await axios.get(
        `${AI_URL}/recommend/${encodeURIComponent(movieName)}`
    );

    return data;
};

const getHybridRecommendations = async (
    movie,
    userId
) => {

    const { data } = await axios.get(
        `${AI_URL}/hybrid`,
        {
            params: {
                movie,
                user_id: userId
            }
        }
    );

    return data;
};

module.exports = {
    getRecommendations,
    getHybridRecommendations
};