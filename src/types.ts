export const ENCODINGS = ['utf-8', 'iso-8859-1', 'windows-1252'] as const
export type EncodingName = (typeof ENCODINGS)[number]

export const DELIMITERS = [',', ';', '\t', '|'] as const
export type Delimiter = (typeof DELIMITERS)[number]

export type FileKind = 'csv' | 'tsv' | 'xlsx' | 'xls'

export interface CsvMeta {
  delimiter: Delimiter
  encoding: EncodingName
  detectedDelimiter: Delimiter
  detectedEncoding: EncodingName
}

export interface SheetData {
  id: string
  name: string
  rows: string[][]
}

export type FileStatus = 'parsing' | 'ready' | 'error'

export interface LoadedFile {
  id: string
  name: string
  kind: FileKind
  size: number
  status: FileStatus
  progress: number
  progressMessage?: string
  error?: string
  parseTimeMs?: number
  csvMeta?: CsvMeta
  sheets: SheetData[]
}

export interface Selection {
  fileId: string
  sheetId: string
}

export interface ParseSuccess {
  kind: FileKind
  sheets: Array<{ name: string; rows: string[][] }>
  csvMeta?: CsvMeta
  parseTimeMs: number
}

export type WorkerRequest = {
  type: 'parse'
  id: string
  name: string
  buffer: ArrayBuffer
  options?: {
    encoding?: EncodingName
    delimiter?: Delimiter
  }
}

export type WorkerResponse =
  | { type: 'progress'; id: string; progress: number; message?: string }
  | { type: 'done'; id: string; payload: ParseSuccess }
  | { type: 'error'; id: string; message: string }
