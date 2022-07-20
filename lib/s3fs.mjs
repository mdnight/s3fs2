'use strict'

import * as nodePath from 'node:path'
import FsInterface from './fsInterface.mjs'
import { S3WriteStream } from './s3WriteStream.mjs'

export const Status = {
  Ok: 'ok',
  Fail: 'fail',
  NotFound: 'notFound'
}

export default class S3Fs extends FsInterface {
  constructor (s3Client, basePath) {
    super()
    this.client = s3Client
    this.basePath = basePath
  }

  /**
   * Asynchronously creates a directory.
   * @param path - relative path to the directory
   * @return {string} - ok fail
   * @type {(path: string) => string}
   */
  async mkdir (path) {
    await this.client.uploadNormally(
      nodePath.join(path, '/'),
      ''
    )
    return Status.Ok
  }

  async readdir (path) {
    let marker
    let result = []
    let isTruncated = true

    do {
      const data = await this.client.listObjects(
        nodePath.join(this.basePath, path),
        marker
      )
      if (!data.Contents) {
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

  // realpath() {}

  async rmdir (path) {
    const paths = await this.readdir(path)
    const statusCode = await this.client.deleteObjects(paths)

    return statusCode === 200 ? Status.Ok : Status.Fail
  }

  async rm (path) {
    const statusCode = await this.client.deleteObjects([path])

    return statusCode === 200 ? Status.Ok : Status.Fail
  }

  async writeFile (file, data) {
    await this.client.uploadNormally(file, data)
    return Status.Ok
  }
  // appendFile() {}
  // createReadStream() {}

  // /**
  //  * @type {(path: string, options: object) => Writable}
  //  */
  createWriteStream (path, options) {
    return new S3WriteStream(this.client, path, options)
  }

  // unlink() {}
  // stat() {}
  // lstat() {}
}
