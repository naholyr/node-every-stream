var stream = require('stream')
  , fs = require('fs')
  , path = require('path')
  , util = require('util')
  , BaseDriver = require('../..').driver.BaseDriver

function DirDriver (options, stream) {
  BaseDriver.call(this, options, stream)
  this.writable = false
}

util.inherits(DirDriver, BaseDriver)

DirDriver.prototype.createReadable = function (cb) {
  cb(undefined, new DirectoryLister(this.path))
}

module.exports = DirDriver

function DirectoryLister (path) {
  this.readable = true
  this.buffers = []
  this.paused = false
  var self = this
  fs.readdir(path, function (err, files) {
    if (self.cancelled) {
      return
    }
    if (err) {
      self.emit('error', err)
    } else {
      for (var i=0; i<files.length; i++) {
        var buffer = new Buffer(files[i] + '\n')
        if (this.paused) {
          this.buffers.push(buffer)
        } else {
          self.emit('data', buffer)
        }
      }
      self.emit('end')
    }
    self.readable = false
  })
}

util.inherits(DirectoryLister, stream.Stream)

DirectoryLister.prototype.destroy =     function () { this.readable = false }
DirectoryLister.prototype.destroySoon = function () { this.readable = false }

DirectoryLister.prototype.setEncoding = function () { /* Not implemented yet */ }

DirectoryLister.prototype.pause =       function () { this.paused = true }
DirectoryLister.prototype.resume =      function () { this.paused = false; while (this.buffers.length) this.emit('data', this.buffers.pop()) }
