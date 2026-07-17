const express = require("express");

const router = express.Router();

const {
    trendingMovies,
    popularMovies,
    searchMovie,
    movieDetails,
    genres,
    topRatedMovies,
    upcomingMovies,
    discoverMovies
} = require("../controllers/movieController");

router.get("/trending", trendingMovies);

router.get("/popular", popularMovies);

router.get("/top-rated", topRatedMovies);

router.get("/upcoming", upcomingMovies);

router.get("/discover", discoverMovies);

router.get("/search", searchMovie);

router.get("/genres", genres);

router.get("/:id", movieDetails);

module.exports = router;