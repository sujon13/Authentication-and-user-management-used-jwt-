const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
//const messagebird = require('messagebird')(process.env.MESSAGEBIRD_API_KEY);
const otp = require("../library/otp");
const createError = require("http-errors");

const User = require("../models/Auth");
const {
  passwordValidator,
  emailOrPhoneNumberValidator,
} = require("../validator");
const { verifyRefreshToken } = require("../verification");

router.get(
  "/account/find",
  emailOrPhoneNumberValidator,
  async (req, res, next) => {
    try {
      const user = await User.findOne({
        $or: [{ email: req.email }, { phoneNumber: req.phoneNumber }],
      });

      if (!user) {
        return next(createError(404, "Account not found!"));
      }
      res.status(200).send("Account Found");
    } catch (error) {
      next(error);
    }
  }
);

// assumed first finds account then verified by otp
router.post("/password/reset", passwordValidator, async (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  console.log(`In resetPassword: email: ${email}, password: ${password}`);

  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    if (!hashedPassword) return next(createError(500));

    const query = { email: email };
    const update = {
      $set: {
        password: hashedPassword,
      },
    };
    // Return the updated document instead of the original document
    const options = { returnNewDocument: true };

    const updatedUser = await User.findOneAndUpdate(query, update, options);
    if (!updatedUser) {
      return next(createError(500, "user could not be found or updated"));
    }
  } catch (error) {
    return next(error);
  }

  res.status(200).send({ message: "password is updated!", email: email });
});

router.get("/token/refresh", verifyRefreshToken, async (req, res) => {
  console.log(req.user);
  const payload = { ...req.user };
  payload.isAccessToken = true;
  let accessToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
    expiresIn: "1h",
  });
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
// otp creation and send to given email
router.post("/otps/request", async (req, res, next) => {
  try {
    const createdOtp = await otp.create(req.body.email);
    res.status(createdOtp.statusCode).send(createdOtp);
  } catch (error) {
    next(error);
  }
});

// otp verify
router.post("/otps/verify", async (req, res) => {
  console.log(req.body.id, req.body.otp);

  try {
    const verifiedOtp = await otp.verify(req.body.id, parseInt(req.body.otp));
    res.status(verifiedOtp.statusCode).send(verifiedOtp);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
