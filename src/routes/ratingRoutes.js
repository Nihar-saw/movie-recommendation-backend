const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    rateMovie,
    myRatings,
    getAverageRating,
    getUserRating
} = require("../controllers/ratingController");

// Submit / update a rating
router.post("/", protect, rateMovie);

// Get current user's ratings
router.get("/", protect, myRatings);

// Get community average rating for a specific movie (public)
router.get("/average/:movieId", getAverageRating);

// Get the current user's personal rating for a movie
router.get("/user/:movieId", protect, getUserRating);

module.exports = router;