import { useState, type ReactNode } from 'react'
import { formatBytes } from '../lib/format'
import type { LoadedFile } from '../types'
import { DropZone } from './DropZone'

interface SidebarProps {
  files: LoadedFile[]
  selectedFileId: string | null
  onSelectFile: (fileId: string) => void
  onRemove: (fileId: string) => void
  onOpen: (files: FileList) => void
}

export function Sidebar({
  files,
  selectedFileId,
  onSelectFile,
  onRemove,
  onOpen,
}: SidebarProps) {
  const csvFiles = files.filter((file) => file.kind === 'csv' || file.kind === 'tsv')
  const excelFiles = files.filter((file) => file.kind === 'xlsx' || file.kind === 'xls')

  return (
    <aside className="flex w-[232px] shrink-0 flex-col bg-[#141414] text-zinc-300">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className="text-[11px] font-medium tracking-wide text-zinc-500">
          Planilhas
        </span>
        <div className="ml-auto">
          <DropZone compact onOpen={onOpen} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto pb-3">
        {files.length === 0 ? (
          <p className="px-3 py-6 text-[12px] text-zinc-600">Nenhuma planilha aberta.</p>
        ) : (
          <>
            <WarpGroup title="CSV" count={csvFiles.length}>
              {csvFiles.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  selected={file.id === selectedFileId}
                  onSelect={() => onSelectFile(file.id)}
                  onRemove={() => onRemove(file.id)}
                />
              ))}
            </WarpGroup>
            <WarpGroup title="Excel" count={excelFiles.length}>
              {excelFiles.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  selected={file.id === selectedFileId}
                  onSelect={() => onSelectFile(file.id)}
                  onRemove={() => onRemove(file.id)}
                />
              ))}
            </WarpGroup>
          </>
        )}
      </div>
    </aside>
  )
}

function WarpGroup({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: ReactNode
}) {
  const [open, setOpen] = useState(true)
  if (count === 0) return null

  return (
    <section className="mt-1">
      <button
        type="button"
        className="flex w-full items-center gap-1.5 px-3 py-1 text-left text-[11px] text-zinc-500 hover:text-zinc-300"
        onClick={() => setOpen((value) => !value)}
      >
        <Chevron open={open} />
        <span className="font-medium">{title}</span>
        <span className="ml-auto tabular-nums text-zinc-600">
          {count} {count === 1 ? 'arquivo' : 'arquivos'}
        </span>
      </button>
      {open ? <div className="mt-0.5 flex flex-col gap-0.5 px-1.5">{children}</div> : null}
    </section>
  )
}

function FileItem({
  file,
  selected,
  onSelect,
  onRemove,
}: {
  file: LoadedFile
  selected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const sheetCount = file.sheets.length
  const subtitle = [
    file.kind.toUpperCase(),
    formatBytes(file.size),
    file.status === 'parsing' ? 'lendo…' : null,
    file.status === 'error' ? 'erro' : null,
    file.status === 'ready' && sheetCount > 1 ? `${sheetCount} abas` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="group relative">
      <button
        type="button"
        title={file.name}
        onClick={onSelect}
        className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left ${
          selected ? 'bg-[#2c2c2c] text-zinc-50' : 'text-zinc-300 hover:bg-white/5'
        }`}
      >
        <KindIcon kind={file.kind} error={file.status === 'error'} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] leading-5 font-medium">
            {displayName(file.name)}
          </span>
          <span className="block truncate text-[11px] leading-4 text-zinc-500">
            {subtitle}
          </span>
        </span>
      </button>
      <button
        type="button"
        title="Fechar planilha"
        onClick={(event) => {
          event.stopPropagation()
          onRemove()
        }}
        className="absolute top-1.5 right-1.5 hidden h-5 w-5 items-center justify-center rounded text-zinc-500 hover:bg-white/10 hover:text-zinc-200 group-hover:flex"
      >
        ×
      </button>
      {file.status === 'parsing' ? (
        <div className="mx-2 mb-1 h-0.5 overflow-hidden rounded bg-zinc-800">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${Math.round(file.progress * 100)}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}

function displayName(name: string): string {
  const slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'))
  return slash >= 0 ? name.slice(slash + 1) : name
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3 w-3 shrink-0 text-zinc-600 transition-transform ${open ? 'rotate-90' : ''}`}
      aria-hidden="true"
    >
      <path fill="currentColor" d="M4.2 2.2 8.5 6 4.2 9.8 3.4 9l3.5-3L3.4 3z" />
    </svg>
  )
}

function KindIcon({ kind, error }: { kind: LoadedFile['kind']; error?: boolean }) {
  const tone = error
    ? 'bg-red-500/20 text-red-400'
    : kind === 'xlsx' || kind === 'xls'
      ? 'bg-emerald-500/20 text-emerald-400'
      : 'bg-sky-500/20 text-sky-400'

  return (
    <span
      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${tone}`}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
        <path
          fill="currentColor"
          d="M3 2.5A1.5 1.5 0 0 1 4.5 1h5.2L13 4.3V13.5A1.5 1.5 0 0 1 11.5 15h-7A1.5 1.5 0 0 1 3 13.5zM9 2v3h3"
        />
        <path
          fill="currentColor"
          d="M5 8h6v1H5zm0 2.5h6v1H5z"
          opacity="0.85"
        />
      </svg>
    </span>
  )
}
