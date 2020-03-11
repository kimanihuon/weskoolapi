const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const https = require("https");
const http = require("http");
var app = express();

const routes = require('./routes/api');
const logger = require("./logger/logger.js");
var port = 5443
var env = 'Development';

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

// Body parser Middleware: Code that runs in between the request and the response
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

if (env === 'Development') {
    httpsServer = http.createServer(app);
    httpsServer.listen(port, () => logger.info("running server on from port:::::::" + port))
} else if (env === 'Production') {
    httpsServer = https.createServer(tlsCredentials, app);
    httpsServer.listen(port, () => logger.info("running server on from port:::::::" + port));
}
