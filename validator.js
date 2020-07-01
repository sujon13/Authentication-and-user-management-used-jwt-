const Joi = require('@hapi/joi');
const jwt = require('jsonwebtoken');
const User = require('./models/Auth');

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
        if(emailExist)return res.status(400).send({error: 'Email already exists'});

        // duplicate phone number check
        const phoneNumberExist = await User.findOne({phoneNumber: req.body.phoneNumber});
        if(phoneNumberExist)return res.status(400).send({error: 'phone number already exists'});
    } catch(error) {
        console.lol(error);
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
    let userInfo = {email: req.query.userInfo};
    let schema = Joi.object({
        email: Joi.string()
            .min(6)
            .max(100)
            .email({ minDomainSegments: 2 })
    });
    
    const {error} = schema.validate(userInfo);
    if(!error) {
        console.log('It is valid email');
        req.email = req.query.userInfo;
        next();
        return;
    }

    //phone number
    userInfo = {phoneNumber: req.query.userInfo};
    schema = Joi.object({
        phoneNumber: Joi.string()
            .regex(/^01[3456789]{1}[0-9]{8}$/)
            .required()
    });
    
    const {err} = schema.validate(userInfo);

    if(err) {
        console.log(err);
        res.status(400).send({error: 'Email or phone Number is invalid'});
    } else {
        console.log('It is valid phone number');
        req.phoneNumber = req.query.userInfo;
        next();
    }
};

const verifyToken = async (req, res, next) => {
    const token = req.header('Authorization');
    if(!token)return res.status(401).send({error: 'Access Denied! Token is invalid'});

    //verify a token symmetric
    jwt.verify(token, process.env.TOKEN_SECRET, function(err, decoded) {
        if(err)return res.status(401).send(err);
        console.log(decoded);
        req.user = decoded;
        next();
    });

}

module.exports.signupValidator = signupValidator;
module.exports.verifyToken = verifyToken;
module.exports.passwordValidator = passwordValidator;
module.exports.emailOrPhoneNumberValidator= emailOrPhoneNumberValidator;