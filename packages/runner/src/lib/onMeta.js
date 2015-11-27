import bridge from '../bridge'

export default function onMeta(data) {
  bridge.message('editor', {
    _type: 'meta',
    data
  })
}