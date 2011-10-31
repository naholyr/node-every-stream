var fs = require('fs')
  , path = require('path')
  , assert = require('assert')

function execute (Stream, cb) {

  try {
    var files = fs.readdirSync(__dirname)
      , dir = new Stream('dir://' + path.resolve(__dirname))
      , file = new Stream(path.resolve('dir-0'))
    dir.on( 'error', cb).pipe(file)
    file.on('error', cb).on('close', function () {
      try {
        found = fs.readFileSync(file.path).toString()
        fs.unlinkSync(file.path)
        expected = files.join('\n') + '\n'
        assert.equal(expected, found, 'Directory listing is consistent')
      } catch (e) {
        return cb(e)
      }
      return cb()
    })
  } catch (e) {
    return cb(e)
  }

}

module.exports = execute

if (!module.parent) {
  execute(require('..'), function (err) {
    console.log(err && 'ERROR' || 'SUCCESS')
    if (err) throw err
  })
}
