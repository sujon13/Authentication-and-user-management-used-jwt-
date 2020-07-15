const jwt = require('jsonwebtoken');
const createError = require('http-errors');

const verifyToken = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        var token = authHeader.substring(7, authHeader.length);
    } else {
        return next(createError(401, 'Access Denied! Token is invalid'));
    }

    //verify a token symmetric
    jwt.verify(token, process.env.TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return next(createError(401, err));
        }
        console.log(decoded);
        if (decoded.isAccessToken === false) {
            next(createError(401, 'Access Denied! Token is invalid'));
        } else {
            req.user = decoded;
            next();
        }
    });
};

const verifyRefreshToken = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        var token = authHeader.substring(7, authHeader.length);
    } else {
        return next(createError(401, 'Access Denied! Token is invalid'));
    }

    //verify a token symmetric
    jwt.verify(token, process.env.TOKEN_SECRET, function (err, decoded) {
        if (err) return next(createError(401, err));
        console.log(decoded);
        req.user = decoded;
        next();
    });
};

const verifyAdmin = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        var token = authHeader.substring(7, authHeader.length);
    } else {
        return next(createError(401, 'Access Denied! Token is invalid'));
    }

    //verify a token symmetric
    jwt.verify(token, process.env.TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return next(createError(401, err));
        }
        console.log(decoded);
        if (decoded.isAccessToken === false) {
            next(createError(401, 'Access Denied! Token is invalid'));
        } else if (decoded.isAdmin === false) {
            next(
                createError(
                    403,
                    'Access Denied! You do not have enough permission!'
                )
            );
        } else {
            req.user = decoded;
            next();
        }
    });
};

module.exports.verifyToken = verifyToken;
module.exports.verifyRefreshToken = verifyRefreshToken;
module.exports.verifyAdmin = verifyAdmin;
