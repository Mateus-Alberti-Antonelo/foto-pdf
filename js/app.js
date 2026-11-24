// Liga a interface às funções de App.*
(function (App) {
  const $ = (id) => document.getElementById(id);
  const el = {
    camera: $('cameraInput'), gallery: $('galleryInput'), pages: $('pages'), empty: $('empty'),
    title: $('title'), fileName: $('fileName'), status: $('status'), send: $('send'), download: $('download'), newPdf: $('newPdf'),
  };
  const pageList = App.createPageList();
  const enqueue = App.createSerialRunner();
  let processing = 0; // lotes de fotos na fila
  let delivering = false;
  let readyPdf = null; // { blob, fileName } quando o envio pediu um toque novo

  const busy = () => processing > 0 || delivering;

  function setStatus(text, isError) {
    el.status.textContent = text || '';
    el.status.classList.toggle('error', !!isError);
  }

  function currentFileName() {
    return App.buildFileName(el.title.value);
  }

  function toolButton(label, ariaLabel, className, onClick, disabled) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.setAttribute('aria-label', ariaLabel);
    if (className) b.className = className;
    b.disabled = !!disabled;
    b.addEventListener('click', onClick);
    return b;
  }

  function changePages(fn) {
    fn();
    readyPdf = null; // as páginas mudaram: o PDF pronto não vale mais
    renderPages();
  }

  function renderPage(page, i, total) {
    const li = document.createElement('li');
    li.className = 'page';
    const num = document.createElement('span');
    num.className = 'page-number';
    num.textContent = String(i + 1);
    const img = document.createElement('img');
    img.src = page.dataUrl;
    img.alt = 'Página ' + (i + 1);
    const tools = document.createElement('div');
    tools.className = 'page-tools';
    tools.append(
      toolButton('◀', 'Mover página ' + (i + 1) + ' para antes', '', () => changePages(() => pageList.move(i, i - 1)), busy() || i === 0),
      toolButton('▶', 'Mover página ' + (i + 1) + ' para depois', '', () => changePages(() => pageList.move(i, i + 1)), busy() || i === total - 1),
      toolButton('✕', 'Apagar página ' + (i + 1), 'remove', () => changePages(() => pageList.remove(i)), busy()),
    );
    li.append(num, img, tools);
    return li;
  }

  // Recria as miniaturas: só quando a lista de páginas ou o estado ocupado muda.
  function renderPages() {
    const items = pageList.items();
    el.pages.replaceChildren(...items.map((page, i) => renderPage(page, i, items.length)));
    el.empty.hidden = items.length > 0;
    renderControls();
  }

  // Atualiza o que muda ao digitar, sem tocar nas miniaturas.
  function renderControls() {
    el.fileName.textContent = currentFileName();
    const disabled = busy() || pageList.count() === 0;
    el.send.disabled = disabled;
    el.download.disabled = disabled;
  }

  async function processFiles(files) {
    let failed = 0;
    for (let i = 0; i < files.length; i++) {
      setStatus('Processando ' + (i + 1) + ' de ' + files.length + '…');
      try {
        const page = await App.compressImage(files[i]);
        changePages(() => pageList.add(page));
      } catch (e) {
        failed++;
      }
    }
    if (failed === 1) setStatus('1 arquivo não pôde ser lido e foi ignorado.', true);
    else if (failed > 1) setStatus(failed + ' arquivos não puderam ser lidos e foram ignorados.', true);
    else if (processing === 1) setStatus('');
  }

  function addFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return Promise.resolve();
    processing++;
    renderPages();
    return enqueue(() => processFiles(files)).finally(() => {
      processing--;
      renderPages();
    });
  }

  async function deliver(mode) {
    if (busy() || pageList.count() === 0) return;
    delivering = true;
    renderPages();
    const fileName = currentFileName();
    try {
      let blob;
      if (readyPdf && readyPdf.fileName === fileName) {
        blob = readyPdf.blob; // toque novo: envia na hora, sem gerar de novo
      } else {
        setStatus('Gerando PDF…');
        blob = App.buildPdf(pageList.items());
      }
      readyPdf = null;
      if (mode === 'download') {
        App.downloadPdf(blob, fileName);
        setStatus('PDF baixado: ' + fileName);
      } else {
        const result = await App.sharePdf(blob, fileName);
        if (result === 'shared') setStatus('PDF enviado: ' + fileName);
        else if (result === 'downloaded') setStatus('Este aparelho não permite enviar direto. PDF baixado: ' + fileName);
        else if (result === 'needs-tap') {
          readyPdf = { blob, fileName };
          setStatus('PDF pronto. Agora toque em Enviar PDF.');
        } else setStatus('');
      }
    } catch (e) {
      setStatus('Não foi possível gerar o PDF. Tente com menos fotos.', true);
    } finally {
      delivering = false;
      renderPages();
    }
  }

  el.camera.addEventListener('change', () => { const f = Array.from(el.camera.files); el.camera.value = ''; addFiles(f); });
  el.gallery.addEventListener('change', () => { const f = Array.from(el.gallery.files); el.gallery.value = ''; addFiles(f); });
  el.title.addEventListener('input', renderControls);
  el.send.addEventListener('click', () => deliver('share'));
  el.download.addEventListener('click', () => deliver('download'));
  el.newPdf.addEventListener('click', () => {
    if (busy()) return;
    if (pageList.count() > 0 && !confirm('Começar um PDF novo? As fotos atuais serão descartadas.')) return;
    changePages(() => pageList.clear());
    el.title.value = '';
    setStatus('');
    renderControls();
    applyUpdateIfIdle();
  });

  renderPages();

  // Versão nova do app: recarrega sozinho, mas nunca no meio de um PDF (perderia as fotos).
  let updateReady = false;
  function applyUpdateIfIdle() {
    if (!updateReady || busy() || pageList.count() > 0) return;
    location.reload();
  }

  // Funcionar offline (https ou localhost; em file:// o navegador não permite).
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    let hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) { hadController = true; return; } // primeira instalação: a tela já é a atual
      updateReady = true;
      if (busy() || pageList.count() > 0) setStatus('Atualização baixada. Ela entra quando você tocar em Novo PDF.');
      applyUpdateIfIdle();
    });
    navigator.serviceWorker.register('sw.js').then((reg) => {
      // No celular, "fechar" o app costuma só pausar: procura versão nova toda vez que ele volta à tela.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    }).catch(() => { /* app segue funcionando online */ });
  }
})(window.App = window.App || {});
