import { useCallback, useState } from 'react'
import { DropZone } from './components/DropZone'
import { ErrorPanel } from './components/ErrorPanel'
import { SheetTabs } from './components/SheetTabs'
import { Sidebar } from './components/Sidebar'
import { SpreadsheetTable } from './components/SpreadsheetTable'
import { StatusBar } from './components/StatusBar'
import { useWorkbookStore } from './hooks/useWorkbookStore'
import type { Delimiter, EncodingName } from './types'

export default function App() {
  const wb = useWorkbookStore()
  const [stats, setStats] = useState({ visible: 0, total: 0, cols: 0 })

  const onVisibleCount = useCallback((visible: number, total: number, cols: number) => {
    setStats({ visible, total, cols })
  }, [])

  const onCsvChange = useCallback(
    (next: { encoding: EncodingName; delimiter: Delimiter }) => {
      if (!wb.activeFile) return
      wb.reparse(wb.activeFile.id, next)
    },
    [wb],
  )

  const tableKey = wb.activeFile && wb.activeSheet
    ? `${wb.activeFile.id}:${wb.activeSheet.id}:${wb.firstRowIsHeader}`
    : 'empty'

  return (
    <div
      className="relative flex h-dvh flex-col bg-zinc-100 text-zinc-900"
      onDragEnter={wb.onDragEnter}
      onDragOver={wb.onDragOver}
      onDragLeave={wb.onDragLeave}
      onDrop={wb.onDrop}
    >
      {wb.dragActive ? (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-zinc-900/40">
          <div className="rounded-lg border-2 border-dashed border-white px-8 py-6 text-sm font-medium text-white">
            Solte para abrir
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <Sidebar
          files={wb.files}
          selectedFileId={wb.selection?.fileId ?? null}
          onSelectFile={(fileId) => {
            const file = wb.files.find((item) => item.id === fileId)
            const sheetId = file?.sheets[0]?.id ?? 's0'
            wb.selectSheet(fileId, sheetId)
          }}
          onRemove={wb.removeFile}
          onOpen={wb.addFiles}
        />
        <main className="flex min-w-0 flex-1 flex-col">
          {wb.ignoredCount > 0 ? (
            <div className="border-b border-amber-200 bg-amber-50 px-3 py-1 text-[11px] text-amber-900">
              {wb.ignoredCount} arquivo(s) ignorado(s) — use .csv, .tsv, .xlsx ou .xls
            </div>
          ) : null}

          {!wb.activeFile ? (
            <DropZone onOpen={wb.addFiles} />
          ) : wb.activeFile.status === 'error' ? (
            <ErrorPanel
              fileName={wb.activeFile.name}
              message={wb.activeFile.error ?? 'Falha desconhecida'}
            />
          ) : wb.activeFile.status === 'parsing' && !wb.activeSheet ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <p className="text-sm text-zinc-600">
                Lendo {wb.activeFile.name}
                {wb.activeFile.progressMessage ? ` — ${wb.activeFile.progressMessage}` : ''}
              </p>
              <div className="h-2 w-64 overflow-hidden rounded bg-zinc-200">
                <div
                  className="h-full bg-emerald-600 transition-[width]"
                  style={{ width: `${Math.round(wb.activeFile.progress * 100)}%` }}
                />
              </div>
            </div>
          ) : wb.activeSheet ? (
            <SpreadsheetTable
              key={tableKey}
              rows={wb.activeSheet.rows}
              firstRowIsHeader={wb.firstRowIsHeader}
              onToggleHeader={() => {
                if (wb.activeFile && wb.activeSheet) {
                  wb.toggleFirstRowIsHeader(wb.activeFile.id, wb.activeSheet.id)
                }
              }}
              csvMeta={wb.activeFile.csvMeta}
              csvBusy={wb.activeFile.status === 'parsing'}
              onCsvChange={wb.activeFile.csvMeta ? onCsvChange : undefined}
              onVisibleCount={onVisibleCount}
            />
          ) : (
            <DropZone onOpen={wb.addFiles} />
          )}

          <footer className="flex h-9 shrink-0 items-stretch border-t border-[#dadce0] bg-[#f8f9fa]">
            {wb.activeFile && wb.activeFile.status !== 'error' ? (
              <SheetTabs
                sheets={wb.activeFile.sheets}
                selectedSheetId={wb.selection?.sheetId ?? null}
                onSelect={(sheetId) => {
                  if (wb.activeFile) wb.selectSheet(wb.activeFile.id, sheetId)
                }}
              />
            ) : (
              <div className="min-w-0 flex-1" />
            )}
            <StatusBar
              file={wb.activeFile}
              visibleRows={stats.visible}
              totalRows={stats.total}
              totalCols={stats.cols}
            />
          </footer>
        </main>
      </div>
    </div>
  )
}
