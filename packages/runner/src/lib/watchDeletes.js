import path from 'path'
import opts from '../opts'
import cache from '../cache'
import bridge from '../bridge'
import handleError from '../lib/handleError'
import { p, rmdir } from './fns'

async function deleteJS(view) {
  await rmdir(p(OPTS.outDir, view))
}

async function deleteStyle(view) {
  console.log('deete', opts.get('styleDir'), view + '.css')
  await rmdir(p(opts.get('styleDir'), view + '.css'))
}

export default function watchDeletes() {
  try {
    cache.onDeleteView(async view => {
      await deleteStyle(view)
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