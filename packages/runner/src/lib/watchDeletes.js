import opts from '../opts'
import cache from '../cache'
import { rmdir } from './fns'

export default function watchDeletes() {
  cache.onDelete(file => {
    file.views.forEach(view => {
      rmdir(opts.get('styleDir'))
    })
  })
}