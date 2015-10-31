import log from './log'
import opts from '../opts'
import open from 'open'

export default function openInBrowser(force) {
  log('openInBrowser, force', force, opts.get('debug'))
  if (opts.get('debug') && !force) return
  log('opening...', )
  open('http://localhost:' + opts.get('port'))
}
