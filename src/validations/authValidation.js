const { body } = require("express-validator");

exports.registerValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required"),

    body("email")
        .isEmail()
        .withMessage("Invalid email"),

    body("password")
        .isLength({ min: 6 })
        .withMessage("Password should be at least 6 characters")
];

exports.loginValidation = [
    body("email")
        .isEmail(),

    body("password")
        .notEmpty()
];