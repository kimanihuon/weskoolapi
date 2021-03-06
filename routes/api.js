const express = require('express');
const router = express.Router();
const User = require('../models/userOdm');
const Chat = require('../models/chatOdm');
const Track = require('../models/trackOdm');
const trackOperations = require('../modules/track');
const logger = require("../modules/logger");
const jwtOperations = require("../modules/authJwt.js");
// May use for uniquely identifying log streams
const uniqueString = require('unique-string');
const adminEmail = process.env.USER_EMAIL;
const adminUsername = process.env.USER_NAME;
const adminPassword = process.env.PASSWORD;

// EXCLUDING A VALUE FROM THE QUERY
// User.findById("5e789884e8ce6c7ca9043bab", function (err, user) {
//     console.log(user)
// }).select('-password')

// Create admin
createAdmin();

// Add users to db
router.post('/register', function (req, res, next) {
    logger.info(`Request: Register post request from I.P: ${req.connection.remoteAddress}`);

    let newUser = new User();

    newUser.email = req.body.email;
    newUser.username = req.body.username;
    newUser.setPassword(req.body.password);

    newUser.save((err, user) => {

        if (err) {
            logger.info(`Error: Registration failed from I.P: ${req.connection.remoteAddress} error: ${err}`)
            res.status(400).send({
                message: "Registration failed."
            });
        } else {
            logger.info(`Registration successful from I.P: ${req.connection.remoteAddress} User ID: ${user._id}`);

            jwtOperations.generateToken(trimUser(user), req, res, next, user._id);
            // res.status(201).send({
            //     message: "Registration successful."
            // });
        }
    });
});

// Validate whether user exists
router.post('/login', function (req, res, next) {

    logger.info(`Login request from I.P: ${req.connection.remoteAddress}`);

    // If username is provided
    if (req.body.username) {
        validate('username', req, res, next)
        // If email is provided
    } else if (req.body.email) {
        validate('email', req, res, next)
    } else {
        //  If nothing is provided
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
            getReferences(trimUser(user), req, res, next, 'verify')
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

// Fetch single track
router.get('/track/single', function (req, res, next) {
    Track.findById({ "_id": req.query.id }, { private: false}, (err, result) => {
        if (err) {
            logger.error(`No track with ID ${req.query.id} found. Requested from: ${req.connection.remoteAddress}  Error: ${err}`)
            res.send({ success: false,  error: 'Server side error' });
        } else if (!result) {
            logger.failed(`No track found with ID: ${req.query.id}. Probably private track. Requested from: ${req.connection.remoteAddress} `);
            res.send({ success: false, error: "Track not available or has been made private" });
        } else {
            logger.success(`Found track with ID: ${req.query.id}. Requested from: ${req.connection.remoteAddress} `);
            res.send({ success: true, result: { track: result } });
        }
    })
})

// Upload files
router.post('/track', jwtOperations.verifyToken, function (req, res, next) {
    if (req.body._id) {
        // Update
        logger.info(`Request: Track update post request from I.P: ${req.connection.remoteAddress}`);
        trackOperations.update(req, res, next);
    } else {
        // Create
        logger.info(`Request: Track create post request from I.P: ${req.connection.remoteAddress}`);
        trackOperations.create(req, res, next)
    }
})

// Delete files
router.post('/track/delete', jwtOperations.verifyToken, function (req, res, next) {
    // Update
    logger.info(`Request: Track delete post request from I.P: ${req.connection.remoteAddress}`);
    trackOperations.deleteTrack(req, res, next);
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
    User.findOne(obj, function (err, user) {
        if (user) {
            // Resolve password
            if (user.validPassword(req.body.password)) {
                logger.info(`Success: Login successful from I.P: ${req.connection.remoteAddress} User ID: ${user._id}`);

                // Get chats then generate token
                getReferences(trimUser(user), req, res, next, 'login');

            } else {
                logger.info(`Error: Login failed from I.P: ${req.connection.remoteAddress} Invalid credentials provided`)
                res.send({
                    success: false,
                    message: "Invalid credentials"
                })
            }

        } else {
            logger.info(`Login failed from I.P: ${req.connection.remoteAddress} Invalid User type error: ${err}`)
            res.send({
                success: false,
                message: "Invalid login details"
            })
        }
    }).catch(next);
}

// Get associated chats
function getReferences(user, req, res, next, type) {

    // With the specific fields we want to get
    User.findOne({ "username": user.username }, { "chats": 1, "friends": 1, "tracks": 1 }).then((result) => {
        // GET ALL CHATS
        Chat.find({ "_id": { "$in": result["chats"] } }).then((chats) => {
            // Assign results to chat
            user.chats = chats;

            // GET ALL FRIENDS
            User.find({ "_id": { "$in": result["friends"] } }).then((friends) => {
                // Assign result to friends
                user.friends = friends;

                // Get all tracks
                Track.find({ "_id": { "$in": result["tracks"] } }).then((tracks) => {
                    // Assign result to tracks
                    user.tracks = tracks;

                    if (type === 'verify') {
                        logger.info(`Success verified user from database from I.P. from I.P. ${req.connection.remoteAddress}`)

                        res.send({ authorized: true, details: user })
                    } else if (type === 'login') {
                        // Generate and sign a json web token
                        // res.cookie('name', 123, { httpOnly: true })
                        jwtOperations.generateToken(user, req, res, next, user._id);
                    }
                });
            });
        });
    }).catch((err) => {
        console.log(err)
    })
}

// Remove unnecessary details
function trimUser(user) {
    var newUser = JSON.parse(JSON.stringify(user))
    delete newUser.salt;
    delete newUser.hash;

    return newUser;
}

// Create admin user
function createAdmin() {
    // Create admin user
    let Admin = new User();
    Admin.email = adminEmail;
    Admin.username = adminUsername;
    Admin.admin = true;
    Admin.setPassword(adminPassword);

    Admin.save((err, user) => {
        if (err) {
            logger.error(`Admin already exists. Error: ${err}`);
        } else {
            logger.info(`Admin user creation successful. User ID: ${user._id}`);
        }
    });
}

module.exports = router;
