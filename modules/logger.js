var Logger = function () { };

Logger.prototype.info = function (logText) {
    console.log(new Date() + 'info:::::' + logText);
};

Logger.prototype.failed = function (logText) {
    console.log(new Date() + 'failed:::::' + logText);
};

Logger.prototype.debug = function (logText) {
    console.log(new Date() + 'debug:::::' + logText);
};

Logger.prototype.error = function (logText) {
    console.log(new Date() + 'error:::::' + logText);
};

Logger.prototype.success = function (logText) {
    console.log(new Date() + 'success:::::' + logText);
};

module.exports = new Logger();