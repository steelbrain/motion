import React from 'react'
import hashsum from 'hash-sum'

export default function phash(_props) {
  const props = Object.keys(_props).reduce((acc, key) => {
    const prop = _props[key]

    if (key == '__flint')
      return acc

    if (prop instanceof Object && prop.hashCode)
      acc[key] = prop.hashCode()

    // TODO: traverse children
    else if (React.isValidElement(prop))
      acc[key] = prop.key

    else
      acc[key] = prop

    return acc
  }, {})

  return hashsum(props)
}
