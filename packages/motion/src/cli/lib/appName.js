import path from 'path'
import fs from 'fs'

let name = ''

try {
  const ppath = path.join(process.cwd(), '.motion', 'package.json')
  const pstr = fs.readFileSync(ppath, 'utf-8')
  const pjson = JSON.parse(pstr)
  name = pjson.name
}
catch(e) {
  // TODO take out try/catch minor release (flint update)
}

export default name