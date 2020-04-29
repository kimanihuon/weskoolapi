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

var fs = require('fs');
var cors = require('cors');
var csrf = require('csurf');
var app = express();
var port = 6443;

var csrfProtection = csrf({ cookie: true });

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

// parse cookies
// we need this because "cookie" is true in csrfProtection
app.use(cookieParser());
app.use(cors(corsOptions));

// Csrf protection
app.use(csrfProtection);

// Body parser Middleware: Code that runs in between the request and the response
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Upload files
app.post('/upload', jwtOperations.verifyToken, function (req, res, next) {

    logger.info(`Upload request from I.P: ${req.connection.remoteAddress} UTID: ${UTID}`);

    var baseUrl = ( env == 'production' ? 'https://weskool.team:7443/images/' : 'http://localhost:7443/images/')

    // uNIQUE TRANSACTION I.D
    // ... For uniquely identifying server logs
    var UTID = uniqueString();
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

        if (err) {
            logger.info(`Failed Upload request from I.P: ${req.connection.remoteAddress} error: ${err} UTID: ${UTID}`);
            res.status(400);
            res.json({ success: false, message: 'Unable to parse files' })
        } else {
            var imagename = req.verifiedUser._id + '__' + files.file.name
            var oldpath = files.file.path;
            var newpath = (env == 'production' ? '/db/uploads/' + imagename  : (homedir + `/projs/DockerWeskool/db/uploads/`) + imagename);

            fs.copyFile(oldpath, newpath, (err) => {
                if (err) {
                    logger.info(`Error saving file to server from I.P: ${req.connection.remoteAddress} err: ${err} UTID: ${UTID}`);
                    res.status(500);
                    res.send({ success: false });
                } else {
                    logger.info(`Success: Successfully saved file to server from I.P: ${req.connection.remoteAddress} UTID: ${UTID}`)
                    res.status(201)
                    res.send({ success: true, url: baseUrl + imagename });
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

app.post('/remove', jwtOperations.verifyToken, function (req, res, next) {

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
