import { version } from '../package.json'
import path from 'path'
import fs from 'fs'

const ppath = path.join(process.cwd(), '.flint', 'package.json')
const pstr = fs.readFileSync(ppath, 'utf-8')
const pjson = JSON.parse(pstr)
const name = pjson.name

// console.log('name', name, 'pjson', pjson)

export default { name, version }