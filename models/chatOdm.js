const mongoose = require('mongoose');

// Schema template generator
const Schema = mongoose.Schema;

// Subdocument schema for message contents
const messageContents = new Schema({
    text: String,
    images: {
        type: Array,
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// User
const user = new Schema({
    id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    username: {
        type: String
    },
    avatar: {
        type: String
    }
});

// Subdocument schema for message
const messageStructure = new Schema({

    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },

    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },

    contents: messageContents
})

// Subdocument schema for chat
const chat = new Schema({
    messageStructure: messageStructure,
    participants: [user],
    messages: [messageStructure]
})

const Chat = mongoose.model('chat', chat);

module.exports = Chat
