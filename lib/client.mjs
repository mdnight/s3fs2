'use strict'

import { env } from 'process'
import { S3Client } from '@aws-sdk/client-s3'
import { fromEnv } from '@aws-sdk/credential-providers'

const initS3Client = async () => {
  const region = env.AWS_REGION
  if (!region) {
    throw new Error('AWS_REGION is not defined in env vars.')
  }

  return new S3Client({
    region,
    credentials: fromEnv()
  })
}

export {
  initS3Client
}
