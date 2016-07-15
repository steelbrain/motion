'use babel'

/* @flow */

import niceStyle from '../lib/index'
import { it } from 'jasmine-fix'

const str = o => JSON.stringify(o)

describe('NiceStyles', function() {
  it('transforms some styles', function() {
    const simple = niceStyle({
      background: 'red',
      fontSize: 10
    })

    const complex = niceStyle({
      background: [0, 200, 0, 0.5],
      color: { css: () => 'blue' },
      transform: {
        x: 0,
        y: 10
      },
      hover: {
        background: { css: () => 'yellow' }
      }
    })

    expect(str(simple)).toBe(str({
      background: 'red',
      fontSize: 10
    }))

    expect(str(complex)).toBe(str({
      background: 'rgba(0, 200, 0, 0.5)',
      color: 'blue',
      transform: 'translateX(0px) translateY(10px)',
      ':hover': {
        background: 'yellow'
      }
    }))
  })
})
