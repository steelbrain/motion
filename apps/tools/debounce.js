// fancy debounce
// detects if we are in autosave mode

const sum = (a, b) => a + b
const Delay = 300
const AutoDelay = 800
const Avg = 5000
const Clear = 1000 * 10
const AutoDetectAvgDiff = 1000

view Debounce {
  let showKey, timeout, lastTime, delay, curDelay, avgDiff
  let isAutoSaving = false
  let lastFew = []

  // dont update unless we want to
  view.pause()

  on.props(() => {
    // override
    if (view.props.force) {
      showKey = Math.random()
      return show()
    }

    if (view.props.showKey && view.props.showKey == showKey)
      return

    showKey = view.props.showKey
    delay = view.props.delay || Delay
    curDelay = curDelay || delay

    // find diff
    const now = Date.now()
    const diff = lastTime ? now - lastTime : Avg // or init to 5s
    lastTime = now

    // update queue
    lastFew.unshift(diff)
    if (lastFew.length > 3) lastFew.pop()

    // if its been a while, clear running avg
    if (diff > Clear) {
      lastFew = []
    }
    // otherwise update avg
    else {
      if (lastFew.length == 3) {
        // find avg of last few
        avgDiff = lastFew.reduce(sum, 0) / lastFew.length
        // set autosaving
        isAutoSaving = avgDiff < AutoDetectAvgDiff
        curDelay = isAutoSaving ? AutoDelay : delay
      }
    }

    function show() {
      if (view.props.onUpdate)
        view.props.onUpdate()

      view.update()
    }

    // debounce
    clearTimeout(timeout)
    timeout = setTimeout(show, curDelay)
  })
}