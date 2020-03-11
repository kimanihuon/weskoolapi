const mongoose = require('mongoose');

// Schema template generator
const Schema = mongoose.Schema;

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

    created_date: {
        type: Date,
        default: Date.now
    },

})

// Prevent duplicate entries
userSchema.index({ email: 1}, { unique: true })

// Generate object model for collection: users, using: userSchema
const User = mongoose.model('user', userSchema);

module.exports = User;
