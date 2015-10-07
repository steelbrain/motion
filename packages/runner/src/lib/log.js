export default function log(...args) {
  if (log.debug)
    console.log(...args)
}
