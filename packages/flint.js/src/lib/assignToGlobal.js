const root = typeof window == 'undefined' ? global : window

// exported tracks previous exports so we can overwrite
let exported = {}

export default function assignToGlobal(name, val) {
  if (!exported[name] && typeof root[name] != 'undefined')
    throw `You're attempting to define a global that is already defined:
        ${name} = ${JSON.stringify(root[name])}`

  exported[name] = true
  root[name] = val
}