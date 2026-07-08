const notFound = (req, res) => {

    res.status(404).json({

        success: false,

        message: "Route Not Found"

    });

};

const errorHandler = (err, req, res, next) => {

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({

        success: false,

        message: err.message,

        stack:
            process.env.NODE_ENV === "production"
                ? null
                : err.stack

    });

};

module.exports = {
    notFound,
    errorHandler
};