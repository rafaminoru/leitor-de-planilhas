import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'samples')
fs.mkdirSync(outDir, { recursive: true })

const latin1 = [
  'nome;cidade;observacao',
  'José;São Paulo;ação urgente',
  'Márcia;Belo Horizonte;não pague',
  'João;Curitiba;maçã, pêssego e açaí',
  'Renée;Brasília;lingüiça',
].join('\r\n')
fs.writeFileSync(path.join(outDir, 'acentos-latin1.csv'), Buffer.from(latin1, 'latin1'))

const quoted = [
  'nome,comentario,valor',
  '"João Silva","linha 1',
  'linha 2 com ""aspas"" dentro",10',
  '"Maria, a rápida","texto simples",20',
  'Pedro,"quebra no final',
  'ok",30',
].join('\n')
fs.writeFileSync(path.join(outDir, 'aspas-quebras.csv'), quoted, 'utf8')

const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.aoa_to_sheet([
    ['produto', 'qtd', 'preco'],
    ['maçã', 10, 3.5],
    ['banana', 5, 2.1],
    ['laranja', 8, 4],
  ]),
  'Produtos',
)
XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.aoa_to_sheet([
    ['cliente', 'uf'],
    ['Ana', 'SP'],
    ['Bruno', 'RJ'],
    ['Carla', 'MG'],
  ]),
  'Clientes',
)
XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.aoa_to_sheet([
    ['mes', 'total'],
    ['jan', 1000],
    ['fev', 1300],
    ['mar', 900],
  ]),
  'Resumo',
)
XLSX.writeFile(wb, path.join(outDir, 'tres-abas.xlsx'))

fs.writeFileSync(path.join(outDir, 'corrompido.xlsx'), Buffer.from('isto nao e um xlsx valido'))

const largePath = path.join(outDir, 'grande-200k.csv')
const stream = fs.createWriteStream(largePath)
stream.write('id;nome;cidade;valor\n')
for (let i = 1; i <= 200_000; i++) {
  stream.write(`${i};Item ${i};Cidade ${i % 120};${(i * 1.37).toFixed(2)}\n`)
}
await new Promise((resolve, reject) => {
  stream.end(resolve)
  stream.on('error', reject)
})

console.log('Samples em', outDir)
console.log('- acentos-latin1.csv')
console.log('- aspas-quebras.csv')
console.log('- tres-abas.xlsx')
console.log('- corrompido.xlsx')
console.log('- grande-200k.csv (200.000 linhas)')
