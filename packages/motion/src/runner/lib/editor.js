import { realpathSync } from 'fs'
import { execSync } from 'child_process'

export default function editor(file, cb) {
  try {
    const realPath = realpathSync(file)
    let result = execSync(`atom ${realPath}`, { stdio: 'inherit' })
    cb && cb(result)
  }
  catch(e) {
    print(
      `Error running atom, install at https://atom.io`,
      `\n  be sure to run "Atom > Install Shell Commands"`,
      e
    )
  }
}
