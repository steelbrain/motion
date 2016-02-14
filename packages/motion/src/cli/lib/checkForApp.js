import path from 'path'
import { statSync } from 'fs'

try {
  statSync(path.join(process.cwd(), '.motion'))
}
catch(e) {
  try {
    statSync(path.join(process.cwd(), '.flint'))
    console.log('  Flint app found, upgrading to motion...')
  }
  catch(e) {
    console.log("\n not in a motion app directory\n")
    process.argv.push('--help')
  }
}