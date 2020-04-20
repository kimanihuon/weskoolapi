const jwtOperations = require('./jwt');

function cache() {
    var globalCache;
    this.globalCache = {}
}

cache.prototype.set = function (client) {
    // [ <truth_value>, <verified_user> ]
    var [bool, auth] = jwtOperations.verifySocketToken(client)
    if (bool) {
        // User ID = socket ID
        this.globalCache[auth.credentials._id] = client.id;
        return true;
    } else {
        return false;
    }
}

cache.prototype.getClient = function (userID) {
    return this.globalCache[userID]
}

cache.prototype.getAllClients = function () {
    return this.globalCache;
}

cache.prototype.removeClient = function (userID) {
    delete this.globalCache[userID];
}

module.exports = new cache
