const express = require("express");

const router = express.Router();

const {
    registerValidation,
    loginValidation
} = require("../validations/authValidation");

const validate = require("../middleware/validationMiddleware");

router.post(
    "/register",
    registerValidation,
    validate,
    registerUser
);

router.post(
    "/login",
    loginValidation,
    validate,
    loginUser
);

const {
    registerUser,
    loginUser,
    getProfile
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/profile", protect, getProfile);

module.exports = router;