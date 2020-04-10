const jwtOperations = require('./jwt');

function cache() {
    var globalCache;
    this.globalCache = {}
}

cache.prototype.set = function (client) {
    // [ <truth_value>, <verified_user> ]
    var [bool, auth] = jwtOperations.verifySocketToken(client)
    if (bool) {
        this.globalCache[auth.credentials._id] = client 
        return true;
    } else {
        return false;
    }
}

cache.prototype.getClient = function (userID){
    return this.globalCache[userID]
}

cache.prototype.getAllClients = function (){
    return this.globalCache;
}

cache.prototype.removeClient = function (userID){
    this.userID = null
}

module.exports = new cache
