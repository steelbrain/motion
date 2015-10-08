import { Promise } from 'bluebird'
Promise.longStackTraces()

// promisify
const mkdir = Promise.promisify(mkdirp)
const readdir = Promise.promisify(readdirp)
const readJSONFile = Promise.promisify(jf.readFile)
const readFile = Promise.promisify(fs.readFile)
const writeFile = Promise.promisify(fs.writeFile)

export default { mkdir, readdir, readJSONFile, readFile, writeFile }