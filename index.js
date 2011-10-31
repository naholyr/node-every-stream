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
    this.driver = driver(options)
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
    this[attr] = this.driver['create' + type]()
    if (this[attr]) {
      // Propagate events
      var events = ['data', 'end', 'error', 'close', 'fd', 'drain', 'pipe']
      var self = this
      for (var i=0; i<events.length; i++) {
        (function (event) {
          self[attr].on(event, function () {
            args = Array.prototype.slice.call(arguments)
            args.unshift(event)
            self.emit.apply(self, args)
          })
        })(events[i])
      }
    }
  }

  if (!this[attr]) {
    if (!optional) {
      throw new Error('Cannot get inner stream')
    } else {
      return
    }
  }

  return this[attr][method].apply(this[attr], args)
}

Stream.prototype.setOptions = function (options) {

  return this.options = options
}

// Common API

Stream.prototype.destroy = function () {
  this.callInner('Readable', 'destroy', arguments, true)
  this.callInner('Writable', 'destroy', arguments, true)
}
Stream.prototype.destroySoon = function () {
  this.callInner('Readable', 'destroySoon', arguments, true)
  this.callInner('Writable', 'destroySoon', arguments, true)
}

// Readable API

Stream.prototype.pipe =         function () { this.callInner('Readable', 'pipe', arguments) }
Stream.prototype.setEncoding =  function () { this.callInner('Readable', 'setEncoding', arguments) }
Stream.prototype.pause =        function () { this.callInner('Readable', 'pause', arguments) }
Stream.prototype.resume =       function () { this.callInner('Readable', 'resume', arguments) }

// Writable API

Stream.prototype.write =  function () { this.callInner('Writable', 'write', arguments) }
Stream.prototype.end =    function () { this.callInner('Writable', 'end', arguments) }

// Public API

module.exports = Stream
