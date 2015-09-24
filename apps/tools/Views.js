const lastUnique = (arr, num) => {
  let taken = {};
  result = [];
  arr.forEach(val => {
    if (!taken[val]) {
      result.push(val);
      taken[val] = true;
    }
  })
  return result;
}
const type = prop => (typeof prop).split().slice(3).join('')
const inspect = (obj, name) => ({
  name,
  type: type(obj[name]),
  val: typeof obj[name] === 'object' ? JSON.stringify(obj[name]) : obj[name]
})
const info = obj => Object.keys(obj)
  .reduce((acc, val) => acc.concat(inspect(obj, val)), [])

view Views {
  let views = []

  listen('viewChange', () => {
    const flint = f()
    views = flint.activeViews && flint.variables &&
      lastUnique(flint.lastChangedViews, 5)
      .map(id => ({
        props: info(flint.activeViews[id].props),
        variables: info(flint.values[id])
      }))
  })

  <views repeat={views}>{view =>
    null
  }</views>

  $views = {
    width: '100%',
    background: '#f2f2f2',
    flexFlow: 'row',
    overflow: 'scroll',
    flexDirection: 'row-reverse',
    maxHeight: '50%'
  }
}

view Views.View {
  <view>
    <name>{^name}</name>
    <props class="section">
      <subtitle>Props</subtitle>
      <row>
        {^props && ^props.map(prop =>
          <Prop {...prop} />
        )}
      </row>
    </props>

    <variables class='section'>
      <subtitle>variables</subtitle>
      <row>
        {^variables && ^variables.map(variable =>
          <Prop {...variable} />
        )}
      </row>
    </variables>
  </view>

  $view = {
    background: '#fff',
    boxShadow: '0 0 5px rgba(0,0,0,0.15)',
    padding: 8,
    margin: 8
  }

  $name = {
    color: '#000',
    fontSize: 15,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    margin: '0 0 4px 0'
  }

  $subtitle = {
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontSize: 12,
    color: '#444',
    margin: '0 0 2px 0',
    background: '#fff',
    display: 'inline-block'
  }

  $row = {
    flexFlow: 'row'
  }

  $.section = {
    padding: '5px 0',
    margin: '0 0 4px 0'
  }
}

view Prop {
  <prop>
    <name>{^name} <type>{^type}</type></name>
    <val>{JSON.stringify(^val)}</val>
  </prop>

  $prop = {
    padding: 5,
    border: '1px solid #eee',
    marginRight: -1
  }

  $name = {
    display: 'inline',
    fontWeight: 'bold',
    fontSize: 13
  }

  $type = {
    fontWeight: 'normal',
    display: 'inline',
    color: '#999'
  }
}
