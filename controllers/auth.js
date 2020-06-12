const bcrypt = require('bcryptjs');

const User = require('./../model/User');
const validator = require('./../validation');

module.exports.getSignupStepOne = (req, res, next) => {
    res.render('./../views/signup-step-one.ejs', { pageTitle: "Sign up", form: [], message: [], error: false })
};

module.exports.getSignupStepTwo = async (req, res, next) => {
    let id = req.query.id;
    try {
        let isUserExist = await User.findById(id);
        if (!isUserExist) {
            return res.redirect('/signup');
        }
    } catch (err) {
        return res.redirect('/signup');
    }
    res.render('./../views/signup-step-two.ejs', { pageTitle: "Sign up", form: [], message: [], body: {} })
};

module.exports.getLogin = (req, res, next) => {
    res.render('./../views/login.ejs', { pageTitle: "Login", message: null, input: {} })
};

module.exports.getCheckUser = async (req, res, next) => {
    const user_id = req.body.idCode;
    try {
        let isUserExist = await User.findOne({ user_id: user_id });
        if (isUserExist && isUserExist.username) {
            return res.render('./../views/signup-step-one.ejs', { pageTitle: "Sign up", form: [], message: [], error: "This account already exists. Please sign in instead using the email you provided for the study and the password you set for this account" })
        }
        if (!isUserExist) {
            return res.render('./../views/signup-step-one.ejs', { pageTitle: "Sign up", form: [], message: [], error: "No account found" })
        }

        res.render('./../views/signup-step-two.ejs', {
            id: isUserExist._id,
            pageTitle: "Sign Up",
            message: null,
            body: { name: isUserExist.name, email: isUserExist.EmailID }
        });

    } catch (err) {
        let error = new Error(err);
        next(error);
    }
}

module.exports.postCreateUser = async (req, res, next) => {
    let user = await User.findById(req.body.id);
    if (!user) {
        return res.redirect('/signup');
    }

    //General Validation
    let { error } = validator.registerValidation(req.body);
    if (error) {
        return res.render('./../views/signup-step-two.ejs', {
            id: user._id,
            pageTitle: "Sign Up",
            message: error.details[0].message,
            body: req.body
        });
    }

    //Password check
    if (req.body.password != req.body.password_conf) {
        return res.render('./../views/signup-step-two.ejs', {
            id: user._id,
            pageTitle: "Sign Up",
            message: "Passwords are not matching",
            body: req.body
        });
    }

    //Password hash making
    const hashPassword = await bcrypt.hash(req.body.password, 12);
    let usernameCheck = await User.findOne({ username: req.body.username })

    // Username duplication check
    if (usernameCheck) {
        return res.render('./../views/signup-step-two.ejs', {
            id: user._id,
            pageTitle: "Sign Up",
            message: "Username is already taken",
            body: req.body
        });
    }

    //User creation
    user.name = req.body.name,
        user.EmailID = req.body.email,
        user.username = req.body.username,
        user.location = req.body.location,
        user.password = hashPassword,
        user.bio = req.body.bio,
        user.profile_pic = req.body.image_src

    await user.save();
    return res.redirect('/');
}