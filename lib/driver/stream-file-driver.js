var fs = require('fs')

function Driver (options) {
  this.path = options.path
}

Driver.prototype.createWritable = function () {
  return fs.createWriteStream(this.path)
}

Driver.prototype.createReadable = function () {
  return fs.createReadStream(this.path)
}

module.exports = Driver
