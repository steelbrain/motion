import path from 'path'
import fs from 'fs'

const ppath = path.join(process.cwd(), '.flint', 'package.json')
const pstr = fs.readFileSync(ppath, 'utf-8')
const pjson = JSON.parse(pstr)
const name = pjson.name

export default name