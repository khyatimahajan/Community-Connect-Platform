// Validations
const Joi = require('@hapi/joi');

// First login validation
const firstLoginValidation = (data) => {
	const schema = Joi.object({
		idcode: Joi.string().min(6).required(),
	});
	return schema.validate(data);
};

// Registration
const registerValidation = (data) => {
	const schema = Joi.object({
		image_src: Joi.string().required(),
		name: Joi.string().required(),
		email: Joi.string().required().email(),
		username: Joi.string().min(3).required(),
		location: Joi.string(),
		bio: Joi.string().required(),
		password: Joi.string().min(6).required(),
		password_conf: Joi.string().required(),
		id: Joi.string(),
	});
	return schema.validate(data);
};

// login
const loginValidation = (data) => {
	const schema = Joi.object({
		email: Joi.string().required().email(),
		password: Joi.string().required(),
		timezone: Joi.string(),
	});
	return schema.validate(data);
};

// Update profile
const updateProfile = (data) => {
	const schema = Joi.object({
		name: Joi.string().min(4).required(),
		location: Joi.string(),
		bio: Joi.string().min(3).required(),
	});
	return schema.validate(data);
};

// Reset profile
const resetPassword = (data) => {
	const schema = Joi.object({
		currentPassword: Joi.string().required(),
		newPassword: Joi.string().min(6).required(),
		cnewPassword: Joi.any()
			.valid(Joi.ref('newPassword'))
			.required()
			.label('Passwords are not matching'),
	});
	return schema.validate(data);
};

module.exports.firstLoginValidation = firstLoginValidation;
module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.resetPassword = resetPassword;
module.exports.updateProfile = updateProfile;
