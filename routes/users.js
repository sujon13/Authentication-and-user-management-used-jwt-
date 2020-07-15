const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const createError = require('http-errors');
const jwt = require('jsonwebtoken');

const User = require('../models/Auth');
const {
    mongoDbIdChecker,
    pageAndLimitValidation,
    signupValidator
} = require('../validator');
const { verifyToken, verifyAdmin } = require('../verification');

// admin list
const adminList = ['arifurrahmansujon27@gmail.com'];

// only admin
router.get('/', verifyAdmin, pageAndLimitValidation, async (req, res) => {
    const page = req.page;
    const limit = req.limit;

    try {
        const users = await User.find(
            {},
            '_id name email phoneNumber isAdmin',
            {
                skip: (page - 1) * limit,
                limit: limit
            }
        );
        res.status(200).send(users);
    } catch (error) {
        next(createError(500, error));
    }
});

// a user can get his own account
router.get('/me', verifyToken, async (req, res, next) => {
    try {
        const user = await User.findById(
            req.user.user_id,
            '_id, name email phoneNumber'
        );
        if (!user) {
            return next(createError(404, `Account not found`));
        }
        res.status(200).send(user);
    } catch (error) {
        next(createError(500, error));
    }
});

// admin can see a user's account
router.get('/:id', verifyAdmin, mongoDbIdChecker, async (req, res, next) => {
    try {
        const user = await User.findById(
            req.params.id,
            '_id, name email phoneNumber'
        );
        if (!user) {
            return next(
                createError(
                    404,
                    `Account not found for user id: ${req.params.id}`
                )
            );
        }

        res.status(200).send(user);
    } catch (error) {
        next(createError(500, error));
    }
});

router.post('/', signupValidator, async (req, res, next) => {
    const body = req.body;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);

    const user = new User({
        name: body.name,
        email: body.email,
        phoneNumber: body.phoneNumber,
        password: hashedPassword,
        isAdmin: false
    });

    // check if request comes from any admin
    if (adminList.includes(body.email)) user.isAdmin = true;

    try {
        const savedUser = await user.save();
        if (!savedUser) {
            return next(createError(500, 'user could not be saved'));
        }

        const response = {
            name: savedUser.name,
            email: savedUser.email,
            id: savedUser._id,
            phoneNumber: savedUser.phoneNumber
        };
        res.status(201).send(response);
    } catch (error) {
        next(error);
    }
});

router.post('/signin', async (req, res, next) => {
    const body = req.body;

    try {
        var user = await User.findOne({ email: req.body.email });
        if (!user)
            return next(createError(401, 'Email or password is invalid'));

        const isPasswordMatched = await bcrypt.compare(
            body.password,
            user.password
        );
        if (!isPasswordMatched)
            return next(createError(401, 'Email or password is invalid'));
    } catch (error) {
        next(error);
    }

    //create jwt token
    const payload = {
        user_id: user._id,
        isAdmin: user.isAdmin,
        isAccessToken: true
    };
    const payloadForRefreshToken = { ...payload };
    payloadForRefreshToken.isAccessToken = false;

    let accessToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
        expiresIn: '1h'
    });
    let refreshToken = jwt.sign(
        payloadForRefreshToken,
        process.env.TOKEN_SECRET,
        { expiresIn: '24h' }
    );

    const response = {
        profile: {
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            _id: user._id
        },
        accessToken: accessToken,
        refreshToken: refreshToken
    };
    res.status(200).send(response);
});

router.put('/:id', verifyToken, mongoDbIdChecker, async (req, res, next) => {
    const body = req.body;
    try {
        const user = await User.findById(
            req.params.id,
            '_id, name, email, phoneNumber'
        );
        if (!user) {
            return next(
                createError(
                    404,
                    `Account not found for user id: ${req.params.id}`
                )
            );
        }

        // ownership verification
        const userId = user._id.toString();
        if (req.user.isAdmin === false && req.user.user_id !== userId) {
            next(createError(403, 'Access Denied! You are not authorized'));
            return;
        }

        // assumed information is already verified by otp for email and phoneNumber update
        if (body.name) user.name = body.name;
        if (body.email) user.email = body.name;
        if (body.phoneNumber) user.phoneNumber = body.phoneNumber;
        // An admin can make a new admin
        if (req.user.isAdmin === true && body.isAdmin)
            user.isAdmin = body.isAdmin;

        const updatedUser = await user.save();
        if (!updatedUser) {
            return next(
                createError(
                    500,
                    `Account with id ${req.params.id} could not be updated`
                )
            );
        }

        res.status(200).send(updatedUser);
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', verifyToken, mongoDbIdChecker, async (req, res, next) => {
    const body = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return next(
                createError(
                    404,
                    `Account not found for user id: ${req.params.id}`
                )
            );
        }

        // ownership verification
        const userId = user._id.toString();
        if (req.user.isAdmin === false && req.user.user_id !== userId) {
            next(createError(403, 'Access Denied! You are not authorized'));
            return;
        }

        const deletedUser = await user.remove();
        if (!deletedUser) {
            return next(
                createError(
                    500,
                    `Account with id ${req.params.id} could not be deleted`
                )
            );
        }
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
