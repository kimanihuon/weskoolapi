const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/userOdm');
const Chat = require('../models/chatOdm');
const logger = require("../modules/logger");
const jwtOperations = require("../modules/jwt");
const keyObject = require("../keys/key");
const secretkey = keyObject.key;

// EXCLUDING A VALUE FROM THE QUERY
// User.findById("5e789884e8ce6c7ca9043bab", function (err, user) {
//     console.log(user)
// }).select('-password')


// Get CSRF Token
router.get('/access', function (req, res, next) {
    var csrfToken = req.csrfToken()
    logger.info(`Get request from I.P: ${req.connection.remoteAddress} CSRF Token: ${csrfToken}`)
    // Pass the Csrf Token;
    res.cookie('XSRF-TOKEN', csrfToken);
    // res.locals._csrf = csrfToken;
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
        user.password = true

        // Generate token for user
        jwtOperations.generateToken(user, req, res, next, user._id);
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
router.post('/login/verify', jwtOperations.verifyToken, function (req, res, next) {

    // With callback function
    User.findById(req.verifiedUser._id, function (err, user) {
        if (err || !user) {
            logger.info(`Error getting user details from I.P. ${req.connection.remoteAddress}, message: ${err} or not registered`);
            res.send({ authorized: false, message: "Unable to get user. Probably not registered" })
        } else {
            getReferences(user, req, res, next, 'verify')
        }
    }).select('-password')
});

// Logout
router.post('/logout', jwtOperations.verifyToken, function (req, res, next) {

    try {
        res.clearCookie("jwtToken");
        res.send({ success: true });
        logger.info(`Logout success from I.P ${req.connection.remoteAddress} user I.D. : ${req.verifiedUser._id}`)

    } catch (error) {
        console.log(error)
        res.send({ success: false, message: "Logout error try clearing cookies" })
    }

})

// Update user details
router.post('/update', jwtOperations.verifyToken, function (req, res, next) {
    logger.info(`Details update request from I.P: ${req.connection.remoteAddress} and user I.D ${req.verifiedUser._id} `)

    User.updateOne({ _id: req.verifiedUser._id }, req.body.fields, function (err, doc) {
        if (err) {
            logger.info(`Failed details update request from I.P: ${req.connection.remoteAddress} and user I.D ${req.verifiedUser._id} `)
            res.send({ success: false, message: err })
        } else {
            logger.info(`Successfully updated details from I.P: ${req.connection.remoteAddress} and user I.D ${req.verifiedUser._id} `)
            res.send({ success: true, message: 'User updated successfully' })
        }
    })
})

// Upload files
router.post('/upload', jwtOperations.verifyToken, function (req, res, next) {
    console.log('here')
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
        }).select('-password')
    }).catch(next);
});

// Validate existing user
function validate(type, req, res, next) {

    // Use variable for object key and value
    var obj = {};
    obj[type] = req.body[type]

    // resolves to the Mongoose document if MongoDB found a document with the given id, or null if no document was found.
    User.findOne(obj).then(function (user) {
        if (user) {
            // Resolve password
            if (req.body.password == user.password) {

                logger.info(`Login successful from I.P: ${req.connection.remoteAddress} User ID: ${user._id}`);

                // Filtered details for the user. Excluding the password
                user.password = true

                // Get chats then generate token
                getReferences(user, req, res, next, 'login');

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

// Check whether user exists
function verifyUser(req, index) {

    var result = User.find({ _id: req.body.single.participants[index].id }).exec(function (err, user) {
        if (err) {
            console.log('boom');

            console.log(err.message);
            return false
            // break
        } else {
            // console.log(user)
            return true
        }
    });

    return result;
}

// Get associated chats
function getReferences(user, req, res, next, type) {
    User.findOne({ "username": user.username }, { "chats": 1, "friends": 1 }).then((result) => {
        // GET ALL CHATS
        Chat.find({ "_id": { "$in": result["chats"] } }).then((chats) => {
            // Assign results to chat
            user.chats = chats;

            // GET ALL FRIENDS
            User.find({ "_id": { "$in": result["friends"] } }).then((friends) => {
                // Assign result to friends
                user.friends = friends;

                if (type === 'verify') {
                    logger.info(`Success verified user from database from I.P. from I.P. ${req.connection.remoteAddress}`)
                    res.send({ authorized: true, details: user })
                } else if (type === 'login') {
                    // Generate and sign a json web token
                    res.cookie('name', 123, { httpOnly: true })
                    jwtOperations.generateToken(user, req, res, next, user._id);
                }
            });
        });
    }).catch((err) => {
        console.log(err)
    })
}

module.exports = router;
