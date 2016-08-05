# motion-style

HOC for styling React components. Inline styles for all.

Combines a few things to make your life easy: [Aphrodite](https://github.com/Khan/aphrodite) for stylesheet extraction, [motion-nice-styles](https://github.com/motion/motion/tree/master/packages/nice-styles) for powerful JS style syntax, themes, and a React wrapper that makes them easy to apply.


```jsx
import style from 'motion-style'

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

install
---
Comes with motion cli out of the box. It comes with a babel-transform that allows it to run, available from motion-style/transform.

To add to babel:
```js
{
  "babel": {
    "plugins": [
      ["motion-style/transform", { "decoratorName": "style" }]
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

Use themes and themeProps to easily theme an entire component a different way. `themeProps` will accept boolean props.

```jsx
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

parent styles
---

Helpful for maintaining a common set of styles for every component. Using `$$` to access keeps things explicit.

```js
@style.parent({
  row: {
    flexFlow: 'row',
  },
})
@style
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
