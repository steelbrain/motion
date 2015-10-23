// fancy debounce
// detects if we are in autosave mode

const sum = (a, b) => a + b

view Debounce {
  const memory = 10

  let isAutoSaving = false
  let min
  let lastTime = Date.now()
  let avgDiff, lastFew = []

  // dont update unless we want to
  view.pause()

  on('props', () => {
    min = ^min || 2000

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
      }
    }

    // override
    if (^force)
      return view.update()

    // debounce
    if (diff > min)
      view.update()
    else
      setTimeout(view.update, min)
  })

  <test>
    <debounce yield />
  </test>
}