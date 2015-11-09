import path from 'path'
import opts from '../opts'
import cache from '../cache'
import bridge from '../bridge'
import handleError from '../lib/handleError'
import log from '../lib/log'
import { p, rmdir } from './fns'

async function deleteJS(view) {
  const file = p(OPTS.outDir, view + '.js')
  log('delete js', file)
  await rmdir(file)
}

async function deleteStyle(view) {
  const file = p(opts.get('styleDir'), view + '.css')
  log('delete style', file)
  await rmdir(file)
}

export default function watchDeletes() {
  try {
    cache.onDeleteView(async view => {
      await deleteStyle(view)
      console.log('remove', view)
      bridge.message('stylesheet:remove', { view })
    })

    cache.onDeleteFile(async view => {
      await file.views.forEach(async view => {
        await deleteStyle(view)
        await deleteJS(view)
      })

      const name = path.relative(opts.get('outDir'), vinyl.path)
      bridge.message('file:delete', { name })
    })
  }

  catch(e) {
    handleError(e)
  }
}