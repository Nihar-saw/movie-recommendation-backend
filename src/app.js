const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const dotenv = require("dotenv");
dotenv.config();

const movieRoutes = require("./routes/movieRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const historyRoutes = require("./routes/historyRoutes");
const chatRoutes = require("./routes/chatRoutes");

const {
    notFound,
    errorHandler
} = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(morgan("dev"));
    
app.get("/", (req, res) => {
    
    res.json({
        
        success: true,
        
        message: "Movie Recommendation API Running"
        
    });
    
});

app.use("/api/movies", movieRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/chat", chatRoutes);

app.use(notFound);

app.use(errorHandler);

module.exports = app;