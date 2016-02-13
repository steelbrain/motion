import path from 'path'
import { statSync } from 'fs'

try {
  statSync(path.join(process.cwd(), '/.motion'))
}
catch(e) {
  console.log("\nNot in motion app!\n".red)
  process.argv.push('--help')
  process.exit()
}