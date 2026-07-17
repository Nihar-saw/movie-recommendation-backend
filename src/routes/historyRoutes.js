const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    addHistory,
    getHistory,
    removeHistory
} = require("../controllers/historyController");

router.post("/", protect, addHistory);

router.get("/", protect, getHistory);

router.delete("/:movieId", protect, removeHistory);

module.exports = router;