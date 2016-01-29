import autoprefixer from 'autoprefixer'
import postcss from 'postcss'
import { writeFile, log, handleError, path } from './fns'
import bridge from '../bridge'
import opts from '../opts'

let STYLE_DIR

export function init() {
  STYLE_DIR = path.join(opts('dir'), '.flint', '.internal', 'styles')
}

export async function write(view, sheet) {
  try {
    const file = path.join(STYLE_DIR, `${view}.css`)
    const prefixed = await postcss([ autoprefixer ]).process(sheet)
    let final = prefixed.css

    await writeFile(file, final)
    if (!opts('hasRunInitialBuild')) return
    bridge.broadcast('stylesheet:add', { view, file })
  }
  catch(e) {
    handleError(e)
  }
}

export default { write, init }
