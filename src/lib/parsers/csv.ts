import Papa from 'papaparse'
import type { CsvMeta, Delimiter, EncodingName, FileKind } from '../../types'
import { DELIMITERS } from '../../types'
import { normalizeRows } from '../columns'
import { decodeBuffer, detectEncoding } from '../encoding'

export interface CsvParseOptions {
  encoding?: EncodingName
  delimiter?: Delimiter
}

export interface CsvParseOutput {
  sheets: Array<{ name: string; rows: string[][] }>
  csvMeta: CsvMeta
}

type ProgressFn = (progress: number, message?: string) => void

export function parseCsv(
  buffer: ArrayBuffer,
  fileName: string,
  kind: FileKind,
  options: CsvParseOptions | undefined,
  onProgress: ProgressFn,
): CsvParseOutput {
  onProgress(0.05, 'Detectando encoding')
  const detectedEncoding = detectEncoding(buffer)
  const encoding = options?.encoding ?? detectedEncoding
  const text = decodeBuffer(buffer, encoding)

  if (text.trim().length === 0) {
    throw new Error('Arquivo vazio.')
  }

  onProgress(0.12, 'Detectando delimitador')
  const detectedDelimiter: Delimiter =
    kind === 'tsv' ? '\t' : options?.delimiter ?? detectDelimiter(text)
  const delimiter = options?.delimiter ?? detectedDelimiter

  onProgress(0.18, 'Lendo CSV')
  const rows = parseAllRows(text, delimiter, onProgress)
  const sheetName = baseName(fileName)

  return {
    sheets: [{ name: sheetName, rows: normalizeRows(rows) }],
    csvMeta: {
      delimiter,
      encoding,
      detectedDelimiter,
      detectedEncoding,
    },
  }
}

function detectDelimiter(text: string): Delimiter {
  const sample = text.length > 48_000 ? text.slice(0, 48_000) : text
  const guessed = Papa.parse(sample, {
    preview: 30,
    delimitersToGuess: [',', ';', '\t', '|'],
  }).meta.delimiter

  if (isDelimiter(guessed)) return guessed
  return countBasedDelimiter(sample)
}

function countBasedDelimiter(sample: string): Delimiter {
  const lines = sample.split(/\r?\n/).slice(0, 20)
  let best: Delimiter = ','
  let bestScore = -1
  for (const candidate of DELIMITERS) {
    const counts = lines
      .filter((line) => line.length > 0)
      .map((line) => countUnquoted(line, candidate))
    if (counts.length === 0) continue
    const first = counts[0]
    const consistent = counts.every((n) => n === first)
    const score = (consistent ? 1000 : 0) + first
    if (score > bestScore) {
      bestScore = score
      best = candidate
    }
  }
  return best
}

function countUnquoted(line: string, delimiter: string): number {
  let count = 0
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === delimiter && !inQuotes) {
      count++
    }
  }
  return count
}

function parseAllRows(
  text: string,
  delimiter: Delimiter,
  onProgress: ProgressFn,
): unknown[][] {
  onProgress(0.45, 'Analisando linhas')
  const parsed = Papa.parse<unknown[]>(text, {
    delimiter,
    header: false,
    skipEmptyLines: true,
    quoteChar: '"',
    escapeChar: '"',
  })

  if (parsed.data.length === 0 && parsed.errors.length > 0) {
    const first = parsed.errors[0]
    throw new Error(first.message || 'CSV ilegível.')
  }

  onProgress(0.95, 'Normalizando')
  return parsed.data
}

function isDelimiter(value: string): value is Delimiter {
  return (DELIMITERS as readonly string[]).includes(value)
}

function baseName(fileName: string): string {
  const slash = Math.max(fileName.lastIndexOf('/'), fileName.lastIndexOf('\\'))
  const base = slash >= 0 ? fileName.slice(slash + 1) : fileName
  const dot = base.lastIndexOf('.')
  return dot > 0 ? base.slice(0, dot) : base
}
