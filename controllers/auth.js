const bcrypt = require('bcryptjs');
const saltRounds = 12;

const User = require('./../model/User');
const validator = require('./../validation');
const { unescapeQuotes } = require('./../utils/index');

// Get User Id check
module.exports.getSignupStepOne = (req, res, next) => {
	res.render('./../views/signup-step-one.ejs', {
		pageTitle: 'Sign up',
		form: [],
		message: [],
		error: false,
	});
};

// Get Signup screen
module.exports.getSignupStepTwo = async (req, res, next) => {
	const { id } = req.session.signup_user_param;

	//Check if user id is valid
	try {
		let isUserExist = await User.findById(id);
		if (!isUserExist) {
			return res.redirect('/signup');
		}
	} catch (err) {
		return res.redirect('/signup');
	}

	res.render('./../views/signup-step-two.ejs', {
		pageTitle: 'Sign up',
		id,
		form: [],
		message: null,
		body: req.session.signup_user_param,
	});
};

// Get login
module.exports.getLogin = (req, res, next) => {
	res.render('./../views/login.ejs', {
		pageTitle: 'Login',
		message: null,
		input: {},
	});
};

// Check user_id
module.exports.getCheckUser = async (req, res, next) => {
	const user_id = req.body.idCode;
	try {
		// user_id check
		let isUserExist = await User.findOne({ user_id: user_id });
		if (isUserExist && isUserExist.username) {
			return res.render('./../views/signup-step-one.ejs', {
				pageTitle: 'Sign up',
				form: [],
				message: [],
				error:
					'This account already exists. Please sign in instead using the email you provided for the study and the password you set for this account',
			});
		}
		if (!isUserExist) {
			return res.render('./../views/signup-step-one.ejs', {
				pageTitle: 'Sign up',
				form: [],
				message: [],
				error: 'No account found',
			});
		}

		let userParam = {
			id: isUserExist._id,
			name: isUserExist.name,
			email: isUserExist.EmailID,
		};

		req.session.signup_user_param = userParam;

		res.render('./../views/choose-avatar.ejs', {
			id: isUserExist._id,
			pageTitle: 'Sign Up',
			message: null,
			body: { name: isUserExist.name, email: isUserExist.EmailID },
		});
	} catch (err) {
		let error = new Error(err);
		next(error);
	}
};

// Create a  new user
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
			pageTitle: 'Sign Up',
			message: error.details[0].message,
			body: req.body,
		});
	}

	//Password check
	if (req.body.password != req.body.password_conf) {
		return res.render('./../views/signup-step-two.ejs', {
			id: user._id,
			pageTitle: 'Sign Up',
			message: 'Passwords are not matching',
			body: req.body,
		});
	}

	//Password hash making
	const hashPassword = await bcrypt.hash(req.body.password, saltRounds);
	let usernameCheck = await User.findOne({ username: req.body.username });

	// Username duplication check
	if (usernameCheck) {
		return res.render('./../views/signup-step-two.ejs', {
			id: user._id,
			pageTitle: 'Sign Up',
			message: 'Username is already taken',
			body: req.body,
		});
	}

	console.log(req.body.bio);

	//User creation
	user.name = req.body.name;
	user.EmailID = req.body.email;
	user.username = unescapeQuotes(req.body.username);
	user.location = unescapeQuotes(req.body.location);
	user.password = hashPassword;
	user.bio = unescapeQuotes(req.body.bio);
	user.profile_pic = req.body.image_src;

	await user.save();
	return res.redirect('/');
};
