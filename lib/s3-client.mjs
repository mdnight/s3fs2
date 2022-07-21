'use strict'

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

export default class {
  constructor (credentials, region, bucket) {
    if (!region) {
      throw new Error('AWS_REGION is not defined in env vars.')
    }
    if (!credentials) {
      throw new Error('AWS credentials are not provided')
    }

    this._bucket = bucket
    this._client = new S3Client({
      credentials,
      region
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
