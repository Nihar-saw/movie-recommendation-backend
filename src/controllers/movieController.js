const tmdb = require("../services/tmdbService");

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

        const movie = await tmdb.getMovieDetails(req.params.id);

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