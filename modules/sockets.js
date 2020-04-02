const User = require('../models/userOdm');
const Chat = require('../models/chatOdm');
const logger = require('../modules/logger');

function SocketOperations() { }

// Associate user to chat
function associateUser(data, idx, chat) {

    var result;
    result = User.findOneAndUpdate(
        { _id: data.participants[idx] },
        { $push: { chats: chat._id } },
        { upsert: true },
        function name(err, doc) {
            if (err) {
                console.log(err);
                return false;
            } else {
                // console.log(doc)
                return true
            }
        })

    return result;
}

// Search for usernames
SocketOperations.prototype.search = function (data, client) {
    var reg = new RegExp(`\^${data.input}`, "i");

    User.find({ username: { $regex: reg } }, ['username', '_id', 'avatar'], function (err, user) {
        if (err) {
            console.log(err);
            client.emit('response', user)
        } else {
            // console.log(user)
            client.emit('response', user)
        }
    }).limit(5)
}

SocketOperations.prototype.send = function (data, client) {
    
    var address = client.handshake.address;

    if ((typeof data._id) !== 'undefined') {
        logger.info("here")

    } else {

        // Insert message structure to messages
        data.messages.push(data.messageStructure);

        Chat.create(data).then(function (chat) {

            resultArray = [];
            
            // Number of participants
            for (let index = 0; index < 2; index++) {
                if (associateUser(data, index, chat)){
                    resultArray[index] = true;
                } else {
                    resultArray[index] = false;
                }
            }

            logger.info(`Success creating chat, socket: ${client.id} from I.P: ${address}, user addition results: ${resultArray}`)

            if (associateUser) {
                client.emit('sentResponse', { success: true, data: chat })   
            }
        })
    }
}

module.exports = new SocketOperations

