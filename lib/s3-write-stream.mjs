'use strict'

import { Buffer } from 'node:buffer'
import { Writable } from 'node:stream'
import * as utils from './utils.mjs'

const MinMultipartSizeAllowed = 1024 * 1024 * 5
const MinMultipartSize = 1024 * 1024 * 20

export class S3WriteStream extends Writable {
  /**
   * @type {(client: S3Client, key: string, options: object) => ()}
   */
  constructor (client, key, options) {
    super(options)
    this._client = client
    this._key = key
    this._partNumber = 0
    this._uploadedParts = []
    this._promises = []
    this._uploadId = null

    this._buffer = Buffer.alloc(0)
    this._bufferTotalLength = 0
    this._totalBytesCount = 0
  }

  async start () {
    this._uploadId = await this._client.createMultipartUpload(this._key)

    if (!this._uploadId) {
      throw new Error('Upload ID is not retrieved')
    }
  }

  _multipartUpload (callback) {
    const partNumber = ++this._partNumber
    const promise = this._client.uploadPart(
      this._buffer,
      this._key,
      partNumber,
      this._uploadId
    )
      .then(uploadPartResponse => {
        this._uploadedParts.push({ PartNumber: partNumber, ETag: uploadPartResponse.ETag.replaceAll('"', '') })
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
    if (!this._uploadId) throw new Error('uploadId not defined. Have you called "start" method after you created this object?')

    const chunkBuffer = utils.convertToBuffer(chunk)
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
    if (!this._uploadId) throw new Error('uploadId not defined. Have you called "start" method after you created this object?')

    if (chunk) {
      this._write(chunk)
    }

    if (this._uploadedParts !== 0) {
      this._multipartUpload()
      Promise.allSettled(this._promises)
        .then(() => {
          this._uploadedParts = this._uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber)
          this._client.completeMultipartUpload(this._key, this._uploadId, this._uploadedParts)
            .then(completeResponse => console.log('Upload complete: ', completeResponse.Key))
            .catch(err => console.log(err))
        })
    } else {
      this._client.uploadNormally(this._key, this._buffer)
    }
  }

  async _destroy (err) {
    console.log('the stream is being destroyed: ', err)
    this._client.abortMultipartUpload(this._key, this._uploadId)
  }
}
