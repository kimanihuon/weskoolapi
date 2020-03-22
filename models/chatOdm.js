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
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }
});

// Subdocument schema for message
const messageStructure = new Schema({
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

// *TODO: Include the chat schema

// Schema for the chats database
const allChats = new Schema({
    single: [],
});

const Chat = mongoose.model('chat', allChats);

module.exports = Chat
