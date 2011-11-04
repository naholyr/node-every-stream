var fs = require('fs')
  , util = require('util')
  , BaseDriver = require('../..').driver.BaseDriver

function FileDriver (options, stream) {
  BaseDriver.call(this, options, stream)
}

util.inherits(FileDriver, BaseDriver)

FileDriver.prototype.createWritable = function (cb) {
  cb(undefined, fs.createWriteStream(this.path))
}

FileDriver.prototype.createReadable = function (cb) {
  cb(undefined, fs.createReadStream(this.path))
}

module.exports = FileDriver
