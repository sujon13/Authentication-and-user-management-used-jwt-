const Joi = require('@hapi/joi');
const User = require('./models/Auth');
const createError = require('http-errors');

const minimumPasswordLength = 6;


const signupValidator = async (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string()
            .min(3)
            .max(100)
            .required(),
        email: Joi.string()
            .min(6)
            .max(100)
            .email({ minDomainSegments: 2 })
            .required(),
        phoneNumber: Joi.string()
            .regex(/^01[3456789]{1}[0-9]{8}$/)
            .required()
            .error(errors => {
                errors.forEach(err => {
                    switch (err.type) {
                        case "string.empty":
                            err.message = 'phone number should not be empty!';
                            break;
                        default:
                            err.message = 'Phone number is invalid!';
                            break;
                    }
                });
                return errors;
              }),
        password: Joi.string()
            .min(minimumPasswordLength)
            .required(),

    });
    // input data validation
    const {error} = schema.validate(req.body);
    if(error)return res.status(400).send({error: error.details[0].message});

    try {
        // duplicate email check
        const emailExist = await User.findOne({email: req.body.email});
        if(emailExist){
            return res.status(400).send({error: 'Email already exists'});
        }
        // duplicate phone number check
        const phoneNumberExist = await User.findOne({phoneNumber: req.body.phoneNumber});
        if(phoneNumberExist)return res.status(400).send({error: 'phone number already exists'});
    } catch(error) {
        console.log(error);
        res.status(500).send({error: 'Internal server error'});
    }
    next();
};
 
const passwordValidator = async (req, res,next) => {
    const password = req.body.password;

    if(!password || password.length < minimumPasswordLength) {
        console.log('password must be strong! It should be atleast 6 characters long');
        res.status(400).send({error: 'Password should be atleast 6 characters long'});
    }
    next();
};

const emailOrPhoneNumberValidator = async (req, res, next) => {
    // check if it is email
    let schema = Joi.object({
        email: Joi.string()
            .min(6)
            .max(100)
            .email({ minDomainSegments: 2 })
            .required()
    });
    
    const {error} = schema.validate(req.query);
    if(!error) {
        console.log('It is valid email');
        req.email = req.query.email;
        next();
        return;
    }

    //phone number
    schema = Joi.object({
        phoneNumber: Joi.string()
            .regex(/^01[3456789]{1}[0-9]{8}$/)
            .required()
    });
    
    const { err } = schema.validate(req.query);

    if(err) {
        next(createError(400, 'Email or Phone Number is invalid!'));
    } else {
        console.log('It is valid phone number');
        req.phoneNumber = req.query.phoneNumber;
        next();
    }
};

const pageAndLimitValidation = async (req, res, next) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    
    if(!Number.isInteger(page) || !Number.isInteger(limit)) {
        return next(createError(400, 'page or limit is invalid'));
    }

    req.page = page;
    req.limit = limit;
    next();
};

const mongoDbIdValidation = async (req, res, next) => {
    const mongoDbIdChecker = new RegExp("^[0-9a-fA-F]{24}$");
    const id = req.params.id;
    if(id === undefined) {
        next();
        return;
    }

    if(mongoDbIdChecker.test(id) === false) {
        return next(createError(400, 'id is invalid'));
    }
    next();
};

module.exports.signupValidator = signupValidator;
module.exports.passwordValidator = passwordValidator;
module.exports.emailOrPhoneNumberValidator = emailOrPhoneNumberValidator;
module.exports.mongoDbIdChecker = mongoDbIdValidation;
module.exports.pageAndLimitValidation = pageAndLimitValidation;