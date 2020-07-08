const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
//const messagebird = require('messagebird')(process.env.MESSAGEBIRD_API_KEY);
const otp = require('../library/otp');


const User = require('../models/Auth');
const { signupValidator, verifyToken,  verifyAdmin, passwordValidator, emailOrPhoneNumberValidator, verifyRefreshToken } = require('../validator');


// admin list
const adminList = ["arifurrahmansujon27@gmail.com"];

router.get('/findAccount', emailOrPhoneNumberValidator, async (req, res) => {

    try {
        let user = undefined;
        if(req.email !== undefined)user = await User.findOne({email: req.email});
        else user = await User.findOne({phoneNumber: req.phoneNumber});

        if(user === undefined || !user)return res.status(404).send({error: 'Account not found'});
        res.status(200).send({message: 'Account Found'});
    } catch(error) {
        console.log(error);
        res.status(500).send({error: 'Internal server error'});
    }
})

router.post('/resetPassword', passwordValidator, async (req,res) => {
    const password = req.body.password;
    const email = req.body.email;
    console.log(`In resetPassword: email: ${email}, password: ${password}`);

    try {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        if(!hashedPassword)return res.status(500).send({error: 'Internal server error'});

        const query = { email: email};
        const update = {
            "$set": {
                password: hashedPassword
            }
        };
        // Return the updated document instead of the original document
        const options = { returnNewDocument: true };

        const updatedUser = await User.findOneAndUpdate(query, update, options);
        if(!updatedUser) {
            console.log('user could not be found or updated');
            return res.status(500).send({error: 'Internal server error'})
        }
    } catch(error) {
        console.log(error);
        res.status(500).send({error: error});
    }

    res.status(200).send({message: 'password is updated!', email: email});
})

// only admin
router.get('/users', verifyToken,  async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    } catch(error) {
        console.log(error);
        res.status(404).send({error: error});
    }
});


router.post('/signup', verifyAdmin, signupValidator, async (req, res) => {
    const body = req.body;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);

    const user = new User({
        name: body.name,
        email: body.email,
        phoneNumber: body.phoneNumber,
        password: hashedPassword,
        isAdmin: req.isAdmin
    });

    // check if request comes from any admin
    if(adminList.includes(body.email))user.isAdmin = true;


    try {
        const savedUser = await user.save();
        if(!savedUser) {
            console.log('user could not be saved');
            return res.status(500).send({error: 'Internal server error'});
        }
        
        const response = {
            name: savedUser.name,
            email: savedUser.email,
            id: savedUser._id,
            phoneNumber: savedUser.phoneNumber
        };
        res.status(201).send(response);
    } catch(error) {
        console.log(error);
        res.status(500).send({error: 'Internal server error'});
    }
});

router.post('/signin', async (req, res) => {
    const body = req.body;

    try {
        var user = await User.findOne({email: req.body.email});
        if(!user)return res.status(401).send({error: 'Email or password is invalid'});

        const isPasswordMatched = await bcrypt.compare(body.password, user.password);
        if(!isPasswordMatched)return res.status(401).send({error: 'Email or password is invalid'});
    } catch(error) {
        console.log(error);
        return res.status(500).send({error: 'Internal server error'});
    }

    
    //create jwt token
    const payload = {
        user_id: user._id,
        isAdmin: user.isAdmin,
        isAccessToken: true
    };
    const payloadForRefreshToken = {...payload};
    payloadForRefreshToken.isAccessToken = false;

    let accessToken = jwt.sign(payload, process.env.TOKEN_SECRET, {expiresIn: '1h'});
    let refreshToken = jwt.sign(payloadForRefreshToken, process.env.TOKEN_SECRET, {expiresIn: '24h'});

    const response = {
        message: 'Logged in successfully',
        email: user.email,
        accessToken: accessToken,
        refreshToken: refreshToken
    };
    res.status(200).send(response);
});

router.get('/refresh', verifyRefreshToken, async (req, res) => {
    console.log(req.user);
    const payload = {...req.user};
    payload.isAccessToken = true;
    let accessToken = jwt.sign(payload, process.env.TOKEN_SECRET, {expiresIn: '1h'});
    res.status(200).send(accessToken);
});

/*
// It was for messagebird api
router.post('/createOtp', (req, res) => {

    const params = {
        originator: 'YourName'
    };
    messagebird.verify.create(req.body.phoneNumber, params, function (err, response) {
        if (err) {
          console.log(err);
          return res.send(err);
        }
        console.log(response);
        return res.send(response);
    });

})


router.post('/verifyOtp', (req, res) => {
    messagebird.verify.verify(req.body.id, req.body.token, function (err, response) {
        if (err) {
          console.log(err);
          return res.send(err);
        }
        console.log(response);
        res.send(response);
      });
      
})
*/

// otp part
router.get('/createOtp', async (req, res, next) => {

    try {
        const createdOtp = await otp.create(req.query.email);
        res.status(createdOtp.statusCode).send(createdOtp);
    } catch(error) {
        console.log(error);
        res.status(error.statusCode).send(error);
    }
})

router.post('/verifyOtp', async (req, res) => {
    console.log(req.body.id, req.body.otp);

    try {
        const verifiedOtp = await otp.verify(req.body.id, parseInt(req.body.otp));
        res.status(verifiedOtp.statusCode).send(verifiedOtp);
    } catch(error) {
        console.log(error);
        res.status(error.statusCode).send(error);
    }
})



module.exports = router;