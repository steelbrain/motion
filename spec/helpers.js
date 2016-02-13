'use babel'

export function waitsForAsync(asynCallback, result) {
  waitsForPromise(function () {
    return asynCallback().then(function (returnValue) {
      if (typeof result !== 'undefined') {
        expect(returnValue).toEqual(result)
      }
    })
  })
}

export function waitsForAsyncRejection(asynCallback, errorMessage) {
  waitsForPromise(function () {
    return asynCallback().then(function () {
      expect(false).toBe(true)
    }, function (error) {
      if (typeof errorMessage !== 'undefined') {
        expect(error.message).toEqual(errorMessage)
      }
    })
  })
}
