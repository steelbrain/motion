// fancy debounce
// detects if we are in autosave mode

const sum = (a, b) => a + b

const Delay = 400
const Avg = 5000
const Clear = 1000 * 10
const AutoDetectAvgDiff = 1000
const AutoDelay = 1200

view Debounce {
  let timeout, lastTime, delay, curDelay, avgDiff
  let isAutoSaving = false
  let lastFew = []

  // dont update unless we want to
  view.pause()

  on('props', () => {
    delay = ^delay || Delay
    curDelay = curDelay || delay

    // find diff
    const now = Date.now()
    const diff = lastTime ? now - lastTime : Avg // or init to 5s
    lastTime = now

    // update queue
    lastFew.unshift(diff)
    if (lastFew.length > 3)
      lastFew.pop()

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

    // override
    if (^force)
      return view.update()

    // debounce
    clearTimeout(timeout)
    timeout = setTimeout(view.update, curDelay)
  })

  <debounce yield />
}