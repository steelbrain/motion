import React from 'react'
import hashsum from 'hash-sum'
import opts from './opts'

export default function phash(_props) {
  if (opts() && opts().config.disablePropsHashing)
    return `${Math.random()}`

  let hash = Object.keys(_props).reduce((acc, key) => {
    const prop = _props[key]

    if (key == '__flint') return acc + prop.key
    if (prop instanceof Object && prop.hashCode) return acc + prop.hashCode()
    if (React.isValidElement(prop)) return acc + prop.key

    return acc + hashsum(prop)
  }, '')

  return hash
}
