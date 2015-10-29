import React from 'react'
import hashsum from 'hash-sum'

export default function phash(_props) {
  const props = Object.keys(_props).reduce((acc, key) => {
    const prop = _props[key]

    if (React.isValidElement(prop)) {
      // TODO: traverse children
      acc[key] = prop.key
    }
    else {
      acc[key] = prop
    }

    return acc
  }, {})

  return hashsum(props)
}
