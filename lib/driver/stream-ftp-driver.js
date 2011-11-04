var FTPClient = require('ftp')
  , DeferredDriver = require('../..').driver.DeferredDriver
  , util = require('util')
  , Stream = require('stream').Stream

function FTPDriver (options, stream) {
  this.connected = false
  this.client = null

  DeferredDriver.call(this, options, stream,
    // Initial value of "ready": not ready if authentication required
    function () {
      return !!this.connected && !!options.user
    },
    // Action to perform when not ready: try authenticating
    function (cb) {
      if (!this.connected || !this.client) return cb(false)
      this.client.auth(options.user, options.password, function (err) {
        if (err) {
          stream.emit('error', err)
          cb(false)
        } else {
          stream.emit('ready')
          cb(true)
        }
      })
    }
  )

  var opts = { "host": options.host }
  if (options.port) opts.port = options.port
  if (options.debug) opts.debug = options.debug
  if (options.timeout) opts.connTimeout = options.timeout

  // Connection to FTP server
  this.client = new FTPClient(opts)
  // Communication between the FTP client and the stream
  var self = this
  this.client.on('connect', function () {
    self.connected = true
    self.ready()
  })
  this.client.on('timeout', function () {
    stream.emit('error', new Error('Connection timeout'))
  })
  this.client.on('error', function (err) {
    stream.emit('error', err)
  })
  this.client.on('success', function () {
    stream.emit('success')
  })
  this.client.on('close', function (hasError) {
    if (stream.readable || stream.writable) stream.destroy()
  })
  this.client.on('end', function () {
    if (stream.readable || stream.writable) stream.destroy()
  })
  stream.on('end', function () {
    self.client.end()
  })
  stream.on('close', function () {
    self.client.end()
  })
  stream.on('pipe', function (source) {
    self.source = source
    source.pause()
    self.ready(function () {
      source.resume()
      self.client.put(self.source, self.path, function (err) {
        if (err) {
          self.client.emit('error', err)
        } else {
          self.client.emit('success')
        }
      })
    })
  })
  // Start connection
  this.client.connect()
}

util.inherits(FTPDriver, DeferredDriver)

FTPDriver.prototype.createWritable = function (cb) {
  // Nothing special here, we work on pipe only
  var stream = new Stream
  stream.writable = true
  stream.write = function (chunk) {  }
  stream.end = function () { this.emit('end'); stream.writable = false }
  stream.destroy = function () { this.emit('close'); stream.writable = false }
  stream.destroySoon = function () { this.emit('close'); stream.writable = false }
  cb(undefined, stream)
}

FTPDriver.prototype.createReadable = function (cb) {
  this.ready(function () {
    this.client.get(this.path, function (err, stream) {
      cb(err, stream)
    })
  })
}

module.exports = FTPDriver
