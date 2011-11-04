var path = require('path')
  , fs = require('fs')
  , Stream = require(path.resolve(__dirname, '..'))

fs.readdir(__dirname, function (err, files) {
  files.forEach(function (file) {
    filename = path.resolve(__dirname, file)
    if (filename != __filename && file.match(/^test-.*\.js$/)) {
      require(filename)(Stream, function (err) {
        if (!err) console.log('[ OK ] %s', file)
        else {
          console.log('[FAIL] %s', file)
          throw err
        }
      })
    }
  })
})
