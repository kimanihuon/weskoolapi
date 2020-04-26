const Track = require('../models/trackOdm');
const logger = require('../modules/logger');
const User = require('../models/userOdm');

function trackOperations() { }

// Associate user to chat
function associateUser(trackid, userid) {

    var result;
    result = User.findOneAndUpdate(
        { _id: userid },
        { $push: { tracks: trackid } },
        { upsert: true },
        function name(err, doc) {
            if (err) {
                logger.info(`Error: Failed to associate user: ${userid} with track: ${trackid}`)
                return false;
            } else {
                // console.log(doc)
                logger.info(`Success: Successfully associated user: ${userid} with track: ${trackid}`)
                return true
            }
        })

    return result;
}

trackOperations.prototype.create = function (req, res, next) {
    Track.create(req.body).then(function (track) {
        logger.info(`Success: Track created successfully with ID: ${track._id} from user ${req.verifiedUser._id} and IP: ${req.connection.remoteAddress}`);
        associateUser(track._id, req.verifiedUser._id)
        res.send({ success: true, trackid: track._id })
    }).catch(
        next
    )
}

trackOperations.prototype.update = function (req, res, next) {
    Track.findByIdAndUpdate(req.body._id, req.body, (err, result) => {
        if (err) {
            logger.info(`Error: Failed to update the track ID: ${req.body._id} from User ID: ${req.verifiedUser._id} from I.P: ${req.connection.remoteAddress} error: ${err}`)
            res.send({ success: false })
        } else {
            logger.info(`Success: updated the track ID: ${result._id} from User ID: ${req.verifiedUser._id} from I.P: ${req.connection.remoteAddress}`)
            res.send({ success: true })
        }
    })
}

trackOperations.prototype.deleteTrack = function (req, res, next) {
    Track.findByIdAndDelete(req.body, (err, result) => {
        if (err) {
            logger.info(`Error: failed to delete track ID: ${req.body._id} from User ID: ${req.verifiedUser._id} from I.P ${req.connection.remoteAddress} error: ${err}`)
            res.send({ success: false })
        } else {
            logger.info(`Success: deleted the track ID: ${req.body._id} from User ID: ${req.verifiedUser._id} from I.P: ${req.connection.remoteAddress}`)
            res.send({ success: true })
        }
    })
}

module.exports = new trackOperations
