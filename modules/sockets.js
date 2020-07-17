const User = require('../models/userOdm');
const Chat = require('../models/chatOdm');
const logger = require('../modules/logger');
const userCache = require('../modules/userCache');
const Track = require('../models/trackOdm');
var id;

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

// socketio is the socketio instance
function alert(data, socketio) {

    // console.log(data)

    var clientID = userCache.getClient(data.messageStructure.to);

    if (clientID) {
        if (data._id) {
            // Remove participants, no need to resend the participants
            // If it's already existing chat
            socketio.to(clientID).emit('newMessage', data);
            console.log('Emitted new message')
        } else {
            // New chat
            data._id = id;
            socketio.to(clientID).emit('newChat', data);
            console.log('Emitted new chat')
        }
    } else {
        console.log('clientID is not online')
        // TODO: *Because the user is not online schedule a send operation when online
    }
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

SocketOperations.prototype.send = function (data, client, verifiedUser, socketio) {
    // user is authenticated username and _id

    // I.P address
    var address = client.handshake.address;

    if ((typeof data._id) !== 'undefined') {

        // If chat exists
        Chat.findByIdAndUpdate(data._id, { $push: { 'messages': data.messageStructure }, $inc: { "unread": 1 }, $set: { "seen": false } }, { new: true }, (err, res) => {
            if (err) {
                logger.info(`Error: An error occured adding message to existing chat: ${data._id} from socket: ${client.id} and I.P address: ${address}. Message: ${err.message}`);
                client.emit('sentResponse', { success: false })
            } else {
                var message = res.messages[res.messages.length - 1];
                logger.info(`Success: Successfully added message to: ${data._id} from socket: ${client.id} and I.P address: ${address}.`);
                client.emit('sentResponse', { success: true, type: 'existing', intent: data.intent ? data.intent : 'newMessage', data: message, chatId: data._id });
                alert(data, socketio);
            }
        })

    } else {

        // if chat doesn't exist

        // Copy of message structure
        let struct = JSON.parse(JSON.stringify(data.messageStructure));

        // Clear active chat contents for use in the front end
        data.messageStructure.contents.text = '';
        data.messageStructure.contents.images = [];
        data.messageStructure.contents.timestamp = '';

        // Insert message structure to messages
        data.messages.push(struct);

        data.seen = false;
        data.unread = 1;

        Chat.create(data).then(function (chat) {

            resultArray = [];

            // Number of participants
            for (let index = 0; index < 2; index++) {
                if (associateUser(data, index, chat)) {
                    resultArray[index] = true;
                } else {
                    resultArray[index] = false;
                }
            }

            logger.info(`Success creating chat, socket: ${client.id} from I.P: ${address}, user addition results: ${resultArray}`)

            if (associateUser) {
                client.emit('sentResponse', { success: true, type: 'new', intent: data.intent ? data.intent : 'newChat', data: chat })
                id = chat._id;
                alert(data, socketio)
            }
        })
    }
}

// Use this logic for read receipts while online
SocketOperations.prototype.updateChatStatus = function (data, client, verifiedUser, socketio) {
    // user is authenticated username and _id

    // I.P address
    var address = client.handshake.address;

    Chat.findByIdAndUpdate(data.chatId, { $set: { "unread": 0, "seen": true } }, (err, res) => {
        if (err) {
            logger.error(`Error: An error occured while updating existing chat: ${data.chatId} from socket: ${client.id} and I.P address: ${address}. Message: ${err.message}`);
            client.emit('sentResponse', { success: false })
        } else {
            logger.success(`Success: Successfully updated chat with chatID: ${data.chatId} from socket: ${client.id} and I.P address: ${address}.`);
            client.emit('markSeenResponse', { success: true, type: 'existing', data: data });

            // USE ALERT FOR READ RECEIPTS
            // alert(data, socketio);
        }
    })

}

// Get summaries
SocketOperations.prototype.retrieveSummaries = function (client, verifiedUser, socketio, details) {
    // TODO: verify if request is from admin
    var address = client.handshake.address;

    User.estimatedDocumentCount({}, function (err, res) {
        if (err) {
            logger.error(`Failed to count users from socket: ${client.id} and I.P address: ${address}. Message: ${err.message}`);
            client.emit('summaries', { success: false })
        } else {
            logger.success(`Successfully fetched total chats for socket: ${client.id} and I.P address: ${address}.`);
            client.emit('summaries', { success: true, data: { users: res } });
        }
    });

    Chat.estimatedDocumentCount({}, function (err, res) {
        if (err) {
            logger.error(`Failed to count chats from socket: ${client.id} and I.P address: ${address}. Message: ${err.message}`);
            client.emit('summaries', { success: false })
        } else {
            logger.success(`Successfully fetched total chats for socket: ${client.id} and I.P address: ${address}.`);
            client.emit('summaries', { success: true, data: { chats: res } });
        }
    });

    Track.estimatedDocumentCount({}, function (err, res) {
        if (err) {
            logger.error(`Failed to count tracks from socket: ${client.id} and I.P address: ${address}. Message: ${err.message}`);
            client.emit('summaries', { success: false })
        } else {
            logger.success(`Successfully fetched total tracks from socket: ${client.id} and I.P address: ${address}.`);
            client.emit('summaries', { success: true, data: { tracks: res } });
        }
    });

    // Users who are logged in
    client.emit('summaries', { success: true, data: { online: Object.keys(userCache.getAllClients()).length } });

}

SocketOperations.prototype.updateTrack = function (client, verifiedUser, socketio, details) {
    var address = client.handshake.address;

    Track.findOneAndUpdate({ _id: details.id }, details.data, function (err, res) {
        if (err) {
            logger.error(`Failed to update track: ${details.id} from socket: ${client.id} and I.P address: ${address}. Message: ${err.message}`);
            client.emit('trackUpdated', { success: false })
        } else if (!res) {
            logger.failed(`Failed to update track: ${details.id}, not found. Request from: ${client.id} and I.P address: ${address}. Message: ${err.message}`);
            client.emit('trackUpdated', { success: false })
        } else {
            console.log(res)
            logger.success(`Successfully updated track: ${details.id} from socket: ${client.id} and I.P address: ${address}.`);
            client.emit('trackUpdated', { success: true, result: {track: res} });
        }
    })
}

module.exports = new SocketOperations

