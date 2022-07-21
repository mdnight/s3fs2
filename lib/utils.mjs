'use strict'

export const convertToBuffer = (data) => {
  if (data instanceof Buffer) {
    return data
  }
  return Buffer.from(data)
}
