// The official MongoDB driver for Node.js. 
const { MongoClient } = require('mongodb');
const uri = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=false";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const dbName = 'weskool';

var User = function (name, username, email, password) {
    this.name = name;
    this.username = username;
    this.email = email;
    this.password = password;
    date = Date();
}

var db = function () { }

async function connect() {
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

db.prototype.register = async function (name, username, email, password) {
    var user = new User(name, username, email, password);
    if (await connect()) {
        try {
            await client.db(dbName).collection('users').insertOne(user, function (err, res) {
                if (err) {
                    console.log(err)
                }
                // console.log("1 document inserted");
                client.close();
                console.log(res.result, `Inserted count ${res.insertedCount}`)
            })
            
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    } else {
        console.log("Unable to connect to database")
        return false;
    }
}

db.prototype.login = async function (details) {

}

module.exports = new db;

