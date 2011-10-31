function merge(from, to) {
  for (var prop in from) {
    to[prop] = from[prop]
  }
  return to
}

merge(require('util'), exports)

exports.merge = merge
