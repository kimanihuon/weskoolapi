var express = require('express');
var app = express();
const http = require('http');
const homedir = require('os').homedir();
var env = process.env.ENV;
const path = '/projs/DockerWeskool';
const logger = require('./modules/logger');
var port = 7443;

app.use(express.static(__dirname + '/public'));
app.use('/images', express.static( env == 'production' ? '/db/uploads' : (homedir + path + '/db/uploads/')));

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
