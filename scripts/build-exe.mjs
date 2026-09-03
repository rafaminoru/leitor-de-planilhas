import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const targets = process.argv.slice(2)
const platforms = targets.length > 0 ? targets : ['win']

const outDir = path.join(os.tmpdir(), 'leitor-xlsx-release')
const destDir = path.join(process.cwd(), 'release')
const downloadDir = path.join(process.cwd(), 'downloads')
const builderCli = path.join(process.cwd(), 'node_modules', 'electron-builder', 'cli.js')

const env = {
  ...process.env,
  CSC_IDENTITY_AUTO_DISCOVERY: 'false',
}

const specs = {
  win: {
    kind: 'builder',
    args: ['--win', 'portable', '--x64'],
    artifact: 'Visualizador-de-Planilhas.exe',
  },
  mac: {
    kind: 'packager',
    script: path.join(process.cwd(), 'scripts', 'pack-mac.mjs'),
    artifact: 'Visualizador-de-Planilhas-macOS.zip',
  },
}

fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(outDir, { recursive: true })
fs.mkdirSync(destDir, { recursive: true })
fs.mkdirSync(downloadDir, { recursive: true })

for (const platform of platforms) {
  const spec = specs[platform]
  if (!spec) {
    console.error(`Plataforma desconhecida: ${platform}`)
    process.exit(1)
  }

  if (spec.kind === 'packager') {
    const packed = spawnSync(process.execPath, [spec.script], { stdio: 'inherit', env })
    if (packed.status !== 0) process.exit(packed.status ?? 1)
    continue
  }

  const result = spawnSync(
    process.execPath,
    [builderCli, ...spec.args, `-c.directories.output=${outDir}`],
    { stdio: 'inherit', env },
  )
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }

  const built = path.join(outDir, spec.artifact)
  if (!fs.existsSync(built)) {
    const found = fs.readdirSync(outDir)
    console.error(`Artefato não encontrado: ${spec.artifact}`, found)
    process.exit(1)
  }

  const dest = path.join(destDir, spec.artifact)
  const downloadDest = path.join(downloadDir, spec.artifact)
  fs.copyFileSync(built, dest)
  fs.copyFileSync(built, downloadDest)
  const sizeMb = (fs.statSync(dest).size / (1024 * 1024)).toFixed(1)
  console.log(`Gerado ${dest} (${sizeMb} MB)`)
  console.log(`Download ${downloadDest}`)
}
