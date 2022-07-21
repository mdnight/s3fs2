'use strict'

import assert from 'assert'
import { Buffer } from 'buffer'
import * as utils from '../../lib/utils.mjs'

describe('lib/utils', function () {
  describe('convertToBuffer', function () {
    it('should convert string', function () {
      const input = 'lolkek'
      const buffer = utils.convertToBuffer(input)
      assert.equal(buffer.length, input.length)
      assert.equal(buffer.toString(), input)
    })

    it('should convert array of bytes', function () {
      const input = [1, 2, 3, 4, 5]
      const buffer = utils.convertToBuffer(input)
      assert.equal(buffer.length, input.length)
    })

    it('should return Buffer if Buffer passed', function () {
      const input = Buffer.from('lolkek')
      const buffer = utils.convertToBuffer(input)
      assert.equal(buffer, input)
    })

    it('should not convert number to Buffer', function () {
      assert.throws(
        () => utils.convertToBuffer(12345),
        {
          name: 'TypeError',
        }
      )
    })
  })
})
