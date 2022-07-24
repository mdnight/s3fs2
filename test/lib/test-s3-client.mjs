'use strict'

import { Buffer } from 'buffer'
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
      stub.resolves({
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
      stub.resolves({
        UploadId: 123,
        ETag: 'qwerty',
      })

      const uploadId = await this.client.createMultipartUpload('key')
      assert.equal(uploadId, '123')
    })

    const invalidArguments = [
      { it: 'empty string', value: '' },
      { it: 'null', value: null },
      { it: 'undefined', value: undefined },
    ]
    invalidArguments.forEach(function (run) {
      it(`should throw an exception if key is ${run.it}`, async function () {
        try {
          await this.client.createMultipartUpload(run.value)
        } catch (e) {
          assert.equal(e.message, 'key is not provided or invalid')
          return
        }
        assert.fail('exception is not thrown')
      })
    })

    it('should throw exception if .send() is failed', async function () {
      const stub = sinon.stub(this.client._client, 'send')
      stub.resolves({
        UploadId: undefined
      })
      try {
        await this.client.createMultipartUpload('key')
      } catch (e) {
        return
      }
      assert.fail('exception is not thrown')
    })
  })

  describe('uploadPart', async function () {
    beforeEach(function () {
      this.client = new Client('region', 'bucket')
    })

    afterEach(function () {
      sinon.reset()
    })

    it('should upload part', async function () {
      const stub = sinon.stub(this.client._client, 'send')
      stub.resolves({
        PartNumber: 1,
        ETag: '"qwe123qwe123qwe"',
      })

      const response = await this.client.uploadPart(Buffer.from('buffer'), 'key', 1, 'uploadID')

      assert.equal(response.PartNumber, 1)
      assert.equal(response.ETag, 'qwe123qwe123qwe')
    })

    let invalidArguments = [
      { it: 'empty string', value: '' },
      { it: 'null', value: null },
      { it: 'undefined', value: undefined },
    ]
    invalidArguments.forEach(function (run) {
      it(`should throw an exception if buffer is ${run.it}`, async function () {
        try {
          await this.client.uploadPart(run.value, 'key', 1, 'uploadID')
        } catch (e) {
          assert.equal(e.message, 'buffer is not provided or invalid')
          return
        }
        assert.fail('exception is not thrown')
      })
    })

    invalidArguments = [
      { it: 'empty string', value: '' },
      { it: 'null', value: null },
      { it: 'undefined', value: undefined },
    ]
    invalidArguments.forEach(function (run) {
      it(`should throw an exception if key is ${run.it}`, async function () {
        try {
          await this.client.uploadPart(Buffer.from('buffer'), run.value, 1, 'uploadID')
        } catch (e) {
          assert.equal(e.message, 'key is not provided or invalid')
          return
        }
        assert.fail('exception is not thrown')
      })
    })

    invalidArguments = [
      { it: 'empty string', value: '' },
      { it: 'not empty string', value: 'something' },
      { it: 'null', value: null },
      { it: 'undefined', value: undefined },
    ]
    invalidArguments.forEach(function (run) {
      it(`should throw an exception if partNumber is ${run.it}`, async function () {
        try {
          await this.client.uploadPart(Buffer.from('buffer'), 'key', run.value, 'uploadID')
        } catch (e) {
          assert.equal(e.message, 'part number is not provided or invalid')
          return
        }
        assert.fail('exception is not thrown')
      })
    })

    invalidArguments = [
      { it: 'empty string', value: '' },
      { it: 'null', value: null },
      { it: 'undefined', value: undefined },
    ]
    invalidArguments.forEach(function (run) {
      it(`should throw an exception if uploadId is ${run.it}`, async function () {
        try {
          await this.client.uploadPart(Buffer.from('buffer'), 'key', 1, run.value)
        } catch (e) {
          assert.equal(e.message, 'uploadId is not provided or invalid. Have you called createMultipartUpload before?')
          return
        }
        assert.fail('exception is not thrown')
      })
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
