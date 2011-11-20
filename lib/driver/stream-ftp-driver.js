var FTPStream = require('ftp-stream')
  , util = require('util')
  , BaseDriver = require('../..').driver.BaseDriver

function FTPDriver (options, stream) {
  BaseDriver.call(this, options, stream)
  this.options = options
}

util.inherits(FTPDriver, BaseDriver)

FTPDriver.prototype.createWritable = function (cb) {
  cb(undefined, new FTPStream.Writable(this.options))
}

FTPDriver.prototype.createReadable = function (cb) {
  cb(undefined, new FTPStream.Readable(this.options))
}

module.exports = FTPDriver
