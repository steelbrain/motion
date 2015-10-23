// fancy debounce
// detects if we are in autosave mode

const sum = (a, b) => a + b

view Debounce {
  const memory = 10
  const autoSaveDelay = 6000 // longer during autosave

  let isAutoSaving = false
  let delay, curDelay
  let lastTime = Date.now()
  let avgDiff, lastFew = []

  // dont update unless we want to
  view.pause()

  on('props', () => {
    delay = ^delay || 2000
    curDelay = curDelay || delay

    // find diff
    const now = Date.now()
    const diff = now - lastTime
    lastTime = now

    // update queue
    lastFew.unshift(diff)
    if (lastFew.length > 3)
      lastFew.pop()

    // if its been a while, clear it
    if (diff > 1000 * 10) {
      lastFew = []
    }
    // otherwise update avg
    else {
      if (lastFew.length) {
        // find avg of last few
        avgDiff = lastFew.reduce(sum, 0) / lastFew.length
        // set autosaving
        isAutoSaving = avgDiff < 2000

        delay = isAutoSaving ? autoSaveDelay : delay
      }
    }

    // override
    if (^force)
      return view.update()

    // debounce
    if (diff > delay)
      view.update()
    else
      setTimeout(view.update, delay)
  })

  <debounce yield />
}