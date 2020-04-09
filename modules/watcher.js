const Chat = require('../models/chatOdm');
const logger = require('../modules/logger');
const mongoose = require('mongoose');

function watcher() { }

watcher.prototype.watch = async function () {


    var pipeline = [{
        $match: {
            "documentKey._id": mongoose.Types.ObjectId("5e89ce50ab474943d7b83588"),
        },
    }]

    Chat.watch(pipeline).on('change', (data) => {
        console.log(data);
    });
}

var test = new watcher;
test.watch()

module.exports = new watcher