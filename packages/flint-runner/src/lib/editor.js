import { execSync } from 'child_process'

export default function editor(file, cb) {
  try {
    let result = execSync(`atom ${file}`, { stdio: 'inherit' })
    cb && cb(result)
  }
  catch(e) {
    console.log(
      `Error running atom, install at https://atom.io`,
      `\n  be sure to run "Atom > Install Shell Commands"`,
      e
    )
  }
}