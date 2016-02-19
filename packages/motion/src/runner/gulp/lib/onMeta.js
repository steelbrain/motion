// handles meta info on views passed from babel
// eventually given to atom for IDE

import bridge from '../../bridge'
import cache from '../../cache'
import exec from '../../lib/exec'

type Meta = {
  file: string;
  views: {
    location: Location;
    file: string;
    styles: {};
    els: {}
  }
}

let meta: Meta = {}

export default function setMeta({ file, views }) {
  cache.setFileMeta(file, views)
  bridge.broadcast('file:meta', { file, views })
  Object.keys(views).map(view => {
    meta[view] = views[view]
  })
}
