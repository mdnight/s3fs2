'use strict'

import { Buffer } from 'buffer'
import { Writable } from 'node:stream'
import { Upload } from '@aws-sdk/lib-storage'
import {
  AbortMultipartUploadCommand,
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  UploadPartCommand
} from '@aws-sdk/client-s3'

const MinMultipartSizeAllowed = 1024 * 1024 * 5
const MinMultipartSize = 1024 * 1024 * 20

export class S3WriteStream extends Writable {
  uploadId = null

  /**
   * @type {(client: S3Client, bucket: string, key: string, options: object) => ()}
   */
  constructor (client, bucket, key, options) {
    super(options)
    this.client = client
    this.bucket = bucket
    this.key = key
    this.options = options
    this.partNumber = 0
    this.uploadedParts = []
    this._promises = []

    this._buffer = Buffer.alloc(0)
    this._bufferTotalLength = 0
    this._totalBytesCount = 0
  }

  async start () {
    const response = await this.client.send(new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: this.key
    }))

    this.uploadId = response.UploadId

    if (this.uploadId === null) {
      throw new Error(`CreateMultipartUploadCommand failed: ${response}`)
    }
  }

  _convertToBuffer (chunk) {
    if (chunk instanceof Buffer) {
      return chunk
    }

    return Buffer.from(chunk)
  }

  _normalUpload () {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: this.key,
        Body: this._buffer
      }
    })

    upload.on('httpUploadProgress', (progress) => {
      console.log(progress)
    })

    upload.done()
      .then(() => console.log(`Normal uploading succeeded ${this.key}`))
      .catch((err) => console.log(`Normal uploading failed. File ${this.key}, error: ${err}`))
  }

  _multipartUpload (callback) {
    const partNumber = ++this.partNumber
    const promise = this.client.send(new UploadPartCommand({
      Bucket: this.bucket,
      Body: this._buffer,
      Key: this.key,
      PartNumber: partNumber,
      UploadId: this.uploadId
    }))
      .then(uploadPartResponse => {
        this.uploadedParts.push({ PartNumber: partNumber, ETag: uploadPartResponse.ETag.replaceAll('"', '') })
        if (callback) {
          callback()
        }
      })
      .catch(err => {
        console.log(err)
        if (callback) {
          callback(err)
        }
      }) // todo: emit error or destroy event here

    this._promises.push(promise)
  }

  _write (chunk, encoding, callback) {
    const chunkBuffer = this._convertToBuffer(chunk)
    this._buffer = Buffer.concat([this._buffer, chunkBuffer], this._buffer.length + chunkBuffer.length)
    this._totalBytesCount += chunkBuffer.length

    if (this._totalBytesCount >= MinMultipartSizeAllowed && this._buffer.length >= MinMultipartSize) {
      this._multipartUpload(callback)
      this._buffer = Buffer.alloc(0)
      return
    }
    callback()
  }

  end (chunk, encoding, callback) {
    if (chunk) {
      this._write(chunk)
    }

    if (this.uploadedParts !== 0) {
      this._multipartUpload()
      Promise.allSettled(this._promises)
        .then(() => {
          this.uploadedParts = this.uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber)
          this.client.send(new CompleteMultipartUploadCommand({
            Bucket: this.bucket,
            Key: this.key,
            UploadId: this.uploadId,
            MultipartUpload: {
              Parts: this.uploadedParts
            }
          }))
            .then(completeResponse => console.log('Upload complete: ', completeResponse.Key))
            .catch(err => console.log(err))
        })
    } else {
      this._normalUpload()
    }
  }

  async _destroy (err) {
    console.log('the stream is being destroyed: ', err)
    await this.client.send(new AbortMultipartUploadCommand({
      Bucket: this.bucket,
      Key: this.key,
      UploadId: this.uploadId
    }))
  }
}
