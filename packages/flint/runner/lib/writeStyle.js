import autoprefixer from 'autoprefixer'
import postcss from 'postcss'
import { writeFile, log, handleError, path } from './fns'
import bridge from '../bridge'
import opts from '../opts'

let styleDir

export default async function writeStyle(view, sheet) {
  try {
    styleDir = styleDir || path.join(opts('appDir'), '.flint', '.internal', 'styles')
    const file = path.join(styleDir, `${view}.css`)
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
