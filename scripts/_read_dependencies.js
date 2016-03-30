#!/usr/bin/env node
'use strict'

const FS = require('fs')
const filePath = process.argv[2]

if (!filePath) {
  console.error('Please specify a file to read dependencies in')
  process.exit(1)
}

const contents = JSON.parse(FS.readFileSync(filePath).toString('utf8'))

if (contents.dependencies) {
  for (const key in contents.dependencies) {
    if (key.indexOf('motion') !== -1) {
      console.log(key)
    }
  }
}
