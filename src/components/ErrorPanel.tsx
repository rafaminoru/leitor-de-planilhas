interface ErrorPanelProps {
  fileName: string
  message: string
}

export function ErrorPanel({ fileName, message }: ErrorPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-8">
      <div className="max-w-lg rounded border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900">
        <p className="font-medium">Não foi possível ler {fileName}</p>
        <p className="mt-1 text-red-800">{message}</p>
        <p className="mt-3 text-xs text-red-700">
          Os outros arquivos já abertos continuam disponíveis na barra lateral.
        </p>
      </div>
    </div>
  )
}
