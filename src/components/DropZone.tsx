import { useRef } from 'react'

interface DropZoneProps {
  onOpen: (files: FileList) => void
  compact?: boolean
}

export function DropZone({ onOpen, compact = false }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      className={
        compact
          ? 'flex items-center'
          : 'flex h-full min-h-0 flex-1 items-center justify-center p-8'
      }
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".csv,.tsv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) {
            onOpen(event.target.files)
            event.target.value = ''
          }
        }}
      />
      {compact ? (
        <button
          type="button"
          title="Abrir arquivos"
          className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
          onClick={() => inputRef.current?.click()}
        >
          +
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full max-w-xl cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-zinc-300 bg-white px-8 py-16 text-center hover:border-zinc-500 hover:bg-zinc-50"
        >
          <span className="text-sm font-medium text-zinc-800">
            Arraste CSV / XLSX aqui
          </span>
          <span className="text-xs text-zinc-500">
            ou clique para abrir arquivos · .csv .tsv .xlsx .xls
          </span>
          <span className="rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white">
            Abrir arquivos
          </span>
        </button>
      )}
    </div>
  )
}
