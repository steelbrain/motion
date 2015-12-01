import bridge from '../bridge'

let meta = {}

bridge.on('focus:element', data => {
  console.log('focsuing el', data)
  bridge.message('editor', {
    type: 'focus:element',
    data
  })
})

bridge.on('focus:style', data => {
  console.log('focsuing style', data)
  bridge.message('editor', {
    type: 'focus:element',
    data
  })
})

export default function onMeta({ viewMeta }) {
  Object.keys(viewMeta).map(view => {
    meta[view] = viewMeta[view]
  })
}
