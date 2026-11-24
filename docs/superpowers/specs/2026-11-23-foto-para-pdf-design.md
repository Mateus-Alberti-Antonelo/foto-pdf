# Foto para PDF — design curto

**Data:** 2026-11-23
**Status:** aprovado

> **Mudança em 2026-11-24:** a pedido do usuário, o nome do aluno saiu do app.
> O arquivo é sempre `<Título>.pdf` (ou `Caderno AAAA-MM-DD.pdf` sem título);
> quando um professor pede o nome, o usuário escreve no próprio título.
> Os itens sobre nome abaixo valem só como histórico.

## Intenção
App pessoal, de uso exclusivo do dono, para fotografar páginas do caderno da
faculdade e juntá-las num PDF para enviar aos professores. Alguns professores
exigem o nome do aluno no arquivo, outros não.

## Objetivos
- Tirar fotos com a câmera ou escolher da galeria, várias páginas por PDF.
- Ver miniaturas, reordenar e apagar páginas antes de gerar.
- Campo de título (ex.: "Lista 3 Cálculo").
- Opção "Incluir meu nome" (liga/desliga). O nome é digitado uma vez e fica salvo no aparelho.
  - Ligado: `<Nome> - <Título>.pdf`
  - Desligado: `<Título>.pdf`
- Gerar o PDF no próprio celular e abrir o compartilhamento nativo (WhatsApp, e-mail, Drive…), com opção de só baixar.
- Comprimir as fotos para o PDF ficar com tamanho aceitável para e-mail.
- Instalável na tela inicial (Android e iPhone) e funcionando offline.

## Não-objetivos
- Edição de imagem (recorte, perspectiva, contraste, filtros).
- Nome escrito dentro do PDF (capa ou cabeçalho): o nome vai **só no nome do arquivo**.
- Login, contas, servidor, nuvem, histórico de PDFs.
- Uso por outras pessoas.

## Anti-objetivos
- Ficar complicado de usar ou de manter: o app é uma tela só.
- Enviar fotos para qualquer servidor: tudo fica no celular.

## Abordagens consideradas
1. **HTML único, sem framework, com biblioteca de PDF local (escolhida).** Zero build, fácil de mexer, hospedagem estática gratuita.
2. React/Vite PWA: mesmo resultado, mas com ferramentas e manutenção desnecessárias para uma tela.
3. App nativo: no iPhone exige Mac e reinstalação a cada 7 dias; no Android é trabalho demais para o caso.

## Decisões (do Claude, aceitas pelo usuário)
- PWA: `index.html` + manifest + service worker para instalar e funcionar offline.
- Hospedagem: GitHub Pages (gratuita).
- Geração de PDF no navegador (ex.: jsPDF), com a biblioteca servida junto do app, sem CDN em tempo de execução, para funcionar offline.
- Fotos redimensionadas e recomprimidas em JPEG antes de entrar no PDF.
- Compartilhamento via Web Share API (com arquivo) e download como alternativa.
- Nome salvo em `localStorage`.

## Para quem for construir decidir
- Tamanho máximo e qualidade exatos da compressão.
- Layout da página do PDF (A4 com a foto ajustada, ou página do tamanho da foto).
- Visual da interface (simples, legível no celular, botões grandes).
- Caracteres inválidos em nome de arquivo: tratar.
