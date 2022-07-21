'use strict'

import * as dotenv from 'dotenv'
import S3Client from './lib/s3-client.mjs'
import S3Fs from './lib/s3-fs.mjs'
import { createReadStream } from 'fs'
import { fromEnv } from '@aws-sdk/credential-providers'
import { env } from 'process'

dotenv.config()

const start = async () => {
  const client = new S3Client(await fromEnv(), env.AWS_REGION, env.S3_BUCKET)
  const s3fs = new S3Fs(client, '')

  const dataStream = await createReadStream('./HUGE_FILE.zip')
  const writeStream = await s3fs.createWriteStream('HUGE_FILE.zip')
  await writeStream.start()
  dataStream.pipe(writeStream)

  await s3fs.rm('HUGE_FILE.zip')
}

start()
