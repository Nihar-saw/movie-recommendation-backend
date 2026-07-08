const axios = require("axios");

const BASE_URL = "https://api.themoviedb.org/3";

const tmdb = axios.create({
    baseURL: BASE_URL,
    params: {
        api_key: process.env.TMDB_API_KEY
    }
});

const getTrendingMovies = async (page = 1) => {
    const { data } = await tmdb.get("/trending/movie/week", {
        params: { page }
    });

    return data;
};

const getPopularMovies = async (page = 1) => {
    const { data } = await tmdb.get("/movie/popular", {
        params: { page }
    });

    return data;
};

const searchMovies = async (query, page = 1) => {
    const { data } = await tmdb.get("/search/movie", {
        params: {
            query,
            page
        }
    });

    return data;
};

const getMovieDetails = async (movieId) => {
    const { data } = await tmdb.get(`/movie/${movieId}`, {
        params: {
            append_to_response: "credits,videos"
        }
    });

    return data;
};

const getGenres = async () => {
    const { data } = await tmdb.get("/genre/movie/list");

    return data;
};

module.exports = {
    getTrendingMovies,
    getPopularMovies,
    searchMovies,
    getMovieDetails,
    getGenres
};