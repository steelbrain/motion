import opts from '../opts'

export default function openInBrowser(force) {
  if (opts.get('debug') && !force) return
  open('http://localhost:' + ACTIVE_PORT)
}
