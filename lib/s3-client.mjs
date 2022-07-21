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

    this.bucket = bucket
    this.client = new S3Client({
      credentials,
      region
    })
  }

  async uploadNormally (key, body) {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: body
      }
    })

    await upload.done()
  }

  async createMultipartUpload (key) {
    const response = await this.client.send(new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key
    }))

    if (!response.UploadId) {
      throw new Error(`CreateMultipartUploadCommand failed: ${response}`)
    }

    return response.UploadId
  }

  async uploadPart (buffer, key, partNumber, uploadId) {
    const response = await this.client.send(new UploadPartCommand({
      Bucket: this.bucket,
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
    return await this.client.send(new CompleteMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: uploadedParts
      }
    }))
  }

  async abortMultipartUpload (key, uploadId) {
    return await this.client.send(new AbortMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId
    }))
  }

  async deleteObjects (paths) {
    const command = new DeleteObjectsCommand({
      Bucket: this.bucket,
      Delete: {
        Objects: paths.map(item => ({
          Key: item
        })),
        Quiet: true
      }
    })

    const data = await this.client.send(command)

    return data?.$metadata?.httpStatusCode
  }

  async listObjects (prefix, marker) {
    const command = new ListObjectsCommand({
      Bucket: this.bucket,
      Prefix: prefix,
      Marker: marker
    })

    return this.client.send(command)
  }
}
