# Foto para PDF — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PWA de uma tela que transforma fotos do caderno num PDF nomeado e abre o compartilhamento do celular.

**Architecture:** Site estático, sem build. Scripts clássicos (não ES modules, para os testes rodarem via `file://`) que penduram funções num namespace global `window.App`. Lógica pura em arquivos pequenos e testáveis; `js/app.js` só liga a interface. Service worker faz cache do app para funcionar offline. Hospedado no GitHub Pages.

**Tech Stack:** HTML/CSS/JS puros, jsPDF 3.x (UMD, copiado para `vendor/`), Canvas API, Web Share API, `localStorage`, Service Worker. Testes: página `tests/index.html` com mini-harness próprio, executada pelo Chrome headless.

**Spec:** `docs/superpowers/specs/2026-11-23-foto-para-pdf-design.md`

## Global Constraints

- Nenhuma foto sai do aparelho: proibido `fetch`/upload de imagens; jsPDF é servido localmente (`vendor/`), nunca de CDN em tempo de execução.
- O nome do aluno vai **só no nome do arquivo**, nunca dentro do PDF.
- Formato do nome: com nome → `<Nome> - <Título>.pdf`; sem nome → `<Título>.pdf`.
- Nome salvo em `localStorage`, chave `fotoPdf.nome`.
- Sem edição de imagem (recorte, contraste, filtros).
- Todas as URLs relativas (`./`): o app roda em `https://<usuario>.github.io/<repo>/`.
- Textos da interface em português do Brasil.
- Não há Node nem Python na máquina. Comando de teste (Git Bash, a partir da raiz do projeto):
  ```bash
  "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=15000 --dump-dom "file:///$(pwd -W)/tests/index.html" 2>/dev/null | grep -oE 'RESULT:[^<]*|FAIL:[^<]*'
  ```
  Sucesso = `RESULT: N passed, 0 failed` e nenhuma linha `FAIL:`.

## Review Focus

1. **Título vazio:** gerar com o título em branco dá `Caderno AAAA-MM-DD.pdf` (data local), nunca `.pdf` nem ` - .pdf`. Teste na Task 1.
2. **Caracteres proibidos em nome de arquivo** (`/ \ : * ? " < > |`) no título ou no nome: são trocados por espaço e os espaços repetidos colapsados. Acentos ficam. Teste na Task 1.
3. **Foto enorme da câmera (12–50 MP):** é reduzida para no máximo 1600 px no lado maior, em JPEG, sem estourar memória nem gerar PDF de dezenas de MB. Teste na Task 3.
4. **Compartilhamento indisponível (PC/Firefox) ou cancelado pelo usuário:** sem suporte → baixa o arquivo; cancelou → nada acontece, sem mensagem de erro. Teste na Task 5.
5. **Arquivo que não decodifica como imagem:** é pulado com aviso, e as outras fotos continuam. Teste na Task 3 (rejeição) e na Task 5 (aviso na UI).

---

### Task 1: Esqueleto, harness de testes e nome do arquivo

**Files:**
- Create: `.gitignore` (vazio de regras relevantes; só `*.tmp`)
- Create: `tests/index.html`, `tests/harness.js`, `tests/filename.test.js`
- Create: `js/filename.js`

**Interfaces:**
- Produces:
  - `tests/harness.js`: `test(name: string, fn: () => void | Promise<void>)`, `assertEqual(actual, expected, msg?)`, `assert(cond, msg?)`, `runTests(): Promise<void>`. Ao fim, escreve no `<body>` um `<pre>` por falha com `FAIL: <nome>: <mensagem>` e um `<pre>RESULT: N passed, M failed</pre>`.
  - `App.sanitizeFileNamePart(s: string): string`
  - `App.buildFileName(title: string, name: string, includeName: boolean, today: Date = new Date()): string`
- `tests/index.html` carrega, em ordem: `../vendor/jspdf.umd.min.js` (existirá a partir da Task 4; até lá, ausente sem problema), `../js/*.js` usados, `harness.js`, os `*.test.js` e um `<script>runTests()</script>`. Cada task seguinte adiciona seus `<script>` aqui.

- [ ] **Step 1:** `git init` na raiz e criar `.gitignore`.
- [ ] **Step 2: Escrever o harness e os testes que falham** em `tests/filename.test.js`:

```js
test('com nome', () => assertEqual(App.buildFileName('Lista 3 Cálculo', 'Ana Souza', true), 'Ana Souza - Lista 3 Cálculo.pdf'));
test('sem nome', () => assertEqual(App.buildFileName('Lista 3 Cálculo', 'Ana Souza', false), 'Lista 3 Cálculo.pdf'));
test('nome ligado mas vazio', () => assertEqual(App.buildFileName('Lista 3', '   ', true), 'Lista 3.pdf'));
test('título vazio usa data', () => assertEqual(App.buildFileName('  ', '', false, new Date(2026, 10, 5)), 'Caderno 2026-11-05.pdf'));
test('título vazio com nome', () => assertEqual(App.buildFileName('', 'Ana', true, new Date(2026, 10, 5)), 'Ana - Caderno 2026-11-05.pdf'));
test('caracteres proibidos', () => assertEqual(App.sanitizeFileNamePart('Lista 1/2: "Física"?'), 'Lista 1 2 Física'));
test('nome com proibidos', () => assertEqual(App.buildFileName('Prova', 'Ana<>Souza', true), 'Ana Souza - Prova.pdf'));
test('pontos finais removidos', () => assertEqual(App.sanitizeFileNamePart('Resumo...'), 'Resumo'));
test('limite de tamanho', () => {
  const f = App.buildFileName('x'.repeat(300), '', false);
  assertEqual(f.length, 124); // 120 + ".pdf"
});
```

- [ ] **Step 3:** Rodar o comando de teste. Esperado: falhas com `App is not defined` ou `buildFileName is not a function`.
- [ ] **Step 4: Implementar `js/filename.js`.** `sanitizeFileNamePart`: troca `[\\/:*?"<>|\x00-\x1F]` por espaço, colapsa espaços, `trim`, remove pontos e espaços do fim. `buildFileName`: título sanitizado ou `Caderno AAAA-MM-DD` (data local, com zeros à esquerda); prefixa `<nome> - ` só se `includeName` e nome sanitizado não vazio; corta a base em 120 caracteres (e faz `trim` de novo) antes de `.pdf`.
- [ ] **Step 5:** Rodar o comando de teste. Esperado: `RESULT: 9 passed, 0 failed`.
- [ ] **Step 6:** Commit: `feat: nome do arquivo e harness de testes`.

### Task 2: Lista de páginas

**Files:**
- Create: `js/pages.js`, `tests/pages.test.js` (e incluir ambos em `tests/index.html`)

**Interfaces:**
- Produces: `App.createPageList()` → objeto com `items(): Page[]` (cópia), `add(page: Page): void`, `remove(index: number): void`, `move(from: number, to: number): void`, `clear(): void`, `count(): number`. `Page = { dataUrl: string, width: number, height: number }` (definido na Task 3; aqui a lista trata como opaco).

- [ ] **Step 1: Testes que falham:**

```js
test('add e ordem', () => { const l = App.createPageList(); l.add('a'); l.add('b'); assertEqual(l.items().join(), 'a,b'); });
test('move para o fim', () => { const l = App.createPageList(); ['a','b','c'].forEach(x => l.add(x)); l.move(0, 2); assertEqual(l.items().join(), 'b,c,a'); });
test('move fora do intervalo não faz nada', () => { const l = App.createPageList(); ['a','b'].forEach(x => l.add(x)); l.move(0, -1); l.move(1, 5); assertEqual(l.items().join(), 'a,b'); });
test('remove', () => { const l = App.createPageList(); ['a','b','c'].forEach(x => l.add(x)); l.remove(1); assertEqual(l.items().join(), 'a,c'); assertEqual(l.count(), 2); });
test('items é cópia', () => { const l = App.createPageList(); l.add('a'); l.items().push('z'); assertEqual(l.count(), 1); });
test('clear', () => { const l = App.createPageList(); l.add('a'); l.clear(); assertEqual(l.count(), 0); });
```

- [ ] **Step 2:** Rodar: falha com `createPageList is not a function`.
- [ ] **Step 3:** Implementar `js/pages.js` (array interno com `splice`; índices inválidos são no-op).
- [ ] **Step 4:** Rodar: `RESULT: 15 passed, 0 failed`.
- [ ] **Step 5:** Commit: `feat: lista de páginas`.

### Task 3: Compressão de imagem

**Files:**
- Create: `js/image.js`, `tests/image.test.js` (incluir em `tests/index.html`)

**Interfaces:**
- Produces:
  - `App.MAX_SIDE = 1600`, `App.JPEG_QUALITY = 0.7`
  - `App.fitWithin(width: number, height: number, maxSide: number): { width: number, height: number }`: inteiros arredondados, nunca amplia.
  - `App.compressImage(file: Blob): Promise<Page>`: `Page = { dataUrl: string /* data:image/jpeg */, width: number, height: number }`. Rejeita com `Error` se o blob não decodifica.

- [ ] **Step 1: Testes que falham.** Use um helper no próprio arquivo de teste que gera um PNG de `w×h` via canvas `toBlob`:

```js
test('fit paisagem', () => { const r = App.fitWithin(4000, 3000, 1600); assertEqual(r.width, 1600); assertEqual(r.height, 1200); });
test('fit retrato', () => { const r = App.fitWithin(3000, 4000, 1600); assertEqual(r.width, 1200); assertEqual(r.height, 1600); });
test('fit não amplia', () => { const r = App.fitWithin(1000, 800, 1600); assertEqual(r.width, 1000); assertEqual(r.height, 800); });
test('compress reduz foto grande para JPEG', async () => {
  const p = await App.compressImage(await makePng(4000, 3000));
  assertEqual(p.width, 1600); assertEqual(p.height, 1200);
  assert(p.dataUrl.startsWith('data:image/jpeg'), 'deve ser jpeg');
});
test('compress rejeita não-imagem', async () => {
  let rejected = false;
  try { await App.compressImage(new Blob(['nada'], { type: 'image/jpeg' })); } catch (e) { rejected = true; }
  assert(rejected, 'deveria rejeitar');
});
```

- [ ] **Step 2:** Rodar: falha com `fitWithin is not a function`.
- [ ] **Step 3:** Implementar `js/image.js`: decodifica via `<img>` + `URL.createObjectURL` (o navegador aplica a orientação EXIF), revoga a URL ao fim, desenha num canvas do tamanho de `fitWithin(..., App.MAX_SIDE)` com fundo branco, `toDataURL('image/jpeg', App.JPEG_QUALITY)`. `onerror` → rejeita.
- [ ] **Step 4:** Rodar: `RESULT: 20 passed, 0 failed`.
- [ ] **Step 5:** Commit: `feat: compressão de imagem`.

### Task 4: Geração do PDF

**Files:**
- Create: `vendor/jspdf.umd.min.js`, `vendor/README.md` (versão exata e URL de origem)
- Create: `js/pdf.js`, `tests/pdf.test.js` (incluir em `tests/index.html`)

**Interfaces:**
- Consumes: `Page` da Task 3; global `window.jspdf.jsPDF`.
- Produces:
  - `App.pageLayout(imgWidth: number, imgHeight: number): { orientation: 'p'|'l', x: number, y: number, w: number, h: number }`, em mm, A4 (210×297), margem 10 mm, imagem centralizada. Página em paisagem quando `imgWidth > imgHeight`.
  - `App.buildPdf(pages: Page[]): Blob` (`application/pdf`, uma página por foto, na ordem). Lança `Error` se `pages` estiver vazio.

- [ ] **Step 1:** Baixar o jsPDF: `curl -L -o vendor/jspdf.umd.min.js https://cdn.jsdelivr.net/npm/jspdf@3/dist/jspdf.umd.min.js`. Conferir a versão no cabeçalho do arquivo e registrá-la em `vendor/README.md`.
- [ ] **Step 2: Testes que falham:**

```js
const near = (a, b) => Math.abs(a - b) < 0.01;
test('layout retrato', () => { const L = App.pageLayout(1200, 1600); assertEqual(L.orientation, 'p'); assert(near(L.w, 190) && near(L.h, 253.33) && near(L.x, 10) && near(L.y, 21.83), JSON.stringify(L)); });
test('layout paisagem', () => { const L = App.pageLayout(1600, 1200); assertEqual(L.orientation, 'l'); assert(near(L.w, 253.33) && near(L.h, 190) && near(L.x, 21.83) && near(L.y, 10), JSON.stringify(L)); });
test('pdf com 2 páginas', async () => {
  const pages = [await App.compressImage(await makePng(1200, 1600)), await App.compressImage(await makePng(1600, 1200))];
  const blob = App.buildPdf(pages);
  assertEqual(blob.type, 'application/pdf');
  const text = await blob.text();
  assertEqual((text.match(/\/Type \/Page[^s]/g) || []).length, 2);
});
test('pdf vazio lança erro', () => { let threw = false; try { App.buildPdf([]); } catch (e) { threw = true; } assert(threw); });
```

(`makePng` vem de `tests/image.test.js`; declare-o como função global lá.)

- [ ] **Step 3:** Rodar: falha com `pageLayout is not a function`.
- [ ] **Step 4:** Implementar `js/pdf.js`: `new jsPDF({ orientation, unit: 'mm', format: 'a4' })` para a primeira página, `addPage('a4', orientation)` para as seguintes, `addImage(dataUrl, 'JPEG', x, y, w, h)`, `output('blob')`.
- [ ] **Step 5:** Rodar: `RESULT: 24 passed, 0 failed`.
- [ ] **Step 6:** Commit: `feat: geração de PDF com jsPDF local`.

### Task 5: Entrega do arquivo e interface

**Files:**
- Create: `js/share.js`, `tests/share.test.js` (incluir em `tests/index.html`)
- Create: `js/settings.js`, `js/app.js`, `index.html`, `css/style.css`

**Interfaces:**
- Consumes: tudo das Tasks 1–4.
- Produces:
  - `App.sharePdf(blob: Blob, fileName: string, nav = navigator, doc = document): Promise<'shared'|'downloaded'|'cancelled'>`: se `nav.canShare?.({ files: [file] })`, chama `nav.share({ files: [file], title: fileName })`; `AbortError` → `'cancelled'`; outro erro ou sem suporte → `downloadPdf` e `'downloaded'`.
  - `App.downloadPdf(blob: Blob, fileName: string, doc = document): void`: `<a download>` com object URL, clica e revoga após 10 s.
  - `App.loadName(): string`, `App.saveName(name: string): void` (chave `fotoPdf.nome`).

- [ ] **Step 1: Testes que falham** (stubs de `nav` e `doc`; `doc.createElement` devolve objeto que registra `click()`; `doc.body.appendChild`/`removeChild` no-op):

```js
test('compartilha quando suportado', async () => { const nav = { canShare: () => true, share: async () => {} }; assertEqual(await App.sharePdf(pdfBlob(), 'a.pdf', nav, fakeDoc()), 'shared'); });
test('cancelado não baixa', async () => { const d = fakeDoc(); const nav = { canShare: () => true, share: async () => { throw new DOMException('x', 'AbortError'); } }; assertEqual(await App.sharePdf(pdfBlob(), 'a.pdf', nav, d), 'cancelled'); assertEqual(d.clicks, 0); });
test('sem suporte baixa', async () => { const d = fakeDoc(); assertEqual(await App.sharePdf(pdfBlob(), 'a.pdf', {}, d), 'downloaded'); assertEqual(d.clicks, 1); assertEqual(d.lastDownload, 'a.pdf'); });
test('erro no share baixa', async () => { const d = fakeDoc(); const nav = { canShare: () => true, share: async () => { throw new Error('falhou'); } }; assertEqual(await App.sharePdf(pdfBlob(), 'a.pdf', nav, d), 'downloaded'); });
test('nome salvo', () => { App.saveName('Ana'); assertEqual(App.loadName(), 'Ana'); localStorage.removeItem('fotoPdf.nome'); assertEqual(App.loadName(), ''); });
```

- [ ] **Step 2:** Rodar: falha com `sharePdf is not a function`.
- [ ] **Step 3:** Implementar `js/share.js` e `js/settings.js`.
- [ ] **Step 4:** Rodar: `RESULT: 29 passed, 0 failed`.
- [ ] **Step 5: Interface** (`index.html`, `css/style.css`, `js/app.js`). Elementos, de cima para baixo:
  - Botões "📷 Tirar foto" (`<input type="file" accept="image/*" capture="environment" hidden>`) e "🖼 Galeria" (`accept="image/*" multiple hidden`).
  - Grade de miniaturas numeradas, cada uma com ◀ ▶ (move) e ✕ (remove). Texto "Nenhuma foto ainda" quando vazia.
  - Campo "Título" (texto).
  - Checkbox "Incluir meu nome" (marcado por padrão) e campo "Meu nome", preenchido com `loadName()` e salvo com `saveName` no `change`.
  - Prévia do nome do arquivo ao vivo (`buildFileName`).
  - Botões "Enviar PDF" (`sharePdf`) e "Baixar" (`downloadPdf`), desabilitados com 0 páginas.
  - "Novo PDF": limpa páginas e título (com `confirm`).
  - Linha de status: "Processando 2 de 5…" durante a compressão; "1 arquivo não pôde ser lido e foi ignorado" quando `compressImage` rejeita.
  - As fotos são comprimidas ao serem adicionadas (a lista guarda só `Page`). O PDF é gerado no clique.
  - Botões grandes (mín. 48 px de altura), layout de uma coluna, `meta viewport`. O `index.html` carrega `vendor/jspdf.umd.min.js` e os `js/*.js` como scripts clássicos.
- [ ] **Step 6: Verificar visualmente:** `chrome.exe --headless=new --screenshot="$TEMP/ui.png" --window-size=390,844 "file:///$(pwd -W)/index.html"`, abrir o PNG e conferir o layout. Depois, abrir `index.html` no Chrome do PC, adicionar 2 fotos pela galeria, reordenar, gerar e baixar, e conferir o nome do arquivo e as páginas do PDF.
- [ ] **Step 7:** Rodar os testes de novo: `RESULT: 29 passed, 0 failed`.
- [ ] **Step 8:** Commit: `feat: interface e entrega do PDF`.

### Task 6: PWA (instalar e offline) e publicação

**Files:**
- Create: `manifest.webmanifest`, `sw.js`, `icons/icon-192.png`, `icons/icon-512.png`, `tools/icon.html`
- Modify: `index.html` (link do manifest, `apple-touch-icon`, `theme-color`, registro do SW em `js/app.js`)

**Interfaces:**
- `manifest.webmanifest`: `name: "Foto para PDF"`, `short_name: "Foto PDF"`, `start_url: "./"`, `scope: "./"`, `display: "standalone"`, ícones 192 e 512.
- `sw.js`: `CACHE = 'foto-pdf-v1'`; no `install`, guarda a lista explícita de todos os arquivos do app (`./`, `index.html`, css, todos os `js/*.js`, `vendor/jspdf.umd.min.js`, manifest, ícones); no `activate`, apaga caches com outro nome; no `fetch`, cache-first com fallback para rede. **Toda mudança futura no app exige incrementar `CACHE`** (anotar isso num comentário no topo do `sw.js`).

- [ ] **Step 1: Ícones.** `tools/icon.html`: quadrado colorido em tela cheia com "PDF" e um ícone de página, dimensionado em `vw`. Gerar com Chrome headless `--screenshot` em `--window-size=512,512` e `192,192`, salvando em `icons/`.
- [ ] **Step 2:** Criar o manifest e o `sw.js`. Registrar o SW em `js/app.js` só quando `location.protocol` for `https:` (em `file://` não funciona).
- [ ] **Step 3:** Rodar os testes: `RESULT: 29 passed, 0 failed` (o SW não interfere em `file://`).
- [ ] **Step 4:** Commit: `feat: PWA instalável e offline`.
- [ ] **Step 5: Publicação (precisa do usuário, porque o `gh` não está instalado).** Pedir ao usuário que crie um repositório **público** no github.com (sugestão: `foto-pdf`) e passe a URL. Depois: `git remote add origin <url>`, `git branch -M main`, `git push -u origin main`. O usuário ativa Settings → Pages → Branch `main` / root.
- [ ] **Step 6: Verificação no celular (usuário):** abrir `https://<usuario>.github.io/foto-pdf/`, adicionar à tela inicial, ligar o modo avião, abrir pelo ícone, tirar 2 fotos, gerar e enviar. O arquivo deve chegar com o nome certo, com 2 páginas.
