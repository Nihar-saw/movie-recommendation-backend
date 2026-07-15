const dotenv = require("dotenv");
const crypto = require("crypto");
dotenv.config();

module.exports = {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
    TMDB_API_KEY: process.env.TMDB_API_KEY,
    AI_URL: process.env.AI_URL || "http://127.0.0.1:8000",
    REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379"
};
