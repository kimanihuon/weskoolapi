const mongoose = require('mongoose');
var crypto = require('crypto');
var defaultAvatarUrl = 'https://image.flaticon.com/icons/svg/929/929422.svg'

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

    name: {
        type: String,
        default: 'cool user'
    },

    hash: String,

    salt: String,

    about: {
        type: String,
        default: 'My tagine'
    },

    online: {
        type: Boolean,
        default: false
    },

    phone: {
        type: Number,
        default: 0
    },

    seen: {
        type: Date,
        default: Date.now
    },

    email: {
        type: String,
        required: [true, 'Email field is required'],
        unique: true
    },

    avatar: {
        type: String,
        default: defaultAvatarUrl
    },

    created_date: {
        type: Date,
        default: Date.now
    },

    chats: {
        type: Array,
        default: []
    },

    friends: {
        type: Array,
        default: []
    },

    tracks: {
        type: Array,
        default: []
    },

    admin: {
        type: Boolean
    }

});

userSchema.methods.getDefaultUrl = function() {
    return defaultAvatarUrl
}

// Auth
// Method to set salt and hash the password for a user
userSchema.methods.setPassword = function (password) {
    // Creating a unique salt for a particular user 
    this.salt = crypto.randomBytes(16).toString('hex');
    // Hashing user's salt and password with 100 iterations, 64 length and sha512 digest 
    this.hash = crypto.pbkdf2Sync(password, this.salt, 100, 64, `sha512`).toString(`hex`);
}

userSchema.methods.validPassword = function (password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 100, 64, `sha512`).toString(`hex`);
    return this.hash === hash;
}

// Prevent duplicate entries
userSchema.index({ email: 1 }, { unique: true });

// Generate object model for collection: users, using: userSchema
const User = mongoose.model('user', userSchema);

module.exports = User;
