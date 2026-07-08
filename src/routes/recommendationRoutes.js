const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {

    recommendMovie,

    hybridRecommendation

} = require("../controllers/recommendationController");

router.get(
    "/",
    recommendMovie
);

router.get(
    "/hybrid",
    protect,
    hybridRecommendation
);

module.exports = router;