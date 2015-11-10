import autoprefixer from 'autoprefixer'
import postcss from 'postcss'
import { writeFile, log, handleError, path } from './fns'
import bridge from '../bridge'
import opts from '../opts'

export default async function writeStyle(view, sheet) {
  try {
    log('styles', 'view', view, 'sheet', sheet)

    const file = path.join(opts.get('dir'), '.flint', '.internal', 'styles', view + '.css')
    const prefixed = await postcss([ autoprefixer ]).process(sheet)
    let final = prefixed.css

    // console.log(sheet)
    await writeFile(file, final)
    bridge.message('stylesheet:add', { view, file })
  }
  catch(e) {
    handleError(e)
  }
}