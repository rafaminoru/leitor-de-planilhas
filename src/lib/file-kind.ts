import type { FileKind } from '../types'

const KIND_BY_EXT: Record<string, FileKind> = {
  csv: 'csv',
  tsv: 'tsv',
  xlsx: 'xlsx',
  xls: 'xls',
}

export function fileKindFromName(name: string): FileKind | null {
  const dot = name.lastIndexOf('.')
  if (dot < 0) return null
  return KIND_BY_EXT[name.slice(dot + 1).toLowerCase()] ?? null
}

export function isSpreadsheetFile(name: string): boolean {
  return fileKindFromName(name) !== null
}

export function sheetKey(fileId: string, sheetId: string): string {
  return `${fileId}::${sheetId}`
}
