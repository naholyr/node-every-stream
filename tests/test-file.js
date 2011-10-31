var fs = require('fs')
  , path = require('path')
  , assert = require('assert')

function execute (Stream, cb) {

  function test (txt, srcPath, srcOptions, dstPath, dstOptions) {
    fs.writeFileSync(srcPath, txt)
    if (path.existsSync(dstPath)) fs.unlinkSync(dstPath)
    var sSrc = new Stream(srcOptions)
      , sDst = new Stream(dstOptions)
    sSrc.on('error', cb).pipe(sDst)
    sDst.on('error', cb).on('close', function () {
      try {
        assert.equal(fs.readFileSync(sDst.path).toString(), fs.readFileSync(sSrc.path).toString())
        fs.unlinkSync(sDst.path)
        fs.unlinkSync(sSrc.path)
      } catch (err) {
        return cb(err)
      }
      return cb()
    })
  }

  // Test DSN
  test('content-0', path.resolve('source-0'), 'file://' + path.resolve('source-0'), path.resolve('dest-0'), 'file://' + path.resolve('dest-0'))
  // Test Path
  test('content-1', path.resolve('source-1'), path.resolve('source-1'), path.resolve('dest-1'), path.resolve('dest-1'))
  // Test with full options
  test('content-2', path.resolve('source-2'), {
    "writable": false,
    "spec": "file",
    "path": path.resolve('source-2')
  }, path.resolve('dest-2'), {
    "readable": false,
    "spec": "file",
    "path": path.resolve('dest-2')
  })

}

module.exports = execute

if (!module.parent) {
  execute(require('..'), function (err) {
    console.log(err && 'ERROR' || 'SUCCESS')
    if (err) throw err
  })
}
