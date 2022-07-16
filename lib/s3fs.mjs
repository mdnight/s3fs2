'use strict'

import * as nodePath from 'node:path'
import FsInterface from './fsInterface.mjs'
import { Upload } from '@aws-sdk/lib-storage'
import { DeleteObjectsCommand, ListObjectsCommand } from '@aws-sdk/client-s3'

export const Status = {
  Ok: 'ok',
  Fail: 'fail',
  NotFound: 'notFound'
}

export default class S3Fs extends FsInterface {
  constructor (s3Client, bucket, basePath, logLevel) {
    super()

    this.client = s3Client
    this.bucket = bucket
    this.basePath = basePath
    this.logLevel = logLevel
  }

  /**
   * Asynchronously creates a directory.
   * @param path - relative path to the directory
   * @return {string} - ok, fail or alreadyExists
   * @return {string} - ok fail
   * @type {(path: string) => string}
   */
  async mkdir (path, { isRecursive = false } = {}) {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: nodePath.join(path, '/'),
        Body: ''
      }
    })

    await upload.done()
    return Status.Ok
  }

  async readdir (path) {
    let marker
    let result = []
    let isTruncated = true

    do {
      const data = await this._fetchDirData(path, marker)
      if (undefined === data.Contents) {
        return Status.NotFound
      }

      const files = data.Contents
        .map(content => content.Key)
        .concat((data.CommonPrefixes ?? []).map(content => content.Prefix))
        .map(item => item.startsWith('/') ? item.slice(1) : item)
      result = [...result, ...files]
      marker = data.NextMarker
      isTruncated = data.IsTruncated
    } while (isTruncated === true)

    return result
  };

  async _fetchDirData (name, marker) {
    const command = new ListObjectsCommand({
      Bucket: this.bucket,
      Prefix: nodePath.join(this.basePath, name),
      Marker: marker
    })

    return this.client.send(command)
  }

  // realpath() {}

  async rmdir (path) {
    const paths = await this.readdir(path)

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

    return data?.$metadata?.httpStatusCode === 200 ? Status.Ok : Status.Fail
  }

  async writeFile (file, data, { signal } = {}) {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: file,
        Body: data
      }
    })

    upload.on('httpUploadProgress', (progress) => {
      console.log(progress)
    })

    await upload.done()

    return Status.Ok
  }
  // appendFile() {}
  // createReadStream() {}
  // createWriteStream() {}
  // unlink() {}
  // stat() {}
  // lstat() {}
}
