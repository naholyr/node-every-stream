var FTPClient = require('ftp')
  , DeferredDriver = require('../..').driver.DeferredDriver
  , util = require('util')

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
          cb(true)
        }
      })
    }
  )

  this.writable = false

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
  // Start connection
  this.client.connect()
}

util.inherits(FTPDriver, DeferredDriver)

/*FTPDriver.prototype.createWritable = function (cb) {
  this.ready(function () {
    cb(new Error('Not implemented yet: readonly in current version'))
  })
}*/

FTPDriver.prototype.createReadable = function (cb) {
  this.ready(function () {
    this.client.get(this.path, function (err, stream) {
      cb(err, stream)
    })
  })
}

module.exports = FTPDriver
