// TODO use lib/require to delay load chokidar
import chokidar from 'chokidar'
import { path, rm, p, opts, handleError } from '../../lib/fns'

// gulp doesnt send unlink events for files in deleted folders, so we do our own
export default function deletes() {
  chokidar.watch('.', {ignored: /[\/\\]\./}).on('unlink', handleDelete)
}

async function handleDelete(file) {
  try {
    // ignore if in node_modules
    if (file.indexOf('.flint') === 0) return

    debug('unlink', file)
    if (/jsf?/.test(path.extname(file))) {
      await rm(p(opts('outDir'), file))
      cache.remove(file)
    }
  }
  catch(e) { handleError(e) }
}