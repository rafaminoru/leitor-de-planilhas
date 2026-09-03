import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

if (process.platform !== 'darwin') {
  console.error(
    'O pacote macOS precisa ser gerado em um Mac (ou no GitHub Actions). O Windows não consegue criar o .app do Electron.',
  )
  process.exit(1)
}

const zipName = 'Visualizador-de-Planilhas-macOS.zip'
const outDir = path.join(os.tmpdir(), 'leitor-xlsx-release-mac')
const destDir = path.join(process.cwd(), 'release')
const downloadDir = path.join(process.cwd(), 'downloads')
const builderCli = path.join(process.cwd(), 'node_modules', 'electron-builder', 'cli.js')

fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(outDir, { recursive: true })

const env = {
  ...process.env,
  CSC_IDENTITY_AUTO_DISCOVERY: 'false',
}

const result = spawnSync(
  process.execPath,
  [builderCli, '--mac', 'zip', '--arm64', `-c.directories.output=${outDir}`],
  { stdio: 'inherit', env },
)
if (result.status !== 0) process.exit(result.status ?? 1)

const found = fs.readdirSync(outDir).filter((name) => name.endsWith('.zip'))
if (found.length === 0) {
  console.error('Zip macOS não encontrado em', outDir, fs.readdirSync(outDir))
  process.exit(1)
}
const built = path.join(outDir, found[0])

fs.mkdirSync(destDir, { recursive: true })
fs.mkdirSync(downloadDir, { recursive: true })
fs.copyFileSync(built, path.join(destDir, zipName))
fs.copyFileSync(built, path.join(downloadDir, zipName))
const sizeMb = (fs.statSync(built).size / (1024 * 1024)).toFixed(1)
console.log(`Gerado ${path.join(downloadDir, zipName)} (${sizeMb} MB)`)
