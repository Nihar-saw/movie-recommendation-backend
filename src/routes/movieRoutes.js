const express = require("express");

const router = express.Router();

const {
    trendingMovies,
    popularMovies,
    searchMovie,
    movieDetails,
    genres
} = require("../controllers/movieController");

router.get("/trending", trendingMovies);

router.get("/popular", popularMovies);

router.get("/search", searchMovie);

router.get("/genres", genres);

router.get("/:id", movieDetails);

module.exports = router;