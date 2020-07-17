const mongoose = require('mongoose');

// Schema template generator
const Schema = mongoose.Schema;

// Subdocument schema for message contents
const track = new Schema({
    name: {
        type: String
    },
    private: {
        type: Boolean,
        default: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    active: {
        type: Boolean
    },
    blocks: {
        type: Array
    },
    archived: {
        type: Array
    }
});

const Track = mongoose.model('track', track);

module.exports = Track;
