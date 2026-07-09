const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./env");

const signToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: "30d"
    });
};

const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

module.exports = {
    signToken,
    verifyToken
};
