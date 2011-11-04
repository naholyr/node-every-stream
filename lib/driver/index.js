var path = require('path')

function load(options, stream) {
  // Driver is already specified in the options
  if ('object' == typeof options.driver) {
    return options.driver
  }

  // Check driver name
  var name = options.driver
  if ('undefined' == typeof name) {
    // No name specified: build it from spec
    if ('string' != typeof options.spec) {
      throw new Error('Missing "driver" and invalid "spec" info')
    }
    name = 'stream-' + options.spec + '-driver'
  }
  if ('string' != typeof name) {
    throw new Error('Missing "driver" and could not build this from existing options')
  }

  // Generate module paths from driver name
  var modules = []
  if (name.match(/\//)) {
    // Full path
    modules.push(name)
  } else {
    // Single name
    modules.push(name)
    modules.push(path.join(__dirname, name))
  }

  // Load driver module
  var clazz
  for (var i=0; i<modules.length; i++) {
    try {
      clazz = require(modules[i])
    } catch (e) {
      if (e.message.match(/^Cannot find module/)) continue
    }
  }

  // Check loaded module
  if (!clazz) {
    throw new Error('Cannot load module "' + name + '"')
  }

  if ('function' != typeof clazz) {
    throw new Error('Loaded driver is not a valid function')
  }
  if ('function' != typeof clazz.prototype.createWritable) {
    throw new Error('Invalid driver: no method "createWritable"')
  }
  if ('function' != typeof clazz.prototype.createReadable) {
    throw new Error('Invalid driver: no method "createReadable"')
  }

  return new clazz(options, stream)
}

module.exports = load

module.exports.DeferredDriver = function (options, stream, initReady, checkReady, params) {
  params = params || []
  var self = this
    , ready = initReady.call(self)
    , checking = false
    , queue = []
  self.ready = function (cb) {
    if (cb && ready) {
      cb.apply(self, params)
    } else {
      if (cb) queue.push(cb) // Defer callback
      if (!checking) {
        checking = true // Flag to check only once
        checkReady.call(self, function (isReady) {
          checking = false // Check is finished
          ready = isReady
          if (ready) {
            // Unqueue deferred callbacks
            while (queue.length > 0) {
              queue.shift().call(self, params)
            }
          }
        })
      }
    }
  }
}