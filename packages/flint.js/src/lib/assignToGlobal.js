export default function assignToGlobal(name, val) {
  if (typeof root[name] != 'undefined')
    throw `You're attempting to define a global that is already defined:
        ${name} = ${JSON.stringify(root[name])}`

  root[name] = val
}