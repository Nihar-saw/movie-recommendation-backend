const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    getProfile,
    addFavorite,
    removeFavorite,
    addWatchlist,
    removeWatchlist
} = require("../controllers/userController");

router.get("/profile", protect, getProfile);

router.post("/favorites", protect, addFavorite);

router.delete("/favorites/:movieId", protect, removeFavorite);

router.post("/watchlist", protect, addWatchlist);

router.delete("/watchlist/:movieId", protect, removeWatchlist);

module.exports = router;