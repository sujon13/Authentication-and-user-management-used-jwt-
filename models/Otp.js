const moongoose = require("mongoose");
const { required } = require("@hapi/joi");

const OtpSchema = new moongoose.Schema({
    email: {
        type: String,
        required: true,
        min: 6,
        max: 100,
        unique: true,
    },
    createdAt: {
        type: Date,
    },
    otp: {
        type: Number,
        required: true,
    },
});

module.exports = moongoose.model("otp", OtpSchema);
