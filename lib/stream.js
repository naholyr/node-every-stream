var dsn = require('./dsn')
  , util = require('./util')
  , driver = require('./driver')
  , stream = require('stream')

function Stream (options) {
  if (this instanceof Stream) {

    // Extend stream.Stream
    stream.Stream.call(this)

    // Initialize options
    if ('string' == typeof options) options = { "dsn": options }
    if ('undefined' != typeof options.dsn) util.merge(dsn.parse(options.dsn), options)
    options = util.merge(options, {
      "writable": true,
      "readable": true
    })

    // Initialize attributes
    this.writable = options.writable
    this.readable = options.readable
    this.path = options.path

    // Initialize driver
    try {
      this.driver = driver(options, this)
      if (this.writable && !this.driver.writable) this.writable = this.driver.writable
      if (this.readable && !this.driver.readable) this.readable = this.driver.readable
    } catch (err) {
      this.emit('error', err)
    }
    this.innerReadableStream = null
    this.innerWritableStream = null

  } else {

    // Create new stream
    return new Stream(options)

  }
}

// Extrend stream.Stream
util.inherits(Stream, stream.Stream)

// Specific API

Stream.prototype.callInner = function (type, method, args, optional) {
  if (type == 'Writable' && !this.writable) throw new Error('Not writable')
  if (type == 'Readable' && !this.readable) throw new Error('Not readable')
  var attr = 'inner' + type + 'Stream'
  if (!this[attr]) {
    var self = this
    this.driver['create' + type](function (err, stream) {
      if (err) {
        return self.emit('error', err)
      }
      if (!stream) {
        return self.emit('error', new Error('No stream created'))
      }
      // Register stream
      self[attr] = stream
      // Propagate events from stream to every-stream
      var events = ['data', 'end', 'error', 'close', 'fd', 'drain', 'pipe']
      for (var i=0; i<events.length; i++) {
        (function (event) {
          stream.on(event, function () {
            args = Array.prototype.slice.call(arguments)
            args.unshift(event)
            self.emit.apply(self, args)
          })
        })(events[i])
      }
      // Call method on inner
      stream[method].apply(stream, args)
    })
  } else {
    this[attr][method].apply(this[attr], args)
  }

  return this
}

Stream.prototype.setOptions = function (options) {

  return this.options = options
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
Stream.prototype.end =    function () { return this.callInner('Writable', 'end', arguments) }

// Public API

module.exports = Stream
module.exports.driver = driver
