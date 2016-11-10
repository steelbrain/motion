# gloss 💅

HOC for making style a first class citizen of components. Inline styles for all.

Combines a few things:

- [Aphrodite](https://github.com/Khan/aphrodite) for stylesheet extraction
- [motion-nice-styles](https://github.com/motion/motion/tree/master/packages/nice-styles) for powerful JS syntax for styles
- it's own theme engine
- $style props

Syntax:

```js
import style from 'gloss'

const styler = style({ theme: true })

@style class extends Component {
  render() {
    return <h1 $black $bg="#fff">Test</h1>
  }

  static style = {
    h1: {
      fontSize: 22,
      color: [255, 255, 255],
      hover: { color: 'red', },
      borderBottom: [2, 'solid yellow']
    },
    black: {
      color: 'black',
    },
    bg: color => ({
      background: color,
      borderBottom: [2, 'solid', color]
    }),
  }
}
```

Example of making a simple styled component:

```js
import gloss from 'gloss'

const style = gloss.parent({
  style: obj => obj,
})

@style
export default class Section {
  static defaultProps = {
    maxHeight: 'auto',
    minHeight: 800,
    background: colors.primary,
    height: 'auto',
    color: '#444',
    position: 'relative',
    overflow: 'hidden',
    padding: [90, 0],
    [media.small]: {
      padding: [50, 0],
    },
  }

  render() {
    const { children, windowHeight, maxHeight, minHeight, attach, ...props } = this.props

    if (windowHeight) {
      props.height = Math.max(minHeight, Math.min(maxHeight, window.innerHeight))
    }

    return (
      <section $$style={props} {...attach}>
        {children}
      </section>
    )
  }

  static theme = {
    centered: {
      section: {
        justifyContent: 'center',
      },
    },
  }
}
```

install
---
Add babel transform:

```js
{
  "babel": {
    "plugins": [
      ["gloss/transform", { "decoratorName": "style" }]
    ]
  }
}
```


features
---

- small library, relies on other small libraries
- auto prefixes
- supports pseudos
- supports media queries
- themes are far easier way to restyle multiple elements
- powerful js object-based styles
- dynamic and static styles
- keeps html easy to read

themes
---

Use themes for really easy variant looks for components. Gives you complete control to
change multiple elements with a single prop.

```js
@style class Title extends React.Component {
  render() {
    return (
      <base>
        <h1>Test</h1>
      </base>
    )
  }

  static style = {
    base: {
      padding: 10,
      transform: {
        rotate: '45deg',
      },
    },
    h1: {
      fontSize: 22,
    },
  }

  static theme = {
    big: {
      base: {
        padding: 20,
      },
      h1: {
        fontSize: 50,
      }
    },
    tint: color => ({
      base: {
        background: [color, 0.5],
      },
      h1: {
        color,
      },
    }),
  }
}

// Use
React.render(<Title big tint="yellow" />, document.getElementById('app'))
```

base styles
---

Helpful for maintaining a common set of styles for every component. Using `$$` to access keeps things explicit.

```js
@style.parent({
  row: {
    flexFlow: 'row',
  },
})
class extends React.Component {
  render() {
    return (
      <div $$row>
        <h1>Test1</h1>
        <h1>Test2</h1>
      </div>
    )
  }

  static style = {
    div: {
      background: 'yellow',
    },
  }
}
```

risks
---

Gloss is used in production for a very large app we're building. Technically, it's fast
and full featured. We think there are a few more features that would really make it shine,
but we've held off promoting it further until we get a chance to integrate those well and
round out the branding/documentation.

Until then, it won't have the community support of other libraries. That said, we do
have the name `gloss` now and are very close to ready. The library itself is not very large,
so would be easy to maintain or fork.
