export default function reportError(...args) {
  if (process.env.production) return
  if (!root.flintRuntimeError) return

  let err = args

  // if coming from catch
  if (typeof args[0] == 'object') {
    const lines = args[0].stack.split("\n")
    err = [args[0].message, lines[1], 0, 0, args[0].stack]
  }

  root.flintRuntimeError(...err)
}