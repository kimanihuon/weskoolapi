const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const https = require("https");
const homedir = require('os').homedir();
var env = process.env.ENV;
const formidable = require('formidable');
const uniqueString = require('unique-string');
const logger = require('./modules/logger');
const jwtOperations = require('./modules/authJwt');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const User = require('./models/userOdm');
const path = '/projs/weskool/DockerWeskool';
var defaultAvatarUrl = 'https://image.flaticon.com/icons/svg/929/929422.svg'

var fs = require('fs');
var cors = require('cors');
// var csrf = require('csurf');
var app = express();
var port = 6443;
var env = process.env.ENV;
var mongouser = process.env.MONGO_INITDB_ROOT_USERNAME
var mongopassword = process.env.MONGO_INITDB_ROOT_PASSWORD
var uri = `mongodb://${mongouser}:${mongopassword}@127.0.0.1:27017/weskool?authSource=admin`

// var csrfProtection = csrf({ cookie: true });

var whitelist = ['https://weskool.team', 'https://weskool.team', 'http://localhost:80', 'http://localhost:8080']
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
}

// Options
var options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
}

// connect to mongodb
mongoose.connect(uri, options, function (err) {
    if (err) {
        logger.info(`Connection error: ${err}`)
    } {
        logger.info(`Successfully connected to mongo db`)
    }
});

// parse cookies
// we need this because "cookie" is true in csrfProtection
app.use(cookieParser());
app.use(cors(corsOptions));

// Csrf protection
// app.use(csrfProtection);

// Body parser Middleware: Code that runs in between the request and the response
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Upload files
app.post('/upload', jwtOperations.verifyToken, function (req, res, next) {

    // uNIQUE TRANSACTION I.D
    // ... For uniquely identifying server logs
    var UTID = uniqueString();

    logger.info(`Upload request from I.P: ${req.connection.remoteAddress} UTID: ${UTID}`);

    var baseUrl = (env == 'production' ? 'https://weskool.team:7443/images/' : 'http://localhost:7443/images/')

    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

        if (err) {
            logger.info(`Failed Upload request from I.P: ${req.connection.remoteAddress} error: ${err} UTID: ${UTID}`);
            res.status(400);
            res.json({ success: false, message: 'Unable to parse files' })
        } else {

            var imagename = req.verifiedUser._id + '__' + (req.query.profile ? 'profile.png' : files.file.name)
            var oldpath = files.file.path;
            var newpath = (env == 'production' ? '/db/uploads/' + imagename : (homedir + `${path}/db/uploads/`) + imagename);

            fs.copyFile(oldpath, newpath, (err) => {
                if (err) {
                    logger.info(`Error saving file to server from I.P: ${req.connection.remoteAddress} err: ${err} UTID: ${UTID}`);
                    res.status(500);
                    res.send({ success: false });
                } else {
                    // If profile picture upload
                    if (req.query.profile) {
                        update(req, res, next, baseUrl, imagename, UTID)
                    } else {
                        logger.info(`Success: Successfuly saved file to server from I.P: ${req.connection.remoteAddress} UTID: ${UTID}`)
                        res.status(201)
                        res.send({ success: true, url: baseUrl + imagename, image: imagename });
                    }
                }
            });
            fs.unlink(oldpath, (err) => {
                if (err) {
                    logger.info(`Error: failed to unlink file from I.P: ${req.connection.remoteAddress} err: ${err} UTID: ${UTID}`);
                } else {
                    logger.info(`Success: successfully unlinked file from server from I.P: ${req.connection.remoteAddress} err: ${err} UTID: ${UTID}`);
                }
            })
        }
    });

});

app.delete('/delete', jwtOperations.verifyToken, function (req, res, next) {

    // uNIQUE TRANSACTION I.D
    // ... For uniquely identifying server logs
    var UTID = uniqueString();

    logger.info(`Delete request from I.P: ${req.connection.remoteAddress} UTID: ${UTID}`);

    var path = (env == 'production' ? '/db/uploads/' + req.body.file : (homedir + `/projs/DockerWeskool/db/uploads/`) + req.body.file);

    fs.unlink(path, (err) => {
        if (err) {
            logger.info(`Error: failed to delete file from I.P: ${req.connection.remoteAddress} err: ${err} UTID: ${UTID}`);
            res.status(501);
            res.send({ success: false })
        } else {

            if (req.query.profile) {
                User.updateOne({ _id: req.verifiedUser._id }, { avatar: defaultAvatarUrl }, function (err, response) {
                    if (err) {
                        logger.info(`Error: Failed to update user avatar from I.P ${req.connection.remoteAddress} err: ${err} UTID: ${UTID}`);
                        res.status(500);
                        res.send({ success: false });
                        fs.unlink(newpath, (err) => {
                            if (err) {
                                logger.info(`Error: failed to unlink file from I.P: ${req.connection.remoteAddress} err: ${err} UTID: ${UTID}`);
                            } else {
                                logger.info(`Success: successfully unlinked file from server from I.P: ${req.connection.remoteAddress} err: ${err} UTID: ${UTID}`);
                            }
                        })
                    } else {
                        logger.info(`Success: Updated user avatar and successfully deleted file from server from I.P: ${req.connection.remoteAddress} UTID: ${UTID}`)
                        res.status(201)
                        res.send({ success: true });
                    }
                });
            } else {
                logger.info(`Success: Successfully deleted file from server from I.P: ${req.connection.remoteAddress} UTID: ${UTID}`)
                res.status(201)
                res.send({ success: true });
            }
        }
    })

});

// Error handling ... the four parameters are expresses' four default parameters
// Custom middleware 
app.use(function (err, req, res, next) {
    // console.log(err)
    logger.info(`Error: on request from: ${req.connection.remoteAddress} message: ${err.message}`);

    // If duplicate entry error
    if (err.keyValue) {
        res.status(400).send({ success: false, error: "Duplicate entry" })
    } else {
        res.status(400).send({ error: "Request failed, refer to server logs" })
    }
});

function update(req, res, next, baseUrl, imagename, UTID) {
    User.updateOne({ _id: req.verifiedUser._id }, { avatar: baseUrl + imagename }, function (err, response) {
        if (err) {
            logger.info(`Error: Failed to update user avatar from I.P ${req.connection.remoteAddress} err: ${err} UTID: ${UTID}`);
            res.status(500);
            res.send({ success: false });
            fs.unlink(newpath, (err) => {
                if (err) {
                    logger.info(`Error: failed to unlink file from I.P: ${req.connection.remoteAddress} err: ${err} UTID: ${UTID}`);
                } else {
                    logger.info(`Success: successfully unlinked file from server from I.P: ${req.connection.remoteAddress} err: ${err} UTID: ${UTID}`);
                }
            })
        } else {

            logger.info(`Success: Updated user avatar and Successfully saved file to server from I.P: ${req.connection.remoteAddress} UTID: ${UTID}`)
            res.status(201);

            // Include dummy parameter to prevent caching by the browser
            res.send({ success: true, url: baseUrl + imagename + `?dummy=${Math.floor(Math.random() * 1000)}`, image: imagename });
        }
    })
}

if (env == 'production') {
    // TLS Certificates for https
    var tls = {
        Production: {
            privateKey() {
                return fs.readFileSync(process.env.CERTKEY, 'utf8')
            },
            certificate() {
                return fs.readFileSync(process.env.CERTCHAIN, 'utf8')
            },
        }
    }

    var tlsCredentials = { key: tls.Production.privateKey(), cert: tls.Production.certificate() }
    httpsServer = https.createServer(tlsCredentials, app);
    server = httpsServer.listen(port, () => logger.info("Success: secure server running on from port:::::::" + port));
} else {
    httpsServer = http.createServer(app);
    server = httpsServer.listen(port, () => logger.info("Success: running server on from port:::::::" + port));
}
