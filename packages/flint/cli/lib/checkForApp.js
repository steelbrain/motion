import path from 'path'
import { statSync } from 'fs'

try {
  statSync(path.join(process.cwd(), '/.flint'))
}
catch(e) {
  console.log("\nNot in flint app!\n".red)
  process.argv.push('--help')
  process.exit()
}