import exec from './exec'
import handleError from './handleError'
import npmview from 'npmview'

// npm install --save 'name'
export function save(name, dir) {
  return new Promise((res, rej) => {
    exec('npm install --save ' + name, dir, err => {
      if (err) rej(err)
      else {
        res(name)
      }
    })
  })
}

// npm view => [versions]
export function versions(name) {
  return new Promise((res, rej) => {
    npmview(name, (err, version, info) => {
      if (err) rej(err)
      else {
        res(info.versions.reverse())
      }
    })
  })
}

// npm install
export function install(dir) {
  return new Promise((res, rej) => {
    exec('npm install', dir, err => {
      if (err) rej(err)
      else res()
    })
  })
}

export default {
  save, versions, install
}