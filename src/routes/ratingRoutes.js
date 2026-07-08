const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    rateMovie,
    myRatings
} = require("../controllers/ratingController");

router.post("/", protect, rateMovie);

router.get("/", protect, myRatings);

module.exports = router;