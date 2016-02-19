import {
  browser,
  isLive,
  showMotionErrorDiv
} from './helpers'

const last = arr => arr[arr.length - 1]
const fileName = url => url && url.replace(/[\?\)].*/, '')
const getLine = err => err && (err.line || err.loc && err.loc.line)

view Errors.Message {
  let hasError = false
  let error = {}
  let npmError, fullStack
  let line = getLine(view.props.error)
  let clearDelay

  on.props(() => {
    clearDelay && clearDelay()

    npmError = view.props.npmError
    hasError = !!(view.props.error || view.props.npmError)
    error = view.props.error || error // keep old
    line = getLine(error)
    fullStack = null

    // show full stack after a delay
    if (error) {
      clearDelay = on.delay(2500, () => {
        if (hasError && error.fullStack) {
          fullStack = error.fullStack
        }
      })
    }
  })

  // update on editor state
  browser.on('editor:state', () => setTimeout(view.update))

  <Debounce
    // delay more during live typing
    delay={isLive() ? 2000 : 1000}
    force={hasError === false}
    showKey={error && error.timestamp || fullStack}
    onUpdate={showMotionErrorDiv}
  >
    <bar>
      <Close onClick={view.props.close} size={35} />
      <inner if={npmError}>
        <where><motion>{npmError.name}</motion></where> {npmError.msg}
      </inner>

      <inner>
        <top>
          <where>
            <span>In <motion>{fileName(error.file)}</motion></span>
            <line>{line ? ' line' : ''} <motion if={line}>{line}</motion></line>
          </where>

          {' '}

          <shortError>
            {(error.niceMessage || error.message || '').trim()}
            <niceStack if={error.niceStack}>
              {error.niceStack[0]}
              <errCol>{error.niceStack[1]}</errCol>
              {error.niceStack[2]}
            </niceStack>
          </shortError>

          <help if={error.help}>
            {error.help}
          </help>
        </top>

        <fullStack if={fullStack}>
          <ln>{'' + fullStack[0]}</ln>
          <ln class="cur">{'' + fullStack[1]}</ln>
          <ln>{'' + fullStack[2]}</ln>
        </fullStack>
      </inner>
    </bar>
  </Debounce>

  const red = '#cd423e'

  $bar = {
    display: 'block',
    background: red,
    position: 'fixed',
    left: 0,
    bottom: hasError ? 0 : -100,
    transition: 'all 200ms ease-in',
    right: 0,
    fontFamily: '-apple-system, "San Francisco", Roboto, "Segou UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontWeight: 300,
    color: '#fff',
    fontSize: '14px',
    padding: 2,
    pointerEvents: 'all',
    overflow: 'hidden',
    zIndex: 2147483647,
    boxShadow: '0 -6px 12px rgba(0,0,0,0.06)',
  }

  $inner = {
    display: 'block',
    maxHeight: 200,
    overflowY: 'scroll'
  }

  $top = {
    padding: 8,
    display: 'block'
  }

  $where = {
    display: 'inline-block',
    pointerEvents: 'all',
    fontWeight: 300,
    color: 'rgba(255,255,255,0.8)',
  }

  $line = {
    display: 'inline-block',
    whiteSpace: 'pre',
    pointerEvents: 'all'
  }

  $motion = {
    display: 'inline',
    fontWeight: 700,
    color: '#fff'
  }

  $shortError = {
    display: 'inline',
    color: 'rgba(255,255,255,0.7)'
  }

  const stack = {
    color: 'rgba(255,255,255,0.85)',
    display: 'inline',
    fontFamily: 'Meslo, Menlo, Monaco, monospace',
    padding: [0, 5]
  }

  $niceStack = stack

  $cur = {
    background: '#fff'
  }

  $errCol = {
    display: 'inline',
    borderBottom: '2px solid #f5d64c',
    margin: -3,
    padding: 3,
    color: '#fff'
  }

  $fullStack = [stack, {
    maxHeight: fullStack ? 600 : 0,
    padding: fullStack ? [10, 0] : 0,
    transition: 'maxHeight ease-in 300ms',
    color: 'rgba(0,0,0,0.85)',
    background: 'rgba(255,255,255,0.9)',
    display: 'block',
    whiteSpace: 'pre',
    fontSize: 14,
    borderRadius: 3,
    margin: 2
  }]

  $ln = {
    padding: [0, 20]
  }

  $motionline = {
    whiteSpace: 'pre',
    pointerEvents: 'all',
    fontWeight: 'motion'
  }
}
