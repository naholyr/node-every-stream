var fs = require('fs')
  , path = require('path')
  , assert = require('assert')

function execute (Stream, cb) {

  function test_read () {
    var ftp = new Stream('ftp://anonymous:fake%40email.com@ftp.free.fr/pub/assistance/demenagement.pdf')
      , file = new Stream(path.resolve('dest-ftp-0.pdf'))
    ftp.on('error', cb).pipe(file)
    file.on('error', cb).on('close', function (err) {
      try {
        content = fs.readFileSync(file.path)
        fs.unlinkSync(file.path)
        assert.equal(content.length, 63286)
      } catch (e) {
        return cb(e)
      }
      return cb()
    })
  }

  function test_write () {
    var ftp = new Stream('ftp://freebox:PASSWORD@mafreebox.freebox.fr/Disque%20dur/dst-ftp-0.txt')
      , file = new Stream(path.resolve('src-ftp-0.txt'))
    file.write('Hello, world').on('error', cb).pipe(ftp)
    ftp.on('error', cb).on('success', function (err) {
      ftp.end()
      if (err) return cb(err)
      try {
        fs.unlinkSync(file.path)
      } catch (e) {
        return cb(e)
      }
      return cb()
    })
  }

  test_read()
  //test_write()

}

module.exports = execute

if (!module.parent) {
  execute(require('..'), function (err) {
    console.log(err && 'ERROR' || 'SUCCESS')
    if (err) throw err
  })
}
