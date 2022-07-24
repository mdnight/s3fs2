'use strict'

import assert from 'assert'
import sinon from 'sinon'

import Client from '../../lib/s3-client.mjs'

describe('lib/s3-client', function () {
  describe('constructor', function () {
    it('should fail if region is not provided', function () {
      assert.throws(
        () => new Client(),
        {
          name: 'Error',
          message: 'AWS_REGION is not provided as an argument or env variable',
        }
      )
    })

    it('should fail if S3_BUCKET is not provided', function () {
      assert.throws(
        () => new Client('aws-region'),
        {
          name: 'Error',
          message: 'S3_REGION is not provided as an argument or env variable',
        }
      )
    })
  })

  describe('uploadNormally', async function () {
    afterEach(function () {
      sinon.reset()
    })

    it('should be able to upload file in normal way', async function () {
      const client = new Client('region', 'bucket')
      const stub = sinon.stub(client._client, 'send')
      stub.returns({
        UploadId: '123',
        ETag: 'qwerty',
      })

      await client.uploadNormally('key', 'x'.repeat(6 * 1024 * 1024))
    })
  })

  describe('createMultipartUpload', async function () {
    beforeEach(function () {
      this.client = new Client('region', 'bucket')
    })

    afterEach(function () {
      sinon.reset()
    })

    it('should create multipart upload and return uploadId', async function () {
      const stub = sinon.stub(this.client._client, 'send')
      stub.returns({
        UploadId: '123',
        ETag: 'qwerty',
      })

      const uploadId = await this.client.createMultipartUpload('key')
      assert.equal(uploadId, '123')
    })

    const invalidArgument = [
      { it: 'empty string', value: '' },
      { it: 'null', value: null },
      { it: 'undefined', value: undefined },
    ]
    invalidArgument.forEach(function (run) {
      it(`should throw an exception if key is ${run.it}`, async function () {
        try {
          await this.client.createMultipartUpload(run.value)
        } catch (e) {
          assert.equal(e.message, 'key is not provided')
          return
        }
        assert.fail('exception is not thrown')
      })
    })

    it('should throw exception if .send() is failed', async function () {
      const stub = sinon.stub(this.client._client, 'send')
      stub.returns({
        UploadId: undefined
      })
      try {
        await this.client.createMultipartUpload('key')
      } catch (e) {
        assert.ok(true)
        return
      }
      assert.fail('exception is not thrown')
    })
  })

  describe('uploadPart', async function () {
    afterEach(function () {
      sinon.reset()
    })

    it('should upload part', async function () {
      this.skip()
    })

    it('should throw an exception if uploadId is undefined', async function () {
      this.skip()
    })

    it('should throw an exception if buffer is undefined', async function () {
      this.skip()
    })

    it('should throw an exception if key is undefined', async function () {
      this.skip()
    })

    it('should throw an exception if partNumber is undefined', async function () {
      this.skip()
    })
  })

  describe('completeMultipartUpload', async function () {
    afterEach(function () {
      sinon.reset()
    })

    it('should complete multipart upload', async function () {
      this.skip()
    })

    it('should throw an exception if uploadId is undefined', async function () {
      this.skip()
    })

    it('should throw an exception if key is undefined', async function () {
      this.skip()
    })

    it('should throw an exception if partNumber is undefined', async function () {
      this.skip()
    })
  })

  describe('abortMultipartUpload', async function () {
    afterEach(function () {
      sinon.reset()
    })

    it('should abort multipart upload', async function () {
      this.skip()
    })

    it('should throw an exception if uploadId is undefined', async function () {
      this.skip()
    })

    it('should throw an exception if key is undefined', async function () {
      this.skip()
    })
  })

  describe('listObjects', async function () {
    afterEach(function () {
      sinon.reset()
    })

    it('should return a list of objects', async function () {
      this.skip()
    })

    it('should throw an exception if prefix is invalid', async function () {
      this.skip()
    })

    it.skip('should throw an exception if marker is invalid', async function () {
    })
  })
})
