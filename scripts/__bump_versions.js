'use strict'

const FS = require('fs')
let key

const manifestContents = JSON.parse(FS.readFileSync(process.argv[2], 'utf8'))
if (manifestContents.dependencies) {
  for (key in manifestContents.dependencies) {
    if (manifestContents.dependencies.hasOwnProperty(key)) {
      if (key.indexOf('motion') !== -1) {
        manifestContents.dependencies[key] = process.argv[3].substr(1)
      }
    }
  }
}

FS.writeFileSync(process.argv[2], JSON.stringify(manifestContents, null, 2))
