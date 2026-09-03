# Visualizador local de planilhas

Abre CSV/TSV/XLSX/XLS e mostra o conteúdo em tabela. Sem backend, sem edição, sem persistência.

## Download

- **[Windows (.exe)](https://github.com/rafaminoru/leitor-de-planilhas/raw/main/downloads/Visualizador-de-Planilhas.exe)** (~83 MB)
- **[macOS (.zip)](https://github.com/rafaminoru/leitor-de-planilhas/raw/main/downloads/Visualizador-de-Planilhas-macOS.zip)** (Intel e Apple Silicon)

### Windows

1. Baixe o `.exe` e clique duas vezes.
2. Arraste a planilha para a janela (ou use **+** / **Abrir arquivos**).

O Windows SmartScreen pode avisar porque o arquivo não é assinado — escolha **Mais informações** → **Executar assim mesmo**. O primeiro clique pode levar ~10 s.

### macOS

1. Baixe o `.zip` e extraia o `Visualizador de Planilhas.app`.
2. Arraste o app para **Aplicativos** (ou abra direto da pasta).
3. Na primeira vez: clique com o botão direito no app → **Abrir** → **Abrir**. O Gatekeeper avisa porque o app não é assinado pela Apple.

Quem tem o código e quer gerar de novo:

```bash
npm install
npm run exe       # Windows (nesta máquina)
npm run exe:mac   # macOS (precisa rodar em um Mac)
```

O zip de macOS também é gerado automaticamente no GitHub Actions e publicado em `downloads/`.

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
- Os instaláveis não são assinados. Windows (SmartScreen) e macOS (Gatekeeper) avisam na primeira execução.

## Scripts

```bash
npm run dev       # servidor local
npm run build     # checagem TypeScript + bundle
npm run samples   # gera samples/
npm run electron  # abre a janela desktop a partir do build
npm run exe       # gera o .exe Windows
npm run exe:mac   # gera o .zip macOS (precisa de um Mac)
```
