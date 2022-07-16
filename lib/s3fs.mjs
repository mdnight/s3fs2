'use strict'

import * as nodePath from 'node:path'
import FsInterface from './fsInterface.mjs'
import { DeleteObjectCommand, ListObjectsCommand } from '@aws-sdk/client-s3'

export const Status = {
  Ok: 'ok',
  Fail: 'fail',
  NotFound: 'notFound'
}

export default class S3Fs extends FsInterface {
  constructor (s3Client, bucket, basePath) {
    super()

    this.client = s3Client
    this.bucket = bucket
    this.basePath = basePath
  }

  // stat() {}
  // mkdir() {}
  async readdir (name) {
    let marker
    let result = []
    let isTruncated = true

    do {
      const data = await this._fetchDirData(name, marker)
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
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: nodePath.join(path, '/')
    })

    const data = await this.client.send(command)

    return data?.$metadata?.httpStatusCode === 204 ? Status.Ok : Status.Fail
  }
  // writeFile() {}
  // appendFile() {}
  // createReadStream() {}
  // createWriteStream() {}
  // unlink() {}
  // exists() {}
  // stat() {}
  // lstat() {}
}
