const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/Auth');
const { signupValidator, verifyToken } = require('../validator');
const { ref } = require('@hapi/joi');


router.get('/refresh', verifyToken, async (req, res) => {
    console.log(req.user);
    let accessToken = jwt.sign({user_id: req.user._id}, process.env.TOKEN_SECRET, {expiresIn: '1m'});
    res.status(200).send(accessToken);
});

router.get('/users', verifyToken,  async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    } catch(error) {
        console.log(error);
        res.status(404).send(error);
    }
});


router.post('/signup', signupValidator, async (req, res) => {
    const body = req.body;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);

    const user = new User({
        name: body.name,
        email: body.email,
        phoneNumber: body.phoneNumber,
        password: hashedPassword
    });

    try {
        const savedUser = await user.save();
        if(!savedUser) {
            console.log(`user could not be saved`);
            res.status(500).send(`server is facing some error. Please try after some time..`);
        }
        res.status(201).send(savedUser);
    } catch(error) {
        console.log(error);
        res.status(500).send(`server is facing some error. Please try after some time..`);
    }
});

router.post('/signin', async (req, res) => {
    const body = req.body;

    try {
        var user = await User.findOne({email: req.body.email});
        if(!user)return res.status(401).send('Email or password isInvalid');

        const isPasswordMatched = await bcrypt.compare(body.password, user.password);
        if(!isPasswordMatched)return res.status(401).send('Email or password isInvalid');
    } catch(error) {
        console.log(error);
        res.status(500).send(`server is facing some error. Please try after some time..`);
    }

    
    //create jwt token
    let accessToken = jwt.sign({user_id: user._id}, process.env.TOKEN_SECRET, {expiresIn: '1m'});
    let refreshToken = jwt.sign({user_id: user._id}, process.env.TOKEN_SECRET, {expiresIn: '24h'});

    const response = {
        message: 'Logged in successfully',
        email: user.email,
        accessToken: accessToken,
        refreshToken: refreshToken
    };
    res.status(200).send(response);
});



router.get('/:postId', async (req, res) => {
    try {
        console.log(req.params.postId);
        const post = await Post.findById(req.params.postId);
        if(!post)throw new Error('Invalid id');
        res.status(201).send(post);
    } catch(error) {
        console.log(error.message);
        res.status(404).send(error.message);
    }
})

router.delete('/:postId', async (req, res) => {
    try {
        const removedPost = await Post.deleteOne({ _id: req.params.postId });
        if(!removedPost) {
            console.log('postmnot found');
        }
        console.log(removedPost);
        res.status(200).send(removedPost);
    } catch(error) {
        console.log(error);
        res.status(404).send(error);
    }
})

router.put('/:postId', async (req, res) => {
    try {
        const updatedPost = await Post.updateOne(
            { _id: req.params.postId },
            {
                $set: {title: req.body.title}
            }
        );
        if(!updatedPost) {
            console.log('post not found');
        }
        console.log(updatedPost);
        res.status(200).send(updatedPost);
    } catch(error) {
        console.log(error);
        res.status(404).send(error);
    }
})


module.exports = router;