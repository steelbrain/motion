import autoprefixer from 'autoprefixer'
import postcss from 'postcss'
import niceStyles from 'flint-nice-styles'
import { writeFile, log, handleError, path } from './fns'
import bridge from '../bridge'
import opts from '../opts'

let cache = {}

export default async function writeStyle(view, sheet) {
  try {
    log('styles', 'view', view, 'sheet', sheet)

    // avoid sending if not necessary
    if (cache[view] === sheet) return
    cache[view] = sheet

    const file = path.join(opts.get('dir'), '.flint', '.internal', 'styles', view + '.css')
    const prefixed = await postcss([ autoprefixer ]).process(sheet)
    let final = prefixed.css

    await writeFile(file, final)

    setTimeout(() => {
      bridge.message('stylesheet:add', { view, file })
    })
  }
  catch(e) {
    handleError(e)
  }
}