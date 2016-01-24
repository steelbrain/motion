import path from 'path'
import { statSync } from 'fs'

const inApp = statSync(path.join(process.cwd(), '/.flint'))

if (!inApp) {
  console.log("\nRun 'flint' in a flint repo to start your development server.".green.bold)
  process.argv.push('--help')
}