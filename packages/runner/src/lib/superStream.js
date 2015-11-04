import through from 'through2'
import File from 'vinyl'
import fs from 'fs'

const stream = through.obj().pipe(through.obj(createFile))

function createFile(globFile, enc, cb) {
  cb(null, new File(globFile));
}

function file(_path, data) {
  return { cwd: __dirname, base: '.', path: _path, contents: new Buffer(data) }
}

function superRead(_path) {
  fs.readFile(_path, (err, data) => {
    stream.write(file(_path, data))
    if (superReading)
      setTimeout(() => superRead(_path), 3)
  })
}

let superReading = false
function start(_path) {
  superReading = true
  superRead(_path)
}

function stop(_path) {
  superReading = false
}

export default { stream, start, stop }