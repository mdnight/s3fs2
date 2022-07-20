'use strict'

import { Buffer } from 'buffer'
import { Writable } from 'node:stream'

const MinMultipartSizeAllowed = 1024 * 1024 * 5
const MinMultipartSize = 1024 * 1024 * 20

export class S3WriteStream extends Writable {
  uploadId = null

  /**
   * @type {(client: S3Client, key: string, options: object) => ()}
   */
  constructor (client, key, options) {
    super(options)
    this.client = client
    this.key = key
    this.partNumber = 0
    this.uploadedParts = []
    this._promises = []

    this._buffer = Buffer.alloc(0)
    this._bufferTotalLength = 0
    this._totalBytesCount = 0
  }

  async start () {
    this.uploadId = await this.client.createMultipartUpload(this.key)

    if (!this.uploadId) {
      throw new Error('Upload ID is not retrieved')
    }
  }

  _convertToBuffer (chunk) {
    if (chunk instanceof Buffer) {
      return chunk
    }

    return Buffer.from(chunk)
  }

  _multipartUpload (callback) {
    const partNumber = ++this.partNumber
    const promise = this.client.uploadPart(
      this._buffer,
      this.key,
      partNumber,
      this.uploadId
    )
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
      })
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
          this.client.completeMultipartUpload(this.key, this.uploadId, this.uploadedParts)
            .then(completeResponse => console.log('Upload complete: ', completeResponse.Key))
            .catch(err => console.log(err))
        })
    } else {
      this.client.uploadNormally(this.key, this._buffer)
    }
  }

  async _destroy (err) {
    console.log('the stream is being destroyed: ', err)
    this.client.abortMultipartUpload(this.key, this.uploadId)
  }
}
