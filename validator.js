const Joi = require('@hapi/joi');
const User = require('./models/Auth');
const createError = require('http-errors');

const minimumPasswordLength = 6;

const signupValidator = async (req, res, next) => {
    console.log('phone: ', req.phoneNumber);
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        email: Joi.string()
            .min(6)
            .max(100)
            .email({ minDomainSegments: 2 })
            .required(),
        //phoneNumber: Joi.string(),
        phoneNumber: Joi.string()
            .optional()
            .regex(/^01[3456789]{1}[0-9]{8}$/)
            //.required()
            .error((errors) => {
                errors.forEach((err) => {
                    //console.log('erro code: ', err.type);
                    switch (err.code) {
                        case 'string.empty':
                            err.message = 'phone number should not be empty!';
                            break;
                        default:
                            //console.log('type:', err);
                            err.message = 'Phone number is invalid!';
                            break;
                    }
                });
                return errors;
            }),
        password: Joi.string().min(minimumPasswordLength).required()
    });
    // input data validation
    const { error } = schema.validate(req.body);
    if (error) {
        console.log('error: ', error);
        return next(createError(400, error.details[0].message));
    }

    try {
        // duplicate check
        const exists = await User.findOne(
            {
                email: req.body.email    
            }
        );
        if (exists) {
            return next(
                createError(409, 'Email already exists')
            );
        }
        next();
    } catch (error) {
        next(500, error);
    }
};

const passwordValidator = async (req, res, next) => {
    const password = req.body.password;

    if (!password || password.length < minimumPasswordLength) {
        console.log(
            'password must be strong! It should be atleast 6 characters long'
        );
        next(createError(400, 'Password should be atleast 6 characters long'));
        return;
    }
    next();
};

const emailValidator = async (req, res, next) => {
    // check if it is email
    let schema = Joi.object({
        email: Joi.string()
            .min(6)
            .max(100)
            .email({ minDomainSegments: 2 })
            .required()
    });

    const { error } = schema.validate(req.query);
    if (!error) {
        console.log('It is valid email');
        req.email = req.query.email;
        next();
        return;
    } else {
        next(createError(400, 'Email is invalid!'));
    }
};

const pageAndLimitValidation = async (req, res, next) => {
    console.log(req.query.page, req.query.limit);
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    if (!Number.isInteger(page) || !Number.isInteger(limit)) {
        return next(createError(400, 'page or limit is invalid'));
    }

    req.page = page;
    req.limit = limit;
    next();
};

const mongoDbIdValidation = async (req, res, next) => {
    const mongoDbIdChecker = new RegExp('^[0-9a-fA-F]{24}$');
    const id = req.params.id;
    if (id === undefined) {
        next();
        return;
    }

    if (mongoDbIdChecker.test(id) === false) {
        return next(createError(400, 'id is invalid'));
    }
    next();
};

const mongoDbIdCheckerFunc = (id) => {
    const mongoDbIdChecker = new RegExp('^[0-9a-fA-F]{24}$');
    if (id === undefined) {
        return false;
    }

    if (mongoDbIdChecker.test(id) === false) {
        return false;
    }
    return true;
}

module.exports.signupValidator = signupValidator;
module.exports.passwordValidator = passwordValidator;
module.exports.emailValidator = emailValidator;
module.exports.mongoDbIdChecker = mongoDbIdValidation;
module.exports.pageAndLimitValidation = pageAndLimitValidation;
module.exports.mongoDbIdCheckerFunc = mongoDbIdCheckerFunc;
