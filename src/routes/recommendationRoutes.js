const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {

    recommendMovie,

    hybridRecommendation

} = require("../controllers/recommendationController");

const {
    getPersonalizedRecommendations
} = require("../controllers/personalizedRecController");

router.get(
    "/",
    recommendMovie
);

router.get(
    "/hybrid",
    protect,
    hybridRecommendation
);

router.get(
    "/personalized",
    protect,
    getPersonalizedRecommendations
);

module.exports = router;