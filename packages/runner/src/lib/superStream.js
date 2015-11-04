import through from 'through2'
import File from 'vinyl'
import fs from 'fs'
import path from 'path'
import opts from '../opts'

const stream = through.obj().pipe(through.obj(createFile))

function createFile(globFile, enc, cb) {
  cb(null, new File(globFile));
}

function file(_path, contents) {
  return { cwd: opts.get('appDir'), base: opts.get('appDir') + '/', path: path.basename(_path), contents }
}

let lastFile
function superRead(_path) {
  console.log('do super')
  fs.readFile(_path, (err, data) => {
    const curFile = data.toString()
    if (curFile != lastFile) {
      stream.write(file(_path, data))
      lastFile = curFile     
    }

    if (superReading)
      setTimeout(() => superRead(_path), 5)
  })
}

let superReading = false
function start(_path) {
  console.log('start siper read')
  superReading = true
  superRead(_path)
}

function stop(_path) {
  superReading = false
}

export default { stream, start, stop }