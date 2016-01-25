import path from 'path'
import opts from '../opts'
import cache from '../cache'
import bridge from '../bridge'
import { bundleInternals } from '../bundler/internals'
import { p, rm, log, handleError } from './fns'

async function deleteJS(view) {
  const file = p(OPTS.outDir, view + '.js')
  log('delete js', file)
  await rm(file)
}

async function deleteStyle(view) {
  const file = p(opts('styleDir'), view + '.css')
  log('delete style', file)
  await rm(file)
}

export default function watchDeletes() {
  try {
    cache.onDeleteView(async view => {
      log('onDeleteView', view)
      await deleteStyle(view)
      bridge.message('stylesheet:remove', { view })
    })

    cache.onDeleteFile(async ({ name, file, state }) => {
      log('onDeleteFile', name, file, state)

      if (state.isInternal)
        await bundleInternals()

      await state.views.forEach(async view => {
        await deleteStyle(view)
        await deleteJS(view)
      })

      bridge.message('file:delete', { name })
    })
  }

  catch(e) {
    handleError(e)
  }
}