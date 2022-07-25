'use strict'

import assert from 'assert'
import sinon from 'sinon'

import { S3WriteStream } from '../../lib/s3-write-stream.mjs'
import Client from '../../lib/s3-client.mjs'

describe('lib/s3-client', function () {
  describe('start', function () {
    afterEach(function () {
      sinon.restore()
    })

    it('should set UploadId', async function () {
      const stub = sinon.createStubInstance(Client, {
        createMultipartUpload: sinon.stub().withArgs('key').resolves('uploadID')
      })

      const writeStream = new S3WriteStream(stub, 'key', {})
      await writeStream.start()

      assert.equal(writeStream._uploadId, 'uploadID')
    })

    it('should throw an exception if uploadId was not set', async function () {
      const stub = sinon.createStubInstance(Client, {
        createMultipartUpload: sinon.stub().withArgs('key').resolves(undefined)
      })
      const writeStream = new S3WriteStream(stub, 'key', {})

      try {
        await writeStream.start()
        assert.fail('exception is not thrown')
      } catch (e) {
        assert.equal(e.message, 'Upload ID is not retrieved')
      }
    })
  })

  describe('_write (multipart)', function () {
    it('should throw an exception if uploadId is not defined', function () {
      const writeStream = new S3WriteStream('client', 'key', {})

      try {
        writeStream._write(Buffer.from('smth'))
        assert.fail('exception is not thrown')
      } catch (e) {
        assert.equal(e.message, 'uploadId not defined. Have you called "start" method after you created this object?')
      }
    })

    it('should throw an exception if uploadId is not defined', function () {
      const writeStream = new S3WriteStream('client', 'key', {})

      try {
        writeStream._write(Buffer.from('smth'))
        assert.fail('exception is not thrown')
      } catch (e) {
        assert.equal(e.message, 'uploadId not defined. Have you called "start" method after you created this object?')
      }
    })
  })
})
