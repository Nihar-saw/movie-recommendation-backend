const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { addComment, getCommentsByMovie } = require("../controllers/commentController");

router.post("/", protect, addComment);
router.get("/:movieId", getCommentsByMovie);

module.exports = router;
