import path from 'path'
import { statSync } from 'fs'

try {
  statSync(path.join(process.cwd(), '.motion'))
}
catch(e) {
  console.log("\n not in a motion app directory\n")

  try {
    statSync(path.join(process.cwd(), '.flint'))
    console.log(`
    Steps to migrate from Flint to Motion are here:
      https://github.com/motion/motion/tree/master/MIGRATE.md

    Short version:
      mv .flint .motion
      mv .motion/flint.json .motion/config.js

      replace "Flint" with "Motion" in your app code
    `)
  }
  catch(e) {}

  process.exit()
}