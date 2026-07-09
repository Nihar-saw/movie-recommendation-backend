const redis = require("../config/redis");

const cacheRecommendation = async (
    key,
    value
) => {

    await redis.setEx(

        key,

        3600,

        JSON.stringify(value)

    );

};

const getRecommendation = async key => {

    const data = await redis.get(key);

    if(!data) return null;

    return JSON.parse(data);

};

module.exports={
    cacheRecommendation,
    getRecommendation
}