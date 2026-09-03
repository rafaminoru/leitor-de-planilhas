import * as XLSX from 'xlsx'
import { normalizeRows } from '../columns'

type ProgressFn = (progress: number, message?: string) => void

export function parseXlsx(buffer: ArrayBuffer, onProgress: ProgressFn) {
  onProgress(0.1, 'Abrindo pasta de trabalho')
  const data = new Uint8Array(buffer)
  if (!looksLikeExcel(data)) {
    throw new Error('Arquivo Excel ilegível ou corrompido.')
  }
  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(data, {
      type: 'array',
      cellDates: true,
      dense: true,
    })
  } catch {
    throw new Error('Arquivo Excel ilegível ou corrompido.')
  }

  const names = workbook.SheetNames
  if (!names || names.length === 0) {
    throw new Error('A pasta de trabalho não contém abas.')
  }

  const sheets: Array<{ name: string; rows: string[][] }> = []
  for (let i = 0; i < names.length; i++) {
    const name = names[i]
    onProgress(0.2 + ((i + 1) / names.length) * 0.75, `Lendo aba ${name}`)
    const sheet = workbook.Sheets[name]
    if (!sheet) {
      sheets.push({ name, rows: [] })
      continue
    }
    const raw = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null)[]>(
      sheet,
      {
        header: 1,
        raw: false,
        defval: '',
        blankrows: false,
      },
    )
    sheets.push({ name, rows: normalizeRows(raw) })
  }

  return { sheets }
}

function looksLikeExcel(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false
  const zip = bytes[0] === 0x50 && bytes[1] === 0x4b
  const ole =
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0
  return zip || ole
}
