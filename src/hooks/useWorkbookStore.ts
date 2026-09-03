import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { fileKindFromName, isSpreadsheetFile, sheetKey } from '../lib/file-kind'
import type {
  Delimiter,
  EncodingName,
  LoadedFile,
  Selection,
  SheetData,
  WorkerRequest,
  WorkerResponse,
} from '../types'

export function useWorkbookStore() {
  const [files, setFiles] = useState<LoadedFile[]>([])
  const [selection, setSelection] = useState<Selection | null>(null)
  const [firstRowIsHeader, setFirstRowIsHeader] = useState<Record<string, boolean>>(
    {},
  )
  const [dragActive, setDragActive] = useState(false)
  const [ignoredCount, setIgnoredCount] = useState(0)

  const buffersRef = useRef(new Map<string, ArrayBuffer>())
  const workerRef = useRef<Worker | null>(null)
  const dragDepthRef = useRef(0)

  useEffect(() => {
    const worker = new Worker(new URL('../workers/parse.worker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data
      if (!msg) return

      if (msg.type === 'progress') {
        setFiles((prev) =>
          prev.map((file) =>
            file.id === msg.id
              ? {
                  ...file,
                  progress: msg.progress,
                  progressMessage: msg.message,
                }
              : file,
          ),
        )
        return
      }

      if (msg.type === 'error') {
        setFiles((prev) =>
          prev.map((file) =>
            file.id === msg.id
              ? {
                  ...file,
                  status: 'error',
                  progress: 1,
                  error: msg.message,
                }
              : file,
          ),
        )
        return
      }

      const sheets: SheetData[] = msg.payload.sheets.map((sheet, index) => ({
        id: `s${index}`,
        name: sheet.name,
        rows: sheet.rows,
      }))

      setFiles((prev) =>
        prev.map((file) =>
          file.id === msg.id
            ? {
                ...file,
                status: 'ready',
                progress: 1,
                error: undefined,
                parseTimeMs: msg.payload.parseTimeMs,
                csvMeta: msg.payload.csvMeta,
                sheets,
              }
            : file,
        ),
      )

      setSelection((current) => {
        if (current) return current
        if (sheets.length === 0) return current
        return { fileId: msg.id, sheetId: sheets[0].id }
      })
    }

    worker.onerror = (event) => {
      console.error(event)
    }

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  const postParse = useCallback(
    (
      id: string,
      name: string,
      buffer: ArrayBuffer,
      options?: { encoding?: EncodingName; delimiter?: Delimiter },
    ) => {
      const worker = workerRef.current
      if (!worker) return
      const request: WorkerRequest = { type: 'parse', id, name, buffer, options }
      worker.postMessage(request)
    },
    [],
  )

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming)
      const supported = list.filter((file) => isSpreadsheetFile(file.name))
      const ignored = list.length - supported.length
      if (ignored > 0) setIgnoredCount(ignored)
      else setIgnoredCount(0)
      if (supported.length === 0) return

      void Promise.all(
        supported.map(async (file) => {
          const id = crypto.randomUUID()
          const kind = fileKindFromName(file.name)
          if (!kind) return
          const buffer = await file.arrayBuffer()
          buffersRef.current.set(id, buffer)
          const loaded: LoadedFile = {
            id,
            name: file.name,
            kind,
            size: file.size,
            status: 'parsing',
            progress: 0.02,
            progressMessage: 'Enviando para o worker',
            sheets: [],
          }
          setFiles((prev) => [...prev, loaded])
          postParse(id, file.name, buffer)
        }),
      )
    },
    [postParse],
  )

  const removeFile = useCallback((id: string) => {
    buffersRef.current.delete(id)
    setFiles((prev) => prev.filter((file) => file.id !== id))
    setFirstRowIsHeader((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (key.startsWith(`${id}::`)) delete next[key]
      }
      return next
    })
    setSelection((current) => {
      if (!current || current.fileId !== id) return current
      return null
    })
  }, [])

  const reparse = useCallback(
    (id: string, options: { encoding?: EncodingName; delimiter?: Delimiter }) => {
      const buffer = buffersRef.current.get(id)
      const file = files.find((item) => item.id === id)
      if (!buffer || !file) return
      setFiles((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'parsing',
                progress: 0.02,
                progressMessage: 'Reprocessando',
                error: undefined,
              }
            : item,
        ),
      )
      postParse(id, file.name, buffer, options)
    },
    [files, postParse],
  )

  const selectSheet = useCallback((fileId: string, sheetId: string) => {
    setSelection({ fileId, sheetId })
  }, [])

  const toggleFirstRowIsHeader = useCallback((fileId: string, sheetId: string) => {
    const key = sheetKey(fileId, sheetId)
    setFirstRowIsHeader((prev) => ({
      ...prev,
      [key]: !(prev[key] ?? true),
    }))
  }, [])

  const onDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault()
    dragDepthRef.current += 1
    setDragActive(true)
  }, [])

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setDragActive(false)
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      dragDepthRef.current = 0
      setDragActive(false)
      if (event.dataTransfer.files?.length) {
        addFiles(event.dataTransfer.files)
      }
    },
    [addFiles],
  )

  const resolvedSelection = useMemo(() => {
    if (selection) {
      const file = files.find((item) => item.id === selection.fileId)
      if (file) {
        if (file.sheets.some((sheet) => sheet.id === selection.sheetId)) {
          return selection
        }
        if (file.sheets[0]) {
          return { fileId: file.id, sheetId: file.sheets[0].id }
        }
        return { fileId: file.id, sheetId: 's0' }
      }
    }
    const withSheets = files.find((file) => file.sheets.length > 0)
    if (withSheets) {
      return { fileId: withSheets.id, sheetId: withSheets.sheets[0].id }
    }
    if (files[0]) {
      return { fileId: files[0].id, sheetId: files[0].sheets[0]?.id ?? 's0' }
    }
    return null
  }, [files, selection])

  const activeFile = useMemo(
    () => files.find((file) => file.id === resolvedSelection?.fileId) ?? null,
    [files, resolvedSelection],
  )

  const activeSheet = useMemo(() => {
    if (!activeFile || !resolvedSelection) return null
    return (
      activeFile.sheets.find((sheet) => sheet.id === resolvedSelection.sheetId) ??
      null
    )
  }, [activeFile, resolvedSelection])

  const headerIsHeader = activeFile && activeSheet
    ? (firstRowIsHeader[sheetKey(activeFile.id, activeSheet.id)] ?? true)
    : true

  return {
    files,
    selection: resolvedSelection,
    activeFile,
    activeSheet,
    firstRowIsHeader: headerIsHeader,
    dragActive,
    ignoredCount,
    addFiles,
    removeFile,
    reparse,
    selectSheet,
    toggleFirstRowIsHeader,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  }
}
