# Foto para PDF

App pessoal, de um único usuário (estudante universitário): fotografa páginas do caderno, junta as fotos num PDF e envia pelo compartilhamento do celular. Fica instalado no celular como PWA, publicado no GitHub Pages a partir da branch `main`.

Fale com o usuário em **português do Brasil**. Ele prefere coisas **simples**: o app é para uso próprio, então nada de login, servidor, frameworks ou etapa de build.

## Como está montado

- HTML/CSS/JS puros, sem build. Os scripts são clássicos (não ES modules) e penduram funções em `window.App`.
- `index.html`: a única tela. `css/style.css` tem o visual de caderno (pauta azul, margem vermelha).
- `js/filename.js`: nome do arquivo = `<Título>.pdf`, ou `Caderno AAAA-MM-DD.pdf` sem título. O nome do aluno foi removido de propósito; quando um professor pede, o usuário escreve no título.
- `js/pages.js`: lista de páginas. `js/queue.js`: fila que processa fotos uma de cada vez.
- `js/image.js`: reduz as fotos a no máximo 1600 px, em JPEG com qualidade 0.7.
- `js/pdf.js`: uma página A4 por foto, centralizada, com margem de 10 mm e orientação conforme a foto.
- `js/share.js`: compartilhamento nativo, com download como alternativa. Se o usuário cancelar, nada acontece. Se o envio demorar demais (`needs-tap`), o app pede um novo toque.
- `js/app.js`: liga a tela às funções e cuida da atualização automática do app.
- `vendor/jspdf.umd.min.js`: jsPDF 3.0.4, servido localmente. Nunca troque por CDN, porque o app precisa funcionar offline.
- `sw.js` + `manifest.webmanifest` + `icons/`: instalação e modo offline.

## Regras obrigatórias

1. **Toda mudança em arquivo servido pelo app exige aumentar `CACHE` no `sw.js`** (`foto-pdf-v3` → `v4` …) e manter a lista `FILES` completa (arquivo novo entra, arquivo apagado sai). Sem isso, o celular continua com a versão antiga. Mudanças só em `docs/`, `tests/`, `tools/` ou neste arquivo não precisam.
2. As fotos nunca saem do aparelho: nada de upload ou `fetch` de imagens para fora.
3. Use só URLs relativas (`./`), porque o site fica em `https://<usuario>.github.io/foto-pdf/`.
4. Textos da interface em português do Brasil, em frases curtas e com verbos de ação.
5. Arquivos com barra invertida (regex, escapes) devem ser escritos com as ferramentas de edição de arquivo, não com heredoc ou `sed` no shell. Numa máquina Windows, o shell transformou `\\` em `\` e causou um bug real.

## Testes (TDD: escreva o teste, veja falhar, depois implemente)

Não precisa de Node nem de Python; os testes rodam no Chrome headless. Os scripts assumem Windows + Git Bash e o Chrome em `C:\Program Files\Google\Chrome\Application\chrome.exe`. Em outro sistema, ajuste a variável `CHROME` nos scripts.

- `bash tools/run-tests.sh`: suíte principal (`tests/index.html`), com unidades e integração via iframe. Sucesso = `RESULT: N passed, 0 failed`.
- `bash tools/run-update-tests.sh`: testa a atualização do app instalado (service worker). Sobe um servidor local em PowerShell (`tools/serve.ps1`, porta 8765). Rode sempre que mexer em `sw.js` ou na parte de atualização do `app.js`.
- Arquivos de teste novos precisam de um `<script>` em `tests/index.html`.
- Mantenha tudo o que os testes criam dentro da pasta do projeto (perfis do Chrome e resultados já estão no `.gitignore`).
- `tools/make-icons.sh` regera os ícones a partir de `tools/icon.html`.

## Publicar

1. Rode os dois scripts de teste.
2. Confira que `CACHE` foi aumentado, se a regra 1 se aplicar.
3. Faça commit e `git push` na `main`. O GitHub Pages publica em 1 ou 2 minutos.
4. No celular, a versão nova entra sozinha ao abrir o app com internet. Se houver fotos na tela, ela espera até o usuário tocar em "Novo PDF".

Design e plano originais: `docs/superpowers/specs/` e `docs/superpowers/plans/`.
