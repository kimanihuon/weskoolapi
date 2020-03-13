const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/odm');
const logger = require("../logger/logger");
const keyObject = require("../keys/key");
const secretkey = keyObject.key;

// Get CSRF Token
router.get('/access', function (req, res, next) {
    var csrfToken = req.csrfToken()
    logger.info(`Get request from I.P: ${req.connection.remoteAddress} CSRF Token: ${csrfToken}`)
    // Pass the Csrf Token
    // res.cookie('XSRF-TOKEN', req.csrfToken());
    res.cookie('XSRF-TOKEN', csrfToken);     
    res.locals._csrf = csrfToken;
    res.json({
        success: true,
        message: "Server is live"
    })

});

// Add users to db
router.post('/register', function (req, res, next) {
    logger.info(`Register post request from I.P: ${req.connection.remoteAddress}`)

    // var user = new User(req.body);
    // user.save();
    // ... similar to:
    User.create(req.body).then(function (user) {  // Javascript promise // return saved user
        // Filtered details for the user. Excluding the password
        var filteredDetails = { id: user._id, username: user.username, email: user.email }
        // Generate token for user
        generateToken(filteredDetails, req, res, user._id);
        logger.info(`Registration successful from I.P: ${req.connection.remoteAddress} User ID: ${user._id}`)
    }).catch(
        next
    ) // Send all the data to the next function

    // res.send({ type: 'POST', name: req.body.name, rank: req.body.class });
});

// Validate whether user exists
router.post('/login', function (req, res, next) {
    logger.info(`Login request from I.P: ${req.connection.remoteAddress}`)

    // If username is provided
    if (req.body.username) {
        validate('username', req, res, next)
        // If email is provided
    } else if (req.body.email) {
        validate('email', req, res, next)
        //  If nothing is provided
    } else {
        logger.info(`Login failed from I.P: ${req.connection.remoteAddress} No credentials provided`)
        res.send({
            success: false,
            message: "No credentials provided"
        })
    }
});

// Session check
router.post('/login/verify', verifyToken, function (req, res, next) {
    res.send({ authorized: true })
})

// Update user details
router.put('/users/:id', function (req, res, next) {
    logger.info(`Put request from I.P: ${req.connection.remoteAddress}`)
    // Update
    User.findByIdAndUpdate({ _id: req.params.id }, req.body).then(function () {

        // Return updated value
        User.findOne({ _id: req.params.id }, req.body).then(function (user) {
            res.send(user);
            console.log('successfully updated user with id: ' + user._id)
        })
    }).catch(next);
})

// Validate existing user
function validate(type, req, res, next) {

    // Use variable for object key and value
    var obj = {};
    obj[type] = req.body[type]

    // resolves to the Mongoose document if MongoDB found a document with the given id, or null if no document was found.
    User.findOne(obj).then(function (param) {
        if (param) {
            // Resolve password
            if (req.body.password == param.password) {

                logger.info(`Login successful from I.P: ${req.connection.remoteAddress} User ID: ${param._id}`);

                // Filtered details for the user. Excluding the password
                var user = { id: param._id, username: param.username, email: param.email }

                // Generate and sign a json web token
                generateToken(user, req, res, param._id);

            } else {
                logger.info(`Login failed from I.P: ${req.connection.remoteAddress} Invalid credentials provided`)
                res.send({
                    success: false,
                    message: "Invalid credentials"
                })
            }

        } else {
            logger.info(`Login failed from I.P: ${req.connection.remoteAddress} Invalid User type`)
            res.send({
                success: false,
                message: "Invalid login details"
            })
        }
    }).catch(next);
}

// JWT functions
function generateToken(user, req, res, id) {
    // Generate and sign a json web token
    // Option: { expiresIn: 30s}

    jwt.sign({ user }, secretkey, (err, token) => {

        if (err) {
            logger.info(`Error generating token for: ${req.connection.remoteAddress} User ID: ${id}. Error: ${err}`);
            res.status(422).send({ success: false, message: "Server error" });
            return;
        } else {
            res.cookie('jwtToken', token, { httpOnly: true })
            res.json({
                // Generated access token
                success: true,
                user,
                token
            })
            logger.info(`Web token generated for I.P: ${req.connection.remoteAddress} User ID: ${id}`);

        }
    })

}

// function setToken(req, res, next) {
//     // FORMAT OF TOKEN
//     // Authorization: Bearer <access_token>

//     // Get auth header value
//     const bearerHeader = req.headers['authorization'];
//     // Check if bearer is undefined
//     if (typeof bearerHeader !== 'undefined') {
//         // Split token into two separated by array
//         const bearer = bearerHeader.split(' ');
//         // Get token from array
//         const bearerToken = bearer[1];
//         // Set the token
//         req.token = bearerToken;
//         // Next middleware
//         next();

//     } else {
//         // Forbidden
//         res.status(403).send({ error: "forbidden" })
//     }
// }

function verifyToken(req, res, next) {

    jwt.verify(req.cookies.jwtToken, secretkey, (err, auth) => {
        if (err) {
            logger.info(`Token check and verification from I.P: ${req.connection.remoteAddress} FAILED`)
            // Forbidden
            res.status(403).send({ success: true, error: "forbidden" })
        } else {
            logger.info(`Token VERIFIED from I.P: ${req.connection.remoteAddress}`)
            next()
        }
    })
}

module.exports = router;
