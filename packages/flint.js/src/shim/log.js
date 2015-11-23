let Internal

export default function log(_Internal) {
  Internal = _Internal
}

const original = console.log.bind(console)

console.flint = (...args) => {
  if (process.env.production) return

  let search = window.location.search
  let type = search && search.match(/[?&]log=([a-z]+)/)

  if (!search || search.indexOf('log=') == -1) return

  let logger = () => original(...args)

  if (type && type[1] == args[0])
    logger()
  if (!type)
    logger()
}