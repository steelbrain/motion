import progress from './progress'

// npm install --save 'name'
export async function save(name, index, total) {
  await progress('Installing', 'npm install --save ' + name, name, index, total)
}

// npm uninstall --save 'name'
export async function unsave(name, index, total) {
  await progress('Uninstalling', 'npm uninstall --save ' + name, name, index, total)
}
