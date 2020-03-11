const express = require('express');
const router = express.Router();
const User = require('../models/odm');
const logger = require("../logger/logger");

function validate(type, req, res, next) {

    // Use variable for object key and value
    var obj = {};
    obj[type] = req.body[type]

    // resolves to the Mongoose document if MongoDB found a document with the given id, or null if no document was found.
    User.findOne(obj).then(function (param) {
        if (param) {
            // Resolve password
            if (req.body.password == param.password) {

                logger.info(`Login successful from I.P: ${req.connection.remoteAddress} User ID: ${param._id}`)
                res.send({
                    param
                })
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
                message: "Invalid user"
            })
        }
    }).catch(next);
}

router.get('/users', function (req, res, next) {
    logger.info(`Get request from I.P: ${req.connection.remoteAddress}`)
    res.send({
        success: true,
        message: "Server is live"
    })
})

// Add users to db
router.post('/register', function (req, res, next) {
    logger.info(`Register post request from I.P: ${req.connection.remoteAddress}`)

    // var user = new User(req.body);
    // user.save();
    // ... similar to:
    User.create(req.body).then(function (user) {  // Javascript promise // return saved user
        res.send(user);
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

module.exports = router;
