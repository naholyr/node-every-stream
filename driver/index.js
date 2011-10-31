var path = require('path')

function load(options) {
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

  return new clazz(options)
}

module.exports = load
