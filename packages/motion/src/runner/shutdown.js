// STOP

process.on('SIGINT', cleanExit)
process.on('SIGTERM', cleanExit)
process.on('uncaughtException', cleanExit)

function cleanExit(e) {
  if (e) console.log(e.stack)

  const children = Object.keys(process.children || {})

  // kill children
  children.forEach(key => {
    let child = process.children[key]

    // this seems to be required
    child && child.send('EXIT')

    setTimeout(() => {
      child &&  child.kill('SIGINT')
      process.exit(0)
    })
  })
}

export function now() { cleanExit() }

export default { now }
