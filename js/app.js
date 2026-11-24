// Liga a interface às funções de App.*
(function (App) {
  const $ = (id) => document.getElementById(id);
  const el = {
    camera: $('cameraInput'), gallery: $('galleryInput'), pages: $('pages'), empty: $('empty'),
    title: $('title'), includeName: $('includeName'), name: $('name'), nameField: $('nameField'),
    fileName: $('fileName'), status: $('status'), send: $('send'), download: $('download'), newPdf: $('newPdf'),
  };
  const pageList = App.createPageList();
  let busy = false;

  function setStatus(text, isError) {
    el.status.textContent = text || '';
    el.status.classList.toggle('error', !!isError);
  }

  function currentFileName() {
    return App.buildFileName(el.title.value, el.name.value, el.includeName.checked);
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
      toolButton('◀', 'Mover página ' + (i + 1) + ' para antes', '', () => { pageList.move(i, i - 1); render(); }, busy || i === 0),
      toolButton('▶', 'Mover página ' + (i + 1) + ' para depois', '', () => { pageList.move(i, i + 1); render(); }, busy || i === total - 1),
      toolButton('✕', 'Apagar página ' + (i + 1), 'remove', () => { pageList.remove(i); render(); }, busy),
    );
    li.append(num, img, tools);
    return li;
  }

  function render() {
    const items = pageList.items();
    el.pages.replaceChildren(...items.map((page, i) => renderPage(page, i, items.length)));
    el.empty.hidden = items.length > 0;
    el.nameField.hidden = !el.includeName.checked;
    el.fileName.textContent = currentFileName();
    const disabled = busy || items.length === 0;
    el.send.disabled = disabled;
    el.download.disabled = disabled;
  }

  async function addFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0 || busy) return;
    busy = true;
    render();
    let failed = 0;
    for (let i = 0; i < files.length; i++) {
      setStatus('Processando ' + (i + 1) + ' de ' + files.length + '…');
      try {
        pageList.add(await App.compressImage(files[i]));
      } catch (e) {
        failed++;
      }
      render();
    }
    busy = false;
    if (failed === 1) setStatus('1 arquivo não pôde ser lido e foi ignorado.', true);
    else if (failed > 1) setStatus(failed + ' arquivos não puderam ser lidos e foram ignorados.', true);
    else setStatus('');
    render();
  }

  async function deliver(mode) {
    if (busy || pageList.count() === 0) return;
    busy = true;
    render();
    setStatus('Gerando PDF…');
    try {
      const fileName = currentFileName();
      const blob = App.buildPdf(pageList.items());
      if (mode === 'download') {
        App.downloadPdf(blob, fileName);
        setStatus('PDF baixado: ' + fileName);
      } else {
        const result = await App.sharePdf(blob, fileName);
        if (result === 'shared') setStatus('PDF enviado: ' + fileName);
        else if (result === 'downloaded') setStatus('Este aparelho não permite enviar direto. PDF baixado: ' + fileName);
        else setStatus('');
      }
    } catch (e) {
      setStatus('Não foi possível gerar o PDF. Tente com menos fotos.', true);
    } finally {
      busy = false;
      render();
    }
  }

  el.camera.addEventListener('change', () => { const f = el.camera.files; addFiles(f).finally(() => { el.camera.value = ''; }); });
  el.gallery.addEventListener('change', () => { const f = el.gallery.files; addFiles(f).finally(() => { el.gallery.value = ''; }); });
  el.title.addEventListener('input', render);
  el.includeName.addEventListener('change', render);
  el.name.addEventListener('input', () => { App.saveName(el.name.value); render(); });
  el.send.addEventListener('click', () => deliver('share'));
  el.download.addEventListener('click', () => deliver('download'));
  el.newPdf.addEventListener('click', () => {
    if (busy) return;
    if (pageList.count() > 0 && !confirm('Começar um PDF novo? As fotos atuais serão descartadas.')) return;
    pageList.clear();
    el.title.value = '';
    setStatus('');
    render();
  });

  el.name.value = App.loadName();
  render();

  // Funcionar offline (só em https; em file:// o navegador não permite).
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* app segue funcionando online */ });
  }
})(window.App = window.App || {});
