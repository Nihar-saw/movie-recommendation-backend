const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    registerUser,
    loginUser,
    getProfile
} = require("../controllers/authController");

const {
    registerValidation,
    loginValidation
} = require("../validations/authValidation");

const validate = require("../middleware/validationMiddleware");

// Register
router.post(
    "/register",
    registerValidation,
    validate,
    registerUser
);

// Login
router.post(
    "/login",
    loginValidation,
    validate,
    loginUser
);

// Profile
router.get(
    "/profile",
    protect,
    getProfile
);

module.exports = router;