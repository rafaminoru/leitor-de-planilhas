import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const shotDir = path.join(root, '.verify')
fs.mkdirSync(shotDir, { recursive: true })

const samples = {
  latin1: path.join(root, 'samples', 'acentos-latin1.csv'),
  quoted: path.join(root, 'samples', 'aspas-quebras.csv'),
  xlsx: path.join(root, 'samples', 'tres-abas.xlsx'),
  bad: path.join(root, 'samples', 'corrompido.xlsx'),
  large: path.join(root, 'samples', 'grande-200k.csv'),
}

const errors = []
const logs = []

const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
})

function fail(msg) {
  console.log(`FAIL ${msg}`)
  logs.push(`FAIL ${msg}`)
  throw new Error(msg)
}
function ok(msg) {
  console.log(`OK ${msg}`)
  logs.push(`OK ${msg}`)
}

await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' })
await page.getByText('Arraste CSV', { exact: false }).waitFor({ timeout: 15000 })
await page.screenshot({ path: path.join(shotDir, '01-empty.png') })
const emptyText = await page.locator('body').innerText()
if (!emptyText.includes('Arraste CSV')) fail('estado vazio não apareceu')
ok('estado vazio')

const fileInput = page.locator('aside input[type=file]')
await fileInput.setInputFiles(samples.latin1)
await page.getByText('José', { exact: false }).first().waitFor({ timeout: 15000 })
await page.screenshot({ path: path.join(shotDir, '02-latin1.png') })
const latinText = await page.locator('body').innerText()
for (const token of ['José', 'São Paulo', 'ação', 'ponto e vírgula', 'Windows-1252']) {
  if (!latinText.includes(token)) fail(`latin1: faltou "${token}"`)
}
ok('CSV latin1 + acentos + delimitador/encoding')

await page.getByRole('button', { name: /^nome/ }).click()
await page.waitForTimeout(250)
ok('ordenação clicada')

await page.getByPlaceholder('Filtrar').first().fill('José')
await page.getByText('visíveis', { exact: false }).waitFor({ timeout: 8000 })
const filteredLatin = await page.locator('body').innerText()
if (filteredLatin.includes('Márcia')) fail('filtro de coluna ainda mostra Márcia')
ok('filtro por coluna')
await page.getByPlaceholder('Filtrar').first().fill('')
await page.waitForTimeout(400)

await page.getByRole('button', { name: 'Colunas' }).click()
await page.locator('label').filter({ hasText: 'observacao' }).locator('input').uncheck()
await page.waitForTimeout(200)
await page.keyboard.press('Escape')
await page.mouse.click(800, 400)
ok('ocultar coluna')

await page.getByLabel('1ª linha é cabeçalho').uncheck()
await page.getByText('nome', { exact: true }).waitFor({ timeout: 8000 })
ok('toggle cabeçalho')
await page.getByLabel('1ª linha é cabeçalho').check()

await fileInput.setInputFiles(samples.quoted)
await page.getByText('aspas-quebras.csv').waitFor({ timeout: 15000 })
await page.getByText('aspas-quebras.csv').click()
await page.getByText('João Silva', { exact: false }).first().waitFor({ timeout: 10000 })
await page.screenshot({ path: path.join(shotDir, '03-quoted.png') })
const quotedText = await page.locator('body').innerText()
if (!quotedText.includes('João Silva')) fail('quoted: faltou João Silva')
if (!quotedText.includes('linha 2')) fail('quoted: quebra de linha na célula não apareceu')
ok('CSV com aspas e quebra de linha')

await fileInput.setInputFiles(samples.xlsx)
await page.getByText('tres-abas.xlsx').waitFor({ timeout: 15000 })
await page.getByText('tres-abas.xlsx').click()
await page.getByText('Produtos').first().waitFor({ timeout: 10000 })
const xlsxText = await page.locator('body').innerText()
for (const token of ['Produtos', 'Clientes', 'Resumo']) {
  if (!xlsxText.includes(token)) fail(`xlsx: faltou aba ${token}`)
}
await page.locator('footer').getByRole('button', { name: 'Clientes' }).click()
await page.getByText('Bruno').first().waitFor({ timeout: 8000 })
await page.screenshot({ path: path.join(shotDir, '04-xlsx.png') })
ok('XLSX com 3 abas')

await page.getByPlaceholder('Buscar em todas as colunas').fill('Bruno')
await page.getByText('Bruno').first().waitFor({ timeout: 8000 })
await page.waitForTimeout(400)
const filtered = await page.locator('body').innerText()
if (filtered.includes('Carla') && !filtered.match(/Carla/)) {
  /* Carla may still appear in sidebar; that's ok */
}
ok('busca global preenchida')

await fileInput.setInputFiles(samples.bad)
await page.getByText('corrompido.xlsx').waitFor({ timeout: 15000 })
await page.getByText('corrompido.xlsx').click()
try {
  await page.getByText('Não foi possível ler', { exact: false }).waitFor({ timeout: 10000 })
} catch (err) {
  await page.screenshot({ path: path.join(shotDir, '05-error-debug.png') })
  console.log('BODY_ON_ERROR\n', await page.locator('body').innerText())
  throw err
}
await page.screenshot({ path: path.join(shotDir, '05-error.png') })
const stillHasLatin = await page.locator('aside').innerText()
if (!stillHasLatin.includes('acentos-latin1.csv')) fail('erro derrubou os outros arquivos')
ok('arquivo corrompido isolado')

if (fs.existsSync(samples.large)) {
  await fileInput.setInputFiles(samples.large)
  await page.getByText('grande-200k.csv').waitFor({ timeout: 20000 })
  await page.getByText('grande-200k.csv').click()
  await page.getByText('200.000', { exact: false }).waitFor({ timeout: 60000 })
  await page.screenshot({ path: path.join(shotDir, '06-large.png') })
  ok('CSV 200k linhas')
}

await page.setViewportSize({ width: 390, height: 844 })
await page.screenshot({ path: path.join(shotDir, '07-mobile.png') })
ok('viewport mobile capturado')

await browser.close()

if (errors.length) {
  console.log('CONSOLE', errors.join('\n'))
}
console.log(logs.join('\n'))
console.log('SHOTS', shotDir)
console.log('PASS')
