import { useEffect, useRef, useState } from 'react'
import type { Table } from '@tanstack/react-table'
import { sheetTableFeatures } from '../lib/table-features'

interface ColumnPickerProps {
  table: Table<typeof sheetTableFeatures, string[]>
}

export function ColumnPicker({ table }: ColumnPickerProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const columns = table.getAllLeafColumns().filter((column) => column.id !== '_n')

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs hover:bg-zinc-50"
        onClick={() => setOpen((value) => !value)}
      >
        Colunas
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1 max-h-72 w-56 overflow-auto rounded border border-zinc-200 bg-white py-1 shadow-lg">
          {columns.map((column) => (
            <label
              key={column.id}
              className="flex cursor-pointer items-center gap-2 px-2 py-1 text-xs hover:bg-zinc-50"
            >
              <input
                type="checkbox"
                checked={column.getIsVisible()}
                disabled={!column.getCanHide()}
                onChange={(event) => column.toggleVisibility(event.target.checked)}
              />
              <span className="truncate">
                {typeof column.columnDef.header === 'string'
                  ? column.columnDef.header
                  : column.id}
              </span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  )
}
