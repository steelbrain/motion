export default function safeRun(prefix, fn) {
  if (process.env.production) fn()
  else {
    try { fn() }
    catch(e) {
      const { name, message, stack } = e
      console.log('Error in', prefix)
      reportError({ name, message, stack })
      throw e
    }
  }
}