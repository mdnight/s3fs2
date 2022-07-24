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
    afterEach(function () {
      sinon.reset()
    })

    it('should create multipart upload and return uploadId', async function () {
      const client = new Client('region', 'bucket')
      const stub = sinon.stub(client._client, 'send')
      stub.returns({
        UploadId: '123',
        ETag: 'qwerty',
      })

      const uploadId = await client.createMultipartUpload('key')
      assert.equal(uploadId, '123')
    })

    it('should return something if bucket is not found', async function () {
    })

    it('should return something overall is wrong', async function () {
    })
  })

  describe('uploadPart', async function () {
    afterEach(function () {
      sinon.reset()
    })

    it('should upload part', async function () {

    })

    it('should throw an exception if uploadId is undefined', async function () {

    })

    it('should throw an exception if buffer is undefined', async function () {

    })

    it('should throw an exception if key is undefined', async function () {

    })

    it('should throw an exception if partNumber is undefined', async function () {

    })
  })

  describe('completeMultipartUpload', async function () {
    afterEach(function () {
      sinon.reset()
    })

    it('should complete multipart upload', async function () {

    })

    it('should throw an exception if uploadId is undefined', async function () {

    })

    it('should throw an exception if key is undefined', async function () {

    })

    it('should throw an exception if partNumber is undefined', async function () {

    })
  })

  describe('abortMultipartUpload', async function () {
    afterEach(function () {
      sinon.reset()
    })

    it('should abort multipart upload', async function () {

    })

    it('should throw an exception if uploadId is undefined', async function () {

    })

    it('should throw an exception if key is undefined', async function () {

    })
  })

  describe('listObjects', async function () {
    afterEach(function () {
      sinon.reset()
    })

    it('should return a list of objects', async function () {

    })

    it('should throw an exception if prefix is invalid', async function () {

    })

    it('should throw an exception if marker is invalid', async function () {

    })
  })
})
