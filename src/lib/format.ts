export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatCount(n: number): string {
  return n.toLocaleString('pt-BR')
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

export function delimiterLabel(delimiter: string): string {
  if (delimiter === '\t') return 'tab'
  if (delimiter === ';') return 'ponto e vírgula (;)'
  if (delimiter === ',') return 'vírgula (,)'
  if (delimiter === '|') return 'pipe (|)'
  return delimiter
}

export function encodingLabel(encoding: string): string {
  if (encoding === 'utf-8') return 'UTF-8'
  if (encoding === 'iso-8859-1') return 'ISO-8859-1'
  if (encoding === 'windows-1252') return 'Windows-1252'
  return encoding
}
