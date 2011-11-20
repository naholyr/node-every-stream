var DSN = require('./dsn')
  , util = require('./util')
  , driver = require('./driver')
  , stream = require('stream')

/**
 * DSN format: spec://[user[:password]]@host[:port]/path
 *
 * Simple DSN:
 * * Stream("spec://user:password@host:port/path")
 * This is equivalent to:
 * * Stream({"spec": "spec", "user": "user", "password": "password", "host": "host", "port": port, "path": "/path"})
 * Or:
 * * Stream({"dsn": "spec://user:password@host:port/path"})
 *
 * Advanced options:
 * * Stream({"dsn": "spec://user:password@host:port/path", "additional option": "..."})
 * Equivalent to:
 * * Stream("spec://user:password@host:port/path", {"additional option": "..."})
 * Or even:
 * * Stream("spec://user@host/path", {"additional option": "...", "password": "password", "port": port})
 * The latter one can be useful to avoid difficulties related to encoded password strings (quite common)
 */
function Stream (dsn, options) {
  if (this instanceof Stream) {

    // Extend stream.Stream
    stream.Stream.call(this)

    // Initialize options
    if ('undefined' == typeof options) options = {}
    if ('string' == typeof dsn) dsn = DSN.parse(dsn)
    if (dsn) util.merge(dsn, options)
    if ('undefined' != typeof options.dsn) util.merge(DSN.parse(options.dsn), options)
    options = util.merge(options, {
      "writable": true,
      "readable": true
    })

    // Initialize attributes
    this.writable = options.writable
    this.readable = options.readable
    this.path = options.path
    this.queue = { "Writable": [], "Readable": [] }

    // Initialize driver
    try {
      this.driver = driver(options, this)
      if (this.writable && !this.driver.writable) this.writable = this.driver.writable
      if (this.readable && !this.driver.readable) this.readable = this.driver.readable
    } catch (err) {
      this.emit('error', err)
    }
    // null = not initialized
    // false = initializing
    // not null and not false = ready
    this.innerReadableStream = null
    this.innerWritableStream = null

  } else {

    // Create new stream
    return new Stream(dsn, options)

  }
}

// Extrend stream.Stream
util.inherits(Stream, stream.Stream)

// Specific API

Stream.prototype.createInner = function (type) {
  var self = this
    , attr = 'inner' + type + 'Stream'
  if (self[attr] === false) return false
  self[attr] = false // Mark inner stream as being initialized
  this.driver['create' + type](function (err, stream) {
    if (err) return self.emit('error', err)
    if (!stream) return self.emit('error', new Error('No stream created'))
    // Register stream
    self[attr] = stream
    // Propagate events from stream to every-stream (except "pipe" which is handled by parent)
    var events = ['data', 'end', 'error', 'close', 'fd', 'drain']
    for (var i=0; i<events.length; i++) {
      (function (event) {
        stream.on(event, function () {
          args = Array.prototype.slice.call(arguments)
          args.unshift(event)
          self.emit.apply(self, args)
        })
      })(events[i])
    }
    // Emit event
    self.emit('inner' + type, stream)
  })
  return true
}
Stream.prototype.callInner = function (type, method, args) {
  if (type != 'Writable' && type != 'Readable') throw new Error('Invalid type')
  if (type == 'Writable' && !this.writable) throw new Error('Not writable')
  if (type == 'Readable' && !this.readable) throw new Error('Not readable')
  var attr = 'inner' + type + 'Stream'
  if (!this[attr]) {
    // Inner stream has not been fully initialized yet: queue callback
    this.queue[type].push([method, args])
    // Is stream being initialized ? If not, then unqueue as soon as ready
    this.on('inner' + type, function (stream) {
      // Unqueue callbacks when ready
      while (this.queue[type].length > 0) {
        var callback = this.queue[type].shift()
        stream[callback[0]].apply(stream, callback[1])
      }
    })

    // Ask for creation
    this.createInner(type)
  } else {
    // Stream is already fully initialized: call method directly
    this[attr][method].apply(this[attr], args)
  }

  return this
}

// Common API

Stream.prototype.destroy = function () {
  if (this.readable) this.callInner('Readable', 'destroy', arguments, true)
  if (this.writable) this.callInner('Writable', 'destroy', arguments, true)
  return this
}
Stream.prototype.destroySoon = function () {
  if (this.readable) this.callInner('Readable', 'destroySoon', arguments, true)
  if (this.writable) this.callInner('Writable', 'destroySoon', arguments, true)
  return this
}

// Readable API

Stream.prototype.pipe =         function () { return this.callInner('Readable', 'pipe', arguments) }
Stream.prototype.setEncoding =  function () { return this.callInner('Readable', 'setEncoding', arguments) }
Stream.prototype.pause =        function () { return this.callInner('Readable', 'pause', arguments) }
Stream.prototype.resume =       function () { return this.callInner('Readable', 'resume', arguments) }

// Writable API

Stream.prototype.write =  function () { return this.callInner('Writable', 'write', arguments) }
Stream.prototype.end =    function () { return this.callInner('Writable', 'end', arguments); this.writable = false; }

// Public API

module.exports = Stream
module.exports.driver = driver
