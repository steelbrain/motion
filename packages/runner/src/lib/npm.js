import exec from './exec'
import handleError from './handleError'
import npmview from 'npmview'

// npm install --save 'name'
export function save(name, dir) {
  return new Promise((res, rej) => {
    exec('npm install --save ' + name, dir, err => {
      if (err) rej('Install failed for package ' + name)
      else res(name)
    })
  })
}

// npm view => [versions]
export function versions(name) {
  return new Promise((res, rej) => {
    npmview(name, (err, version, info) => {
      if (err) rej(err)
      else {
        let versions = info.versions.reverse().slice(10)
        const total = versions.length

        if (!total) return res(null)

        // get detailed info for last three
        Promise.all(
          versions.slice(3).map(v => new Promise((res, rej) =>
            npmview(`${name}@${v}`, (err, v, { description, homepage }) => {
              if (err) return rej(err)
              res({ description, homepage })
            })
          ))
        ).then(infos => {
          // add info onto versions
          versions = versions
            .map((v, i) => ({ version: v, ...(infos[i] || {}) }))

          res(versions)
        })
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