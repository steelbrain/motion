import autoprefixer from 'autoprefixer'
import postcss from 'postcss'
import fs from 'fs'
import path from 'path'
import bridge from '../bridge'
import opts from '../opts'

export default async function writeStyle(view, sheet) {
  const file = path.join(opts.get('dir'), '.flint', '.internal', 'styles', view + '.css')
  const prefixed = await postcss([ autoprefixer ]).process(sheet)
  let final = prefixed.css

  const selectorPrefix = opts.get('config').selectorPrefix
  if (final && selectorPrefix) {
    final = final.replace(/(\._[^{]+{)/, `${selectorPrefix} $1`)
  }

  fs.writeFile(file, final, err => {
    if (err) throw new Error(err)

    bridge.message('stylesheet:add', { view, file })
  })
}