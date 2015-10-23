// fancy debounce
// detects if we are in autosave mode

const sum = (a, b) => a + b

view Debounce {
  const autoSaveDelay = 2500 // longer during autosave

  let timeout
  let isAutoSaving = false
  let delay, curDelay
  let lastTime
  let avgDiff, lastFew = []

  // dont update unless we want to
  view.pause()

  on('props', () => {
    delay = ^delay || 800
    curDelay = curDelay || delay

    // find diff
    const now = Date.now()
    const diff = lastTime ? now - lastTime : 5000
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
      if (lastFew.length == 3) {
        // find avg of last few
        avgDiff = lastFew.reduce(sum, 0) / lastFew.length
        // set autosaving
        isAutoSaving = avgDiff < 2000
        curDelay = isAutoSaving ? autoSaveDelay : delay
      }
    }

    // override
    console.log('force', ^force)
    if (^force)
      return view.update()

    // debounce
    console.log('set timeout', curDelay)
    clearTimeout(timeout)
    timeout = setTimeout(view.update, curDelay)
  })

  <debounce yield />
}