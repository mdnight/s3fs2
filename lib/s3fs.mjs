'use strict'

import * as path from 'node:path'
import FsInterface from './fsInterface.mjs'
import { ListObjectsCommand } from '@aws-sdk/client-s3'

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
      const files = data.Contents
        .map(content => content.Key)
        .concat((data.CommonPrefixes || []).map(content => content.Prefix))
        .map(item => item.startsWith('/') ? item.slice(1) : item)
      result = [...result, ...files]
      marker = data.NextMarker
      isTruncated = data.IsTruncated
    } while (isTruncated === true)

    console.log(result)
    return result
  };

  async _fetchDirData (name, marker) {
    const command = new ListObjectsCommand({
      Bucket: this.bucket,
      Prefix: path.join(this.basePath, name),
      Marker: marker
    })

    return this.client.send(command)
  }

  // realpath() {}
  // rmdir() {}
  // writeFile() {}
  // appendFile() {}
  // createReadStream() {}
  // createWriteStream() {}
  // unlink() {}
  // exists() {}
  // stat() {}
  // lstat() {}
}
