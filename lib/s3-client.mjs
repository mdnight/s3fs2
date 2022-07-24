'use strict'

import { env } from 'process'
import { Buffer } from 'buffer'

import {
  S3Client,
  AbortMultipartUploadCommand,
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  DeleteObjectsCommand,
  ListObjectsCommand,
  UploadPartCommand
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { fromEnv } from '@aws-sdk/credential-providers'

export default class {
  constructor (region, bucket) {
    if (!(region ?? env.AWS_REGION)) {
      throw new Error('AWS_REGION is not provided as an argument or env variable')
    }

    if (!(bucket ?? env.S3_BUCKET)) {
      throw new Error('S3_REGION is not provided as an argument or env variable')
    }

    this._bucket = bucket ?? env.S3_BUCKET
    this._client = new S3Client({
      credentials: fromEnv(),
      region: region ?? env.AWS_REGION
    })
  }

  async uploadNormally (key, body) {
    const upload = new Upload({
      client: this._client,
      params: {
        Bucket: this._bucket,
        Key: key,
        Body: body
      }
    })

    await upload.done()
  }

  async createMultipartUpload (key) {
    if (!(key && typeof key === 'string')) throw new Error('key is not provided or invalid')

    const response = await this._client.send(new CreateMultipartUploadCommand({
      Bucket: this._bucket,
      Key: key
    }))

    if (!response.UploadId) {
      throw new Error(`CreateMultipartUploadCommand failed: ${response}`)
    }

    return response.UploadId
  }

  async uploadPart (buffer, key, partNumber, uploadId) {
    if (!(uploadId && typeof uploadId === 'string')) {
      throw new Error('uploadId is not provided or invalid. Have you called createMultipartUpload before?')
    }

    if (!(buffer && buffer instanceof Buffer)) throw new Error('buffer is not provided or invalid')
    if (!(key && typeof key === 'string')) throw new Error('key is not provided or invalid')
    if (!(partNumber && typeof partNumber === 'number')) throw new Error('part number is not provided or invalid')

    const response = await this._client.send(new UploadPartCommand({
      Bucket: this._bucket,
      Body: buffer,
      Key: key,
      PartNumber: partNumber,
      UploadId: uploadId
    }))

    return {
      PartNumber: partNumber,
      ETag: response.ETag.replaceAll('"', '')
    }
  }

  async completeMultipartUpload (key, uploadId, uploadedParts) {
    return await this._client.send(new CompleteMultipartUploadCommand({
      Bucket: this._bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: uploadedParts
      }
    }))
  }

  async abortMultipartUpload (key, uploadId) {
    return await this._client.send(new AbortMultipartUploadCommand({
      Bucket: this._bucket,
      Key: key,
      UploadId: uploadId
    }))
  }

  async deleteObjects (paths) {
    const command = new DeleteObjectsCommand({
      Bucket: this._bucket,
      Delete: {
        Objects: paths.map(item => ({
          Key: item
        })),
        Quiet: true
      }
    })

    const data = await this._client.send(command)

    return data?.$metadata?.httpStatusCode
  }

  async listObjects (prefix, marker) {
    const command = new ListObjectsCommand({
      Bucket: this._bucket,
      Prefix: prefix,
      Marker: marker
    })

    return this._client.send(command)
  }
}
