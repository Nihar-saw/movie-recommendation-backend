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
const commentRoutes = require("./routes/commentRoutes");
const googleAuthRoutes = require("./routes/googleAuthRoutes");

const {
    notFound,
    errorHandler
} = require("./middleware/errorMiddleware");

const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, curl, mobile apps)
      if (!origin) return callback(null, true);

      const allowedPatterns = [
        /^https:\/\/.*\.vercel\.app$/,          // all Vercel deployments
        /^http:\/\/localhost:\d+$/,              // local dev
        /^https?:\/\/127\.0\.0\.1:\d+$/,        // local dev alternate
      ];

      // Also allow explicit CLIENT_URL from env (e.g. custom domain)
      if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
        return callback(null, true);
      }

      if (allowedPatterns.some((pattern) => pattern.test(origin))) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

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
app.use("/api/comments", commentRoutes);
app.use("/api/auth", googleAuthRoutes);

app.use(notFound);

app.use(errorHandler);

module.exports = app;