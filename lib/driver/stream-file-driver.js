var fs = require('fs')

function Driver (options) {
  this.path = options.path
}

Driver.prototype.createWritable = function (cb) {
  cb(undefined, fs.createWriteStream(this.path))
}

Driver.prototype.createReadable = function (cb) {
  cb(undefined, fs.createReadStream(this.path))
}

module.exports = Driver
