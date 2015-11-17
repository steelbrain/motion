export default function log(...args) {
  if (process.env.production) return

  let search = window.location.search
  let type = search && search.match(/[?&]log=([a-z]+)/)

  if (!search || !search.indexOf('log=')) return

  let logger = () => console.log.call(console, ...args)

  if (type && type[1] == args[0])
    logger()
  if (!type)
    logger()
}