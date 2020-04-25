const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const http = require('http');
const https = require("https");
const socket = require('socket.io');
const socketOperations = require('./modules/sockets');
const jwtOperations = require('./modules/jwt');
const userCache = require('./modules/userCache');

// For csrf protection
var cors = require('cors');
var csrf = require('csurf');

const cookieParser = require('cookie-parser');
const fs = require('fs');

var routes = require('./routes/api');
const logger = require("./modules/logger.js");

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

// var uri = 'mongodb://localhost:27017/?replicaSet=rs0'; // If it was only one instance (Single node replica set)

// Define replica db parameters
// var uri = 'mongodb://user:pw@host1.com:27017,host2.com:27017,host3.com:27017/testdb'
var uri = 'mongodb://localhost:27017,localhost:27018,localhost:27019/weskool?replicaSet=rs0'

// Options
var options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
}

// connect to mongodb
mongoose.connect(uri, options, function(err){
    if (err) {
        logger.info(`Connection error: ${err}`)   
    } {
        logger.info(`Successfully connected to mongo db`)
    }
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
    logger.info(`Error: on request from: ${req.connection.remoteAddress} message: ${err.message}`);

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
        res.status(400).send({ success: false, error: "Duplicate entry", message: `${Object.keys(err.keyValue)[0]} already exists` })
    } else {
        res.status(400).send({ error: "Request failed, refer to server logs" })
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

// WEBSOCKET FOR SEARCH
// Socket setup 
var io = socket(server);

io.on('connection', function (client) {

    var address = client.handshake.address;

    // Request headers
    // console.log(client.handshake.headers)

    logger.info(`Made socket connection, I.D: ${client.id} from I.P: ${address}`);

    // Cache the user
    userCache.set(client);

    // Global user search functionality
    client.on('input', function (data) {
        if (jwtOperations.verifySocketToken(client)[0]) {
            socketOperations.search(data, client)
        }
    });

    // Send message
    client.on('send', function (data) {
        // console.log(data)
        var verify = jwtOperations.verifySocketToken(client);
        if (verify[0]) {
            var verifiedUser = verify[1];
            socketOperations.send(data, client, verifiedUser, io)
        }
    });

    client.on('logout', function (data) {
        client.disconnect();
        userCache.removeClient(data)
        logger.info(`Client ${client.id} successfully disconnected from server`);
    });

    client.on('disconnect', function (data) {
        logger.info(`Socket I.D: ${client.id} disconnected from I.P: ${address}`);
        console.log(userCache.getAllClients());
    });

})

// // To update, the field must first be defined in the schema
// User.updateMany({}, { avatar: 'https://cdn.vuetifyjs.com/images/lists/2.jpg' }, function (err, result) {
//     if (err) {
//         console.log(err)
//     } else {
//         console.log(result)
//     }
// })

//Where User is you mongoose user model
// User.updateOne({ username: "Kimani" }, { avatar: "test" }, function (err, result) {
//     if (err) {
//         console.log(err)
//     } else {
//         console.log(result)
//     }
// })
