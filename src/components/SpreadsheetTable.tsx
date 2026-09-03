import {
  createColumnHelper,
  useTable,
  type Column,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  columnCount,
  estimateColumnWidths,
  uniqueHeaders,
} from '../lib/columns'
import { sheetTableFeatures } from '../lib/table-features'
import type { CsvMeta, Delimiter, EncodingName } from '../types'
import { ColumnPicker } from './ColumnPicker'
import { CsvOptions } from './CsvOptions'
import { useDebounced } from '../hooks/useDebounced'

const ROW_HEIGHT = 28
const HEADER_HEIGHT = 54
const EMPTY_DATA: string[][] = []
const helper = createColumnHelper<typeof sheetTableFeatures, string[]>()

interface SpreadsheetTableProps {
  rows: string[][]
  firstRowIsHeader: boolean
  onToggleHeader: () => void
  csvMeta?: CsvMeta
  csvBusy?: boolean
  onCsvChange?: (next: { encoding: EncodingName; delimiter: Delimiter }) => void
  onVisibleCount: (visible: number, total: number, cols: number) => void
}

export function SpreadsheetTable({
  rows,
  firstRowIsHeader,
  onToggleHeader,
  csvMeta,
  csvBusy,
  onCsvChange,
  onVisibleCount,
}: SpreadsheetTableProps) {
  const colCount = columnCount(rows)
  const headers = useMemo(
    () => uniqueHeaders(rows[0], colCount, firstRowIsHeader),
    [rows, colCount, firstRowIsHeader],
  )
  const data = useMemo(() => {
    if (rows.length === 0) return EMPTY_DATA
    if (firstRowIsHeader) return rows.length === 1 ? EMPTY_DATA : rows.slice(1)
    return rows
  }, [rows, firstRowIsHeader])

  const widths = useMemo(
    () => estimateColumnWidths(headers, data),
    [headers, data],
  )

  const columns = useMemo(
    () =>
      helper.columns([
        helper.display({
          id: '_n',
          header: '#',
          size: 56,
          minSize: 48,
          maxSize: 100,
          enableSorting: false,
          enableColumnFilter: false,
          enableGlobalFilter: false,
          enableHiding: false,
          cell: (info) =>
            firstRowIsHeader ? info.row.index + 2 : info.row.index + 1,
        }),
        ...headers.map((name, index) =>
          helper.accessor((row) => row[index] ?? '', {
            id: `c${index}`,
            header: name,
            size: widths[index] ?? 140,
            minSize: 64,
            maxSize: 720,
            filterFn: 'includesString',
            sortFn: 'alphanumeric',
            cell: (info) => info.getValue(),
          }),
        ),
      ]),
    [headers, widths, firstRowIsHeader],
  )

  const table = useTable({
    features: sheetTableFeatures,
    columns,
    data,
    defaultColumn: { minSize: 64, maxSize: 720 },
    columnResizeMode: 'onChange',
    enableSortingRemoval: true,
    globalFilterFn: 'includesString',
    getColumnCanGlobalFilter: (column) => column.id !== '_n',
  })

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search, 200)
  const tableRef = useRef(table)
  tableRef.current = table
  useEffect(() => {
    tableRef.current.setGlobalFilter(debouncedSearch)
  }, [debouncedSearch])

  const rowModel = table.getRowModel()
  const tableRows = rowModel.rows

  useEffect(() => {
    onVisibleCount(tableRows.length, data.length, headers.length)
  }, [tableRows.length, data.length, headers.length, onVisibleCount])

  const scrollRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 16,
    getItemKey: (index) => tableRows[index]?.id ?? index,
  })

  const [expanded, setExpanded] = useState<{
    text: string
    x: number
    y: number
  } | null>(null)

  useEffect(() => {
    if (!expanded) return
    const close = () => setExpanded(null)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('click', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [expanded])

  const totalSize = table.getTotalSize()
  const headerGroups = table.getHeaderGroups()
  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-3 py-2">
        <input
          type="search"
          value={search}
          placeholder="Buscar em todas as colunas"
          className="h-7 w-64 rounded border border-zinc-300 px-2 text-xs"
          onChange={(event) => setSearch(event.target.value)}
        />
        <label className="flex items-center gap-1.5 text-xs text-zinc-700">
          <input
            type="checkbox"
            checked={firstRowIsHeader}
            onChange={onToggleHeader}
          />
          1ª linha é cabeçalho
        </label>
        {csvMeta && onCsvChange ? (
          <CsvOptions meta={csvMeta} disabled={csvBusy} onChange={onCsvChange} />
        ) : null}
        <div className="ml-auto">
          <ColumnPicker table={table} />
        </div>
      </div>

      {colCount === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
          Planilha vazia
        </div>
      ) : (
        <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-auto bg-white">
          <div style={{ width: totalSize, minWidth: '100%' }}>
            {headerGroups.map((group) => (
              <div
                key={group.id}
                className="sticky top-0 z-20 flex border-b border-zinc-300 bg-zinc-100"
                style={{ height: HEADER_HEIGHT, width: totalSize }}
              >
                {group.headers.map((header) => {
                  const sticky = header.column.id === '_n'
                  const sorted = header.column.getIsSorted()
                  return (
                    <div
                      key={header.id}
                      className={`relative flex shrink-0 flex-col border-r border-zinc-200 ${
                        sticky ? 'sticky left-0 z-30 bg-zinc-100' : ''
                      }`}
                      style={{ width: header.getSize() }}
                    >
                      <button
                        type="button"
                        className="flex h-7 items-center gap-1 truncate px-1.5 text-left text-[11px] font-semibold text-zinc-700 hover:bg-zinc-200/80"
                        disabled={!header.column.getCanSort()}
                        onClick={header.column.getToggleSortingHandler()}
                        title={String(header.column.columnDef.header ?? '')}
                      >
                        <span className="truncate">
                          {typeof header.column.columnDef.header === 'string'
                            ? header.column.columnDef.header
                            : header.column.id === '_n'
                              ? '#'
                              : header.column.id}
                        </span>
                        {header.column.getCanSort() ? (
                          <span className="shrink-0 text-[10px] text-zinc-400">
                            {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : '↕'}
                          </span>
                        ) : null}
                      </button>
                      {header.column.getCanFilter() ? (
                        <HeaderFilter column={header.column} />
                      ) : (
                        <div className="h-[22px]" />
                      )}
                      {header.column.getCanResize() ? (
                        <div
                          className={`absolute top-0 right-0 z-40 h-full w-1 cursor-col-resize hover:bg-zinc-500 ${
                            header.column.getIsResizing() ? 'bg-zinc-700' : ''
                          }`}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                        />
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ))}

            <div
              style={{
                height: virtualizer.getTotalSize(),
                position: 'relative',
                width: totalSize,
              }}
            >
              {virtualItems.map((item) => {
                const row = tableRows[item.index]
                const zebra = item.index % 2 === 1
                return (
                  <div
                    key={row.id}
                    className={`absolute top-0 left-0 flex ${
                      zebra ? 'bg-zinc-50' : 'bg-white'
                    } hover:bg-amber-50`}
                    style={{
                      height: ROW_HEIGHT,
                      width: totalSize,
                      transform: `translateY(${item.start}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const sticky = cell.column.id === '_n'
                      const value = sticky
                        ? String(firstRowIsHeader ? row.index + 2 : row.index + 1)
                        : String(cell.getValue() ?? '')
                      const long = value.length > 24 || value.includes('\n')
                      const preview = value.replace(/\r?\n/g, '↵')
                      return (
                        <div
                          key={cell.id}
                          className={`shrink-0 overflow-hidden border-r border-b border-zinc-100 px-1.5 text-[12px] leading-[28px] whitespace-nowrap ${
                            sticky
                              ? `sticky left-0 z-10 text-right text-[11px] text-zinc-400 ${
                                  zebra ? 'bg-zinc-50' : 'bg-white'
                                }`
                              : 'text-zinc-800'
                          }`}
                          style={{ width: cell.column.getSize() }}
                          title={value}
                          onClick={(event) => {
                            if (!long && value.length < 40) return
                            event.stopPropagation()
                            setExpanded({
                              text: value,
                              x: event.clientX,
                              y: event.clientY,
                            })
                          }}
                        >
                          <span className="block overflow-hidden text-ellipsis">
                            {preview}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {expanded ? (
        <div
          className="fixed z-50 max-h-72 max-w-lg overflow-auto rounded border border-zinc-300 bg-white p-3 text-xs shadow-xl"
          style={{
            left: Math.min(expanded.x, window.innerWidth - 360),
            top: Math.min(expanded.y + 8, window.innerHeight - 200),
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <pre className="font-sans break-words whitespace-pre-wrap text-zinc-800">
            {expanded.text}
          </pre>
        </div>
      ) : null}
    </div>
  )
}

function HeaderFilter({
  column,
}: {
  column: Column<typeof sheetTableFeatures, string[], unknown>
}) {
  const initial = (column.getFilterValue() as string | undefined) ?? ''
  const [value, setValue] = useState(initial)
  const debounced = useDebounced(value, 200)

  useEffect(() => {
    column.setFilterValue(debounced === '' ? undefined : debounced)
  }, [column, debounced])

  return (
    <input
      value={value}
      placeholder="Filtrar"
      className="mx-1 mb-1 h-[22px] rounded border border-zinc-300 bg-white px-1 text-[11px]"
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => setValue(event.target.value)}
    />
  )
}
