var fs = require('fs')
  , path = require('path')
  , assert = require('assert')

function execute (Stream, cb) {

  var ftp = new Stream('ftp://anonymous:fake%40email.com@ftp.free.fr/pub/assistance/demenagement.pdf')
    , file = new Stream(path.resolve('dest-ftp-0.pdf'))
  ftp.on('error', cb).pipe(file)
  file.on('error', cb).on('close', function (err) {
    try {
      content = fs.readFileSync(file.path)
      fs.unlinkSync(file.path)
      assert.notEqual(content.toString(), '')
    } catch (e) {
      return cb(e)
    }
    return cb()
  })

}

module.exports = execute

if (!module.parent) {
  execute(require('..'), function (err) {
    console.log(err && 'ERROR' || 'SUCCESS')
    if (err) throw err
  })
}
