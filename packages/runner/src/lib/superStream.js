import through from 'through2'
import File from 'vinyl'
import fs from 'fs'
import path from 'path'
import opts from '../opts'
import log from '../lib/log'

const stream = through.obj().pipe(through.obj(createFile))

function createFile(globFile, enc, cb) {
  cb(null, new File(globFile));
}

function file(_path, contents) {
  return { cwd: opts.get('appDir'), base: opts.get('appDir') + '/', path: path.basename(_path), contents }
}

let lastFile
function superRead(_path) {
  log('start super read')
  fs.readFile(_path, (err, data) => {
    const curFile = data.toString()
    if (curFile != lastFile) {
      stream.write(file(_path, data))
      lastFile = curFile
    }

    if (superReading)
      setTimeout(() => superRead(_path), 5)
    else
      log('stop super read')
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