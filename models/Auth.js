const moongoose = require('mongoose');

const UserSchema = new moongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 3,
        max: 100
    },
    email: {
        type: String,
        required: true,
        min: 6,
        max: 100,
        unique: true
    },
    phoneNumber: {
        type: Number,
    },
    password: {
        type: String,
        required: true,
        min: 6
    },
    isAdmin: {
        type: Boolean,
        required: false,
        default: false
    },
    profilePicUrl: {
        type: String
    }
});

module.exports = moongoose.model('Account', UserSchema);
