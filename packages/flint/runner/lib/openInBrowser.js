import log from './log'
import opts from '../opts'
import open from 'open'

export default function openInBrowser(force) {
  log('openInBrowser, force', force, opts('debug'))
  if (opts('debug') && !force) return
  log('opening...', )
  open('http://localhost:' + opts('port'))
}
