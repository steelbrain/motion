## Motion Style

Higher order component for styling components. Uses Aphrodite to extract everything to stylesheets. Uses motion-nice-style to provide some nice helpers for styles.

Applies styles in the static style object to the render elements based on tags and `$` props.

Example:

```js
import styler from 'motion-style'

const style = styler({
  theme: true,
  themeKey: 'theme'
})

@style class extends React.Component {
  render() {
    return (
      <name>
        <h1 $black>Test</h1>
      </name>
    )
  }

  static style = {
    name: {
      flex: 1,
    },
    h1: {
      fontSize: 22,
      transform: {
        rotate: '45deg',
      },
      border: [1, 'solid', '#ccc'],
      color: [255, 255, 255],
    },
    black: {
      color: 'black',
    },
  }
}
```

### Themes

Use themes and themeProps to easily theme an entire component a different way. `themeProps` will accept boolean props.

```js
@style class Title extends React.Component {
  render() {
    return (
      <base>
        <h1>Test</h1>
      </base>
    )
  }

  static themeProps = ['big']

  static style = {
    base: {
      padding: 10,
    },
    h1: {
      fontSize: 22,
    },
    theme: {
      big: {
        base: {
          padding: 20,
        },
        h1: {
          fontSize: 50,
        }
      }
    },
  }
}


// Use
React.render(<Title big />, document.getElementById('app'))
```


### Parent Styles

Helpful for maintaining a common set of styles for every component. Use `$$` to access, to keep things explicit.

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
