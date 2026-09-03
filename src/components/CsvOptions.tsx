import { delimiterLabel, encodingLabel } from '../lib/format'
import { DELIMITERS, ENCODINGS, type CsvMeta, type Delimiter, type EncodingName } from '../types'

interface CsvOptionsProps {
  meta: CsvMeta
  disabled?: boolean
  onChange: (next: { encoding: EncodingName; delimiter: Delimiter }) => void
}

export function CsvOptions({ meta, disabled, onChange }: CsvOptionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <label className="flex items-center gap-1 text-zinc-600">
        Delimitador
        <select
          className="rounded border border-zinc-300 bg-white px-1.5 py-1 text-zinc-900"
          value={meta.delimiter}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              encoding: meta.encoding,
              delimiter: event.target.value as Delimiter,
            })
          }
        >
          {DELIMITERS.map((item) => (
            <option key={item} value={item}>
              {delimiterLabel(item)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1 text-zinc-600">
        Encoding
        <select
          className="rounded border border-zinc-300 bg-white px-1.5 py-1 text-zinc-900"
          value={meta.encoding}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              encoding: event.target.value as EncodingName,
              delimiter: meta.delimiter,
            })
          }
        >
          {ENCODINGS.map((item) => (
            <option key={item} value={item}>
              {encodingLabel(item)}
            </option>
          ))}
        </select>
      </label>
      <span className="text-[11px] text-zinc-400">
        detectado: {delimiterLabel(meta.detectedDelimiter)} ·{' '}
        {encodingLabel(meta.detectedEncoding)}
      </span>
    </div>
  )
}
