import { fileKindFromName } from '../lib/file-kind'
import { parseCsv } from '../lib/parsers/csv'
import { parseXlsx } from '../lib/parsers/xlsx'
import type { WorkerRequest, WorkerResponse } from '../types'

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data
  if (!msg || msg.type !== 'parse') return

  const { id, name, buffer, options } = msg
  const started = performance.now()

  try {
    const kind = fileKindFromName(name)
    if (!kind) {
      post({ type: 'error', id, message: `Formato não suportado: ${name}` })
      return
    }

    const onProgress = (progress: number, message?: string) => {
      post({ type: 'progress', id, progress, message })
    }

    if (kind === 'csv' || kind === 'tsv') {
      const result = parseCsv(buffer, name, kind, options, onProgress)
      post({
        type: 'done',
        id,
        payload: {
          kind,
          sheets: result.sheets,
          csvMeta: result.csvMeta,
          parseTimeMs: performance.now() - started,
        },
      })
      return
    }

    const result = parseXlsx(buffer, onProgress)
    post({
      type: 'done',
      id,
      payload: {
        kind,
        sheets: result.sheets,
        parseTimeMs: performance.now() - started,
      },
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Falha ao ler o arquivo.'
    post({ type: 'error', id, message })
  }
}

function post(response: WorkerResponse) {
  self.postMessage(response)
}
