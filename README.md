# Visualizador local de planilhas

Abre CSV/TSV/XLSX/XLS e mostra o conteúdo em tabela. Sem backend, sem edição, sem persistência.

## Download

**[Download para Windows](https://github.com/rafaminoru/leitor-de-planilhas/raw/main/downloads/Visualizador-de-Planilhas.exe)** (~83 MB)

1. Clique no link acima e salve o `.exe`.
2. Clique duas vezes no arquivo.
3. Arraste a planilha para a janela (ou use **+** / **Abrir arquivos**).

Não precisa instalar Node, npm nem navegador. O primeiro clique pode levar ~10 s. O Windows SmartScreen pode avisar porque o arquivo não é assinado — escolha **Mais informações** → **Executar assim mesmo**.

Quem tem o código e quer gerar o `.exe` de novo:

```bash
npm install
npm run exe
```

O build também copia o arquivo para `downloads/Visualizador-de-Planilhas.exe`.

## Para quem desenvolve

```bash
npm install
npm run dev
```

Abre o endereço que o Vite imprimir (geralmente `http://localhost:5173`). Arraste arquivos para a janela ou use **Abrir arquivos**.

Gerar os arquivos de teste:

```bash
npm run samples
```

Isso cria a pasta `samples/` com CSV latin1, CSV com aspas/quebras de linha, XLSX com 3 abas, um arquivo corrompido e um CSV de 200 mil linhas.

## Formatos suportados

| Extensão | Parser | Observação |
|---|---|---|
| `.csv` | PapaParse | Detecta `,` `;` tab `\|` e UTF-8 / ISO-8859-1 / Windows-1252 |
| `.tsv` | PapaParse | Delimitador tab |
| `.xlsx` `.xls` | SheetJS | Cada aba aparece como guia no rodapé |

## O que a tela faz

- Vários arquivos na barra esquerda (estilo sessões); abas da planilha no rodapé, como no Google Sheets
- 1ª linha como cabeçalho (liga/desliga)
- Ordenação, busca global, filtro por coluna
- Colunas redimensionáveis e ocultáveis
- Virtualização de linhas (arquivos grandes)
- Parsing em Web Worker, com barra de progresso

## Limitações conhecidas

- Nada é salvo. Fechar a janela perde os arquivos abertos.
- Sem edição, exportação, gráficos, fórmulas ou junção entre arquivos.
- XLSX é carregado inteiro na memória (limite prático: dezenas de MB, não centenas).
- Fórmulas do Excel aparecem como o valor já calculado (cache), não como fórmula.
- Encoding automático só distingue UTF-8 de Windows-1252. ISO-8859-1 é override manual (para português os dois latin1 são equivalentes).
- Ordenar/filtrar 200 mil linhas pode levar algumas centenas de ms na thread principal.
- O `.exe` não é assinado. O Windows SmartScreen pode avisar na primeira execução — escolha **Mais informações** → **Executar assim mesmo**.

## Scripts

```bash
npm run dev       # servidor local
npm run build     # checagem TypeScript + bundle
npm run samples   # gera samples/
npm run electron  # abre a janela desktop a partir do build
npm run exe       # gera o .exe (release/ e downloads/)
```
