import { formatCount, formatDuration } from '../lib/format'
import type { LoadedFile } from '../types'

interface StatusBarProps {
  file: LoadedFile | null
  visibleRows: number
  totalRows: number
  totalCols: number
}

export function StatusBar({
  file,
  visibleRows,
  totalRows,
  totalCols,
}: StatusBarProps) {
  if (!file) {
    return (
      <div className="flex h-9 shrink-0 items-center px-3 text-[11px] text-[#80868b]">
        Nenhum arquivo aberto
      </div>
    )
  }

  const parts = [
    file.status === 'parsing'
      ? `${Math.round(file.progress * 100)}% ${file.progressMessage ?? ''}`
      : null,
    file.status === 'error' ? file.error : null,
    file.status === 'ready'
      ? `${formatCount(totalRows)} linhas × ${formatCount(totalCols)} colunas`
      : null,
    file.status === 'ready' && visibleRows !== totalRows
      ? `${formatCount(visibleRows)} visíveis`
      : null,
    file.parseTimeMs != null ? formatDuration(file.parseTimeMs) : null,
  ].filter(Boolean)

  return (
    <div className="flex h-9 shrink-0 items-center gap-2 px-3 text-[11px] text-[#5f6368]">
      {parts.map((part, index) => (
        <span key={`${index}-${part}`} className="flex items-center gap-2 whitespace-nowrap">
          {index > 0 ? <span className="text-[#dadce0]">·</span> : null}
          <span>{part}</span>
        </span>
      ))}
    </div>
  )
}
