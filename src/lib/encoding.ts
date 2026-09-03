import type { EncodingName } from '../types'

export function detectEncoding(buffer: ArrayBuffer): EncodingName {
  const bytes = new Uint8Array(buffer)
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8'
  }

  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer)
    return 'utf-8'
  } catch {
    return 'windows-1252'
  }
}

export function decodeBuffer(buffer: ArrayBuffer, encoding: EncodingName): string {
  const bytes = new Uint8Array(buffer)
  const skipBom =
    encoding === 'utf-8' &&
    bytes.length >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf
  const view = skipBom ? bytes.subarray(3) : bytes
  return new TextDecoder(encoding).decode(view)
}
