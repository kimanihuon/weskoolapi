const mongoose = require('mongoose');

// Schema template generator
const Schema = mongoose.Schema;

// Chat id that's going to be referenced in the user document
const chatUserReference = new Schema({
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'chats',
        unique: true
    }
});

// User friends
const friend = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        unique: true
    }
})

// Define user schema
const userSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Name field is required'],
        unique: true
    },

    email: {
        type: String,
        required: [true, 'Email field is required'],
        unique: true
    },

    password: {
        type: String,
        required: [true, 'Password field is required']
    },

    avatar: {
        type: String,
    },

    created_date: {
        type: Date,
        default: Date.now
    },

    chats: [chatUserReference],

    friends: [friend]

});

// Prevent duplicate entries
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ chats: 1 }, { unique: true });

// Generate object model for collection: users, using: userSchema
const User = mongoose.model('user', userSchema);

module.exports = User;
