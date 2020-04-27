const express = require('express');
const jwt = require('jsonwebtoken');
const keyObject = require("../keys/key");
const logger = require("./logger");
var cookie = require('cookie');
const secretkey = keyObject.key;

// Constructor
function jwtOperations() { }

jwtOperations.prototype.generateToken = function (user, req, res, next, id) {
    // Generate and sign a json web token
    // Option: { expiresIn: 30s}

    // Note that cookie size must not exceed 4096 bytes
    var credentials = {username: user.username, _id: user._id}

    jwt.sign({ credentials }, secretkey, (err, token) => {

        if (err) {
            logger.info(`Error generating token for: ${req.connection.remoteAddress} User ID: ${id}. Error: ${err}`);
            res.status(422).send({ success: false, message: "Server error" });
            return;
        } else {
            logger.info(`Web token generated for I.P: ${req.connection.remoteAddress} User ID: ${id}`);
            res.cookie('jwtToken', token, { httpOnly: true })
            res.send({
                // Generated access token
                success: true,
                user,
                token
            })
        }
    })




}

jwtOperations.prototype.setToken = function (req, res, next) {
    // FORMAT OF TOKEN
    // Authorization: Bearer <access_token>

    // Get auth header value
    const bearerHeader = req.headers['authorization'];
    // Check if bearer is undefined
    if (typeof bearerHeader !== 'undefined') {
        // Split token into two separated by array
        const bearer = bearerHeader.split(' ');
        // Get token from array
        const bearerToken = bearer[1];
        // Set the token
        req.token = bearerToken;
        // Next middleware
        next();

    } else {
        // Forbidden
        res.status(403).send({ error: "forbidden" })
    }
}

jwtOperations.prototype.verifyToken = function (req, res, next) {

    jwt.verify(req.cookies.jwtToken, secretkey, (err, auth) => {
        if (err) {
            logger.info(`Token check and verification from I.P: ${req.connection.remoteAddress} FAILED err: ${err.message}`)
            // Forbidden
            res.status(200).send({ success: false, error: "forbidden" })
        } else {
            req.verifiedUser = auth.credentials;
            logger.info(`Token VERIFIED from I.P: ${req.connection.remoteAddress}`)
            next()
        }
    })
}

jwtOperations.prototype.verifySocketToken = function (client) {

    // Client address
    var address = client.handshake.address;

    // Extract cookie information
    var cookies = cookie.parse(client.handshake.headers.cookie);
    // console.log(cookies);

    var success;
    var verifiedUser;

    jwt.verify(cookies.jwtToken, secretkey, (err, auth) => {
        if (err) {
            logger.info(`Socket token check and verification from I.P: ${address} FAILED`)
            // Forbidden
            success = false;
        } else {
            verifiedUser = auth;
            logger.info(`Token from Socket: ${client.id} verified from I.P: ${address}`)
            success = true;
        }
    })

    return [success, verifiedUser];
}

module.exports = new jwtOperations
