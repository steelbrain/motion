'use babel'

// Our sugar method that allows us to pass async functions and do await in it
export function it(name, callback) {
  global.it(name, function() {
    const value = callback()
    if (value && value.constructor.name === 'Promise') {
      waitsForPromise({timeout: 10 * 1000}, function() {
        return value
      })
    }
  })
}

export function wait(timeout) {
  return new Promise(function(resolve) {
    setTimeout(resolve, timeout)
  })
}

// Jasmine 1.3.x has no sane way of resetting to native clocks, and since we're
// gonna test promises and such, we're gonna need it
function resetClock() {
  for (const key in jasmine.Clock.real) {
    window[key] = jasmine.Clock.real[key]
  }
}

beforeEach(function() {
  resetClock()
})
