//VALIDATIONS
const Joi = require('@hapi/joi');

//FIRST-LOGIN VALIDATION
const firstLoginValidation = data => {
    const schema = Joi.object({
        idcode: Joi.string().min(6).required()
    });
        return schema.validate(data);
    }
    

//REG VALIDATION
const registerValidation = data => {
const schema = Joi.object({
    idcode: Joi.string().min(6).required(),
    name: Joi.string().min(6).required(),
    email: Joi.string().required().email(),
    password: Joi.string().required()
});
    return schema.validate(data);
}

//LOGIN VALIDATION
const loginValidation = data => {
    const schema = Joi.object({
        email: Joi.string().required().email(),
        password: Joi.string().required()
    });
        return schema.validate(data);
    }
    
module.exports.firstLoginValidation = firstLoginValidation;
module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;