import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const exeName = 'Visualizador-de-Planilhas.exe'
const outDir = path.join(os.tmpdir(), 'leitor-xlsx-release')
const destDir = path.join(process.cwd(), 'release')
const dest = path.join(destDir, exeName)

fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(outDir, { recursive: true })

const env = {
  ...process.env,
  CSC_IDENTITY_AUTO_DISCOVERY: 'false',
}

const builderCli = path.join(process.cwd(), 'node_modules', 'electron-builder', 'cli.js')
const result = spawnSync(
  process.execPath,
  [builderCli, '--win', 'portable', '--x64', `-c.directories.output=${outDir}`],
  { stdio: 'inherit', env },
)

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

const built = path.join(outDir, exeName)
if (!fs.existsSync(built)) {
  const found = fs.readdirSync(outDir).filter((name) => name.endsWith('.exe'))
  console.error('Exe não encontrado em', outDir, found)
  process.exit(1)
}

fs.mkdirSync(destDir, { recursive: true })
fs.copyFileSync(built, dest)
const downloadDir = path.join(process.cwd(), 'downloads')
fs.mkdirSync(downloadDir, { recursive: true })
const downloadDest = path.join(downloadDir, exeName)
fs.copyFileSync(built, downloadDest)
const sizeMb = (fs.statSync(dest).size / (1024 * 1024)).toFixed(1)
console.log(`Gerado ${dest} (${sizeMb} MB)`)
console.log(`Download ${downloadDest}`)
