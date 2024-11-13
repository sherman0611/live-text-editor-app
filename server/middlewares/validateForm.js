const validator = require('validator');

const validate = (email, password) => {
    if (!email || !validator.isEmail(email)) {
        return { error: true, message: "Please enter a valid email address." };
    }

    if (
        !password ||
        password.length < 8 ||
        !/[A-Z]/.test(password) ||
        !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
        return { error: true, message: "Password must be at least 8 characters long, include one uppercase letter, and one special character." };
    }

    return { error: false };
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    const validationResult = validate(email, password);
    if (validationResult.error) {
        return res.status(400).json({ message: validationResult.message });
    }

    next();
};

const validateSignup = (req, res, next) => {
    const { email, password, username } = req.body;

    if (!username || username.trim().length === 0) {
        return res.status(400).json({ message: "Username is required." });
    }

    const validationResult = validate(email, password);
    if (validationResult.error) {
        return res.status(400).json({ message: validationResult.message });
    }

    next();
};

module.exports = {
    validateLogin,
    validateSignup,
};