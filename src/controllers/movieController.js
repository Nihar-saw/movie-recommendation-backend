const tmdb = require("../services/tmdbService");
const jwt = require("jsonwebtoken");
const movieService = require("../services/movieService");

const trendingMovies = async (req, res) => {
    try {

        const page = req.query.page || 1;

        const movies = await tmdb.getTrendingMovies(page);

        res.json({
            success: true,
            ...movies
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const popularMovies = async (req, res) => {

    try {

        const page = req.query.page || 1;

        const movies = await tmdb.getPopularMovies(page);

        res.json({
            success: true,
            ...movies
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const searchMovie = async (req, res) => {

    try {

        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Search query required"
            });
        }

        const movies = await tmdb.searchMovies(query);

        res.json({
            success: true,
            ...movies
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const movieDetails = async (req, res) => {

    try {

        const authHeader = req.headers.authorization;
        let userId = null;
        if (authHeader && authHeader.startsWith("Bearer")) {
            try {
                const token = authHeader.split(" ")[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
            } catch (err) {
                // Ignore token issues on public details view
            }
        }

        const movie = await movieService.getMovieWithUserContext(req.params.id, userId);

        res.json({
            success: true,
            movie
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const genres = async (req, res) => {

    try {

        const genreList = await tmdb.getGenres();

        res.json({
            success: true,
            ...genreList
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {
    trendingMovies,
    popularMovies,
    searchMovie,
    movieDetails,
    genres
};