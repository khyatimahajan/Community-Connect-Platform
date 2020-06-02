const bcrypt = require('bcryptjs');

const User = require('./../model/User');
const Group = require('./../model/Group');

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
    res.render('./../views/signup-step-two.ejs', { pageTitle: "Sign up", form: [], message: [] })
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
            name: isUserExist.name,
            email: isUserExist.EmailID
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

    let usernameCheck = await User.findOne({ username: req.body.username })

    if (usernameCheck) {
        return res.render('./../views/signup-step-two.ejs', {
            id: user._id,
            pageTitle: "Sign Up",
            message: "Username is already taken",
            name: user.name,
            email: user.EmailID
        });
    }

    user.name = req.body.name,
        user.EmailID = req.body.email,
        user.username = req.body.username,
        user.location = req.body.location,
        user.password = hashPassword,
        user.bio = req.body.bio,
        user.profile_pic = req.body.image_src


    // let groups = await Group.find({ members: { "$in": [user._id] } });
    // let m = [];
    // groups.map(group => {

    //     console.log(group.group_name);
    //     console.log(group.members)
    //     m.push(...group.members);

    // });
    // m = m.filter(m => JSON.stringify(m) != JSON.stringify(user._id));
    // user.connection.name = m;

    const savedUser = await user.save();
    return res.redirect('/');

}