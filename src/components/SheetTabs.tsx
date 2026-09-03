import type { SheetData } from '../types'

interface SheetTabsProps {
  sheets: SheetData[]
  selectedSheetId: string | null
  onSelect: (sheetId: string) => void
}

export function SheetTabs({ sheets, selectedSheetId, onSelect }: SheetTabsProps) {
  if (sheets.length === 0) return null

  return (
    <div className="flex min-w-0 flex-1 items-end overflow-x-auto px-1">
      {sheets.map((sheet) => {
        const selected = sheet.id === selectedSheetId
        return (
          <button
            key={sheet.id}
            type="button"
            title={sheet.name}
            onClick={() => onSelect(sheet.id)}
            className={`relative max-w-[200px] shrink-0 truncate px-4 text-[13px] ${
              selected
                ? 'z-10 h-8 rounded-t-md border border-b-0 border-[#dadce0] bg-white font-medium text-[#202124]'
                : 'h-8 text-[#5f6368] hover:bg-black/[0.04]'
            }`}
          >
            {sheet.name}
            {selected ? (
              <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#188038]" />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
