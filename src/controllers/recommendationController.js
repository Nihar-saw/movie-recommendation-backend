const recommendationService = require("../services/recommendationService");

const recommendMovie = async (req, res) => {

    try {

        const { movie } = req.query;

        if (!movie) {

            return res.status(400).json({

                success: false,

                message: "Movie name required"

            });

        }

        const recommendations =
            await recommendationService.getRecommendations(movie);

        res.json({

            success: true,

            data: recommendations

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

const hybridRecommendation = async (
    req,
    res
) => {

    try {

        const { movie } = req.query;

        const userId = req.user._id;

        const recommendations =
            await recommendationService.getHybridRecommendations(
                movie,
                userId
            );

        res.json({

            success: true,

            data: recommendations

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

module.exports = {
    recommendMovie,
    hybridRecommendation
};