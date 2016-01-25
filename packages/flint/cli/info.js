import path from 'path'
import fs from 'fs'

const ppath = path.join(process.cwd(), '.flint', 'package.json')
const pstr = fs.readFileSync(ppath, 'utf-8')
const pjson = JSON.parse(pstr)
const name = pjson.name

const fpackage = path.join(__dirname, '..', 'package.json')
const fstr = fs.readFileSync(fpackage, 'utf-8')
const fjson = JSON.parse(fstr)
const version = fjson.version

// console.log('name', name, 'pjson', pjson)

export default { name, version }