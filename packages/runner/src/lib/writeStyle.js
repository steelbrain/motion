import autoprefixer from 'autoprefixer'
import postcss from 'postcss'
import fs from 'fs'
import path from 'path'
import bridge from '../bridge'
import opts from '../opts'

export default function(view, sheet) {
  const file = path.join(opts.get('dir'), '.flint', '.internal', 'styles', view + '.css')
  const prefixedSheet = postcss([ autoprefixer ]).process(sheet)

  fs.writeFile(file, prefixedSheet, err => {
    if (err) throw new Error(err)

    bridge.message('stylesheet:add', { view, file })
  })
}