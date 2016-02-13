import path from 'path'
import fs from 'fs'

const fpackage = path.join(__dirname, '..', '..', '..', 'package.json')
const fstr = fs.readFileSync(fpackage, 'utf-8')
const fjson = JSON.parse(fstr)
const version = fjson.version

export default version