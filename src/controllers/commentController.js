const Comment = require("../models/Comment");
const User = require("../models/User");

// Add a comment to a movie
const addComment = async (req, res) => {
    try {
        const { movieId, content } = req.body;
        const userId = req.user._id;

        if (!movieId || !content) {
            return res.status(400).json({
                success: false,
                message: "Movie ID and content are required"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const comment = await Comment.create({
            movieId: Number(movieId),
            user: userId,
            userName: user.name || "Anonymous",
            content
        });

        res.status(201).json({
            success: true,
            comment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all comments for a movie
const getCommentsByMovie = async (req, res) => {
    try {
        const { movieId } = req.params;

        if (!movieId) {
            return res.status(400).json({
                success: false,
                message: "Movie ID is required"
            });
        }

        const comments = await Comment.find({ movieId: Number(movieId) })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            comments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    addComment,
    getCommentsByMovie
};
