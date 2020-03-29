const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const http = require('http');
const https = require("https");
const socket = require('socket.io');
const User = require('./models/userOdm');

// For csrf protection
var cors = require('cors');
var csrf = require('csurf');

const cookieParser = require('cookie-parser');
const fs = require('fs');

var routes = require('./routes/api');
const logger = require("./logger/logger.js");

// Implement environment variables
var port = 5443;
var env = 'Development';

var app = express();

// For Cross Origin Request Sharing Authorization
// TODO: REMEMBER TO USE VARIABLE FOR ORIGIN
const corsOptions = {
    origin: 'http://localhost:8080',
    credentials: true,
}

// Activate cors
app.use(cors(corsOptions));

// setup route middlewares
var csrfProtection = csrf({ cookie: true });

// parse cookies
// we need this because "cookie" is true in csrfProtection
app.use(cookieParser());
app.use(csrfProtection);

// Body parser Middleware: Code that runs in between the request and the response
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// connect to mongodb
mongoose.connect('mongodb://localhost:27017/weskool', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
});
// mongoose.Promise = global.Promise
// res.end() to end the response
// res.send() to send a response

// Initialize routes
app.use('/api', routes);

// Error handling ... the four parameters are expresses' four default parameters
// Custom middleware 
app.use(function (err, req, res, next) {
    // console.log(err)
    logger.info(`Error on request from: ${req.connection.remoteAddress} message: ${err.message}`);

    // If duplicate entry error
    if (err.keyValue) {
        // User variable as key for unknown value:
        // ... e.g. 
        // ... var key = "happyCount";
        // ... var obj = {};
        // ... obj[key] = someValueArray;
        // ... myArray.push(obj);
        // var duplicate = {};
        // duplicate[Object.keys(err.keyValue)[0]] = err.keyValue[Object.keys(err.keyValue)[0]]
        res.status(422).send({ success: false, error: "Duplicate entry", message: `${Object.keys(err.keyValue)[0]} already exists` })
    } else {
        res.status(422).send({ error: "Request failed, refer to server logs" })
    }
});

var server;

if (env === 'Development') {
    httpsServer = http.createServer(app);
    server = httpsServer.listen(port, () => logger.info("running server on from port:::::::" + port));

} else if (env === 'Production') {
    // TLS Certificates for https
    var tls = {
        Production: {
            privateKey() {
                return fs.readFileSync('/etc/letsencrypt/live/', 'utf8')
            },
            certificate() {
                return fs.readFileSync('/etc/letsencrypt/live/', 'utf8')
            },
        }
    }

    var tlsCredentials = { key: tls.Production.privateKey(), cert: tls.Production.certificate() }
    httpsServer = https.createServer(tlsCredentials, app);
    server = httpsServer.listen(port, () => logger.info("running server on from port:::::::" + port));
}

function search(data, client) {
    var reg = new RegExp( `\^${data.input}`, "i" );

    User.find({ username: { $regex: reg } }, ['username', '_id', 'avatar'], function (err, user) {
        if (err) {
            console.log(err);
            client.emit('response', user)
        } else {
            console.log(user)
            client.emit('response', user)
        }
    }).limit(10)
}

// WEBSOCKET FOR SEARCH
// Socket setup 
var io = socket(server);

io.on('connection', function (client) {

    logger.info(`Made socket connection, I.D: ${client.id}`)

    client.on('input', function (data) {
        search(data, client)
    });

    client.on('disconnect', function (data) {
        console.log(data)
        logger.info(`Socket I.D: ${client.id} disconnected`)
    })

})
