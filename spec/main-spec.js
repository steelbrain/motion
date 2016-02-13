'use babel'

import {waitsForAsync, waitsForAsyncRejection} from './helpers'

describe('Motion', function() {
  describe('expect..toBe', function() {
    it('performs strict matching', function() {
      expect(true).toBe(true)
      expect(false).not.toBe(true)
      expect({}).not.toBe({})
    })
  })

  describe('expect..toEqual', function() {
    it('works well with literals', function() {
      expect(true).toEqual(true)
      expect(false).not.toEqual(true)
    })
    it('works well with objects', function() {
      expect({}).toEqual({})
      expect({a: ''}).toEqual({a: ''})
      expect({a: ''}).not.toEqual({a: 1})
    })
  })

  describe('waitsForAsync', function() {
    it('makes sure the promise resolves', function() {
      waitsForAsync(async function() {

      })
    })
    it('strict matches the return value of the promise', function() {
      waitsForAsync(async function() {
        return 50
      }, 50)
    })
  })

  describe('waitsForAsyncRejection', function() {
    it('makes sure the promise rejects', function() {
      waitsForAsyncRejection(async function() {
        throw 50
      })
    })
    it('matches the message of the thrown error', function() {
      waitsForAsyncRejection(async function() {
        throw new Error('Error Message yo!')
      }, 'Error Message yo!')
    })
  })
})
