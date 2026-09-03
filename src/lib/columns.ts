const MAX_SAMPLE = 120
const MIN_WIDTH = 72
const MAX_WIDTH = 480
const CHAR_PX = 7.3

export function excelColName(index: number): string {
  let n = index
  let label = ''
  do {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return label
}

export function uniqueHeaders(
  firstRow: string[] | undefined,
  colCount: number,
  firstRowIsHeader: boolean,
): string[] {
  if (!firstRowIsHeader) {
    return Array.from({ length: colCount }, (_, i) => excelColName(i))
  }

  const seen = new Map<string, number>()
  const headers: string[] = []
  for (let i = 0; i < colCount; i++) {
    const raw = (firstRow?.[i] ?? '').trim()
    const base = raw || excelColName(i)
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    headers.push(n === 0 ? base : `${base} (${n + 1})`)
  }
  return headers
}

export function columnCount(rows: string[][]): number {
  let max = 0
  for (const row of rows) {
    if (row.length > max) max = row.length
  }
  return max
}

export function estimateColumnWidths(headers: string[], rows: string[][]): number[] {
  const widths = headers.map((h) => clampWidth(measure(h) + 28))
  const n = Math.min(rows.length, MAX_SAMPLE)
  for (let r = 0; r < n; r++) {
    const row = rows[r]
    for (let c = 0; c < headers.length; c++) {
      const w = measure(row[c] ?? '') + 16
      if (w > widths[c]) widths[c] = clampWidth(w)
    }
  }
  return widths
}

function measure(text: string): number {
  const sample = text.length > 64 ? text.slice(0, 64) : text
  return Math.ceil(sample.length * CHAR_PX)
}

function clampWidth(n: number): number {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(n)))
}

export function normalizeRows(rows: unknown[][]): string[][] {
  let max = 0
  for (const row of rows) {
    if (row && row.length > max) max = row.length
  }
  if (max === 0) return []

  const out: string[][] = new Array(rows.length)
  for (let r = 0; r < rows.length; r++) {
    const src = rows[r] ?? []
    const next = new Array<string>(max)
    for (let c = 0; c < max; c++) {
      const value = src[c]
      next[c] = value == null ? '' : String(value)
    }
    out[r] = next
  }

  if (out.length > 0 && out[out.length - 1].every((cell) => cell === '')) {
    out.pop()
  }
  return out
}
