const express = require('express');
const http = require('http');
const logger = require("./modules/logger.js");
const formidable = require('formidable');
const uniqueString = require('unique-string');

var fs = require('fs');
var cors = require('cors');
var app = express();

const corsOptions = {
    origin: 'http://localhost:8080',
    credentials: true,
}

app.use(cors(corsOptions));

var port = 6443;

// Upload files
app.post('/upload', function (req, res, next) {

    logger.info(`Upload request from I.P: ${req.connection.remoteAddress} UTID: ${UTID}`);

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
            var oldpath = files.file.path;
            var newpath = __dirname + '/uploads/' + files.file.name;
            fs.rename(oldpath, newpath, function (err) {
                if (err) {
                    logger.info(`Error saving file to server from I.P: ${req.connection.remoteAddress} err: ${err} UTID: ${UTID}`);
                    res.status(500);
                    res.send();
                } else {
                    logger.info(`Successfully saved file to server from I.P: ${req.connection.remoteAddress} UTID: ${UTID}`)
                    res.status(201)
                    res.send({ success: true });
                }
            });
        }
    });

});

app.post('/remove', function (req, res, next) {

})

httpsServer = http.createServer(app);
server = httpsServer.listen(port, () => logger.info("running server on from port:::::::" + port));


