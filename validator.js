const Joi = require('@hapi/joi');
const jwt = require('jsonwebtoken');
const User = require('./models/Auth');

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
                            err.message = "phone number should not be empty!";
                            break;
                        default:
                            err.message = `Phone number is invalid!`;
                            break;
                    }
                });
                return errors;
              }),
        password: Joi.string()
            .min(6)
            .required(),

    });
    // input data validation
    const {error} = schema.validate(req.body);
    if(error)return res.status(400).send(error.details[0].message);

    // duplicate email check
    try {
        const emailExist = await User.findOne({email: req.body.email});
        if(emailExist)return res.status(400).send('Email already exists');
    } catch(error) {
        console.lol(error);
        res.status(500).send(`server is facing some error. Please try after some time..`);
    }

    // duplicate phone number check
    try {
        const phoneNumberExist = await User.findOne({phoneNumber: req.body.phoneNumber});
        if(phoneNumberExist)return res.status(400).send('phone number already exists');
    } catch(error) {
        console.log(error);
        res.status(500).send(`server is facing some error. Please try after some time..`);
    }

    next();
};

const verifyToken = async (req, res, next) => {
    const token = req.header('Authorization');
    if(!token)return res.status(401).send({name: 'InvalidToken', message: 'Access Denied!'});

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