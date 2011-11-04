var url = require('url')

function parse(string) {
  dsn = {}
  uri = url.parse(string)
  if (uri.protocol) {
    dsn.spec = decodeURIComponent(uri.protocol.substring(0, uri.protocol.length-1))
    if (uri.hostname) {
      dsn.host = decodeURIComponent(uri.hostname)
    }
    if (uri.auth) {
      match = uri.auth.match(/([^:]+)(?::(.+))?$/)
      dsn.user = decodeURIComponent(match[1])
      if (match[2]) {
        dsn.password = decodeURIComponent(match[2])
      }
    }
    if (uri.port) {
      dsn.port = parseInt(uri.port, 10)
    }
  } else {
    dsn.spec = 'file'
  }
  dsn.path = decodeURIComponent(uri.pathname)

  return dsn
}

exports.parse = parse
