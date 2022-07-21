'use strict'

export const convertToBuffer = (chunk) => {
  if (chunk instanceof Buffer) {
    return chunk
  }
  return Buffer.from(chunk)
}
