const bcrypt = require('bcryptjs');

const User = require('./../model/User');

module.exports.getSignupStepOne = (req, res, next) => {
    res.render('./../views/signup-step-one.ejs', { pageTitle: "Sign up", form: [], message: [] })
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
    res.render('./../views/signup-step-two.ejs', { pageTitle: "Sign up", form: [], message: [] })
};

module.exports.getLogin = (req, res, next) => {
    res.render('./../views/login.ejs', { pageTitle: "Login", message: null, input: {} })
};

module.exports.getCheckUser = async (req, res, next) => {
    const user_id = req.body.idCode;

    try {
        let isUserExist = await User.findOne({ user_id: user_id });
        if (!isUserExist) {
            return res.redirect('/signup');
        }
        if (isUserExist.EmailID) {
            return res.redirect('/signup');
        }
        res.render('./../views/signup-step-two.ejs', {
            id: isUserExist._id,
            pageTitle: "Sign Up"
        });

    } catch (err) {
        let error = new Error(err);
        next(error);
    }
}

module.exports.postCreateUser = async (req, res, next) => {

    let user = await User.findById(req.body.id);
    if (!user) {
        console.log("User not found")
        return res.redirect('/signup');
    }
    const hashPassword = await bcrypt.hash(req.body.password, 12);

    user.name = req.body.name,
        user.EmailID = req.body.email,
        user.username = req.body.username,
        user.location = req.body.location,
        user.password = hashPassword,
        user.bio = req.body.bio,
        user.profile_pic = req.body.image_src

    const savedUser = await user.save();
    return res.redirect('/');

}