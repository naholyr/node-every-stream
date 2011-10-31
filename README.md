# Every-Stream -- Bi-directional DSN-based streams

The aim of this module is to provide a very simple API to move content from/to a lot of different file systems. In a not-so-far future you would be able to write this:

```javascript
// Copy from Amazon S3 to your Dropbox
Stream('s3://amazon.com/path/to/file').pipe(Stream('dropbox://user:key@dropbox.com/path/to/file'))
```

## Install

<pre>
  npm install every-stream
</pre>

Or from source:

<pre>
  git clone git://github.com/naholyr/node-every-stream.git every-stream
  cd every-stream
  npm link
</pre>

## Usage

Every-Stream is by design a simple bi-directional stream wrapper. The smart thing is the usage of DSN to define paths and use the proper driver.

```javascript
var Stream = require('every-stream');

// Generic description of a source/destination
// The following stream can be readable and/or writable,
// depending on the driver and the way it's used
var stream = Stream('protocol://user:password@host/path')

// Example: copy "./file.txt" to a FTP server:
Stream('./file.txt').pipe(Stream('ftp://user:password@host/path/to/file.txt'))
```

## Drivers

### file

DSN: `file:///path/to/file` or directly `/path/to/file`

This is strictly equivalent to `fs.createReadStream()` and/or `fs.createWriteStream()`.

### dir

DSN: `dir:///path/to/directory`

This is a read-only driver, and it will emit filenames contained in the specified folder. This driver is equivalent to using `fs.readdir()`.

### ftp

DSN: `ftp://user:password@host/path`

FTP driver is not available yet. This driver will behave like a super-simple streaming FTP transfer client.

## Roadmap

* The obvious next step is implementing `FTP` driver
* More documentation about custom drivers
* New drivers
  * `SFTP`
  * `HTTP` (will be readonly, probably based on @mikael 's `request`)
  * `WebDav`
  * `Dropbox` (and any other easy-to-use storage service)
  * `Twitter` (hey, why not streaming tweets super-simply with this API ;))
  * Put your wish here
* Some ad in the newsgroup :)
