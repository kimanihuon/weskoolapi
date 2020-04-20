const express = require('express');
const http = require('http');
const logger = require("./modules/logger.js");

var cors = require('cors');
var app = express();

const corsOptions = {
    origin: 'http://localhost:8080',
    credentials: false,
}

app.use(cors(corsOptions));

var port = 5555;

// Upload files
app.post('/upload', function (req, res, next) {
    console.log('here')
})

httpsServer = http.createServer(app);
server = httpsServer.listen(port, () => logger.info("running server on from port:::::::" + port));


