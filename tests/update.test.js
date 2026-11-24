// Atualização do app instalado: versão nova do sw.js publicada enquanto o app está aberto.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(cond, label, ms = 12000) {
  const t0 = Date.now();
  while (!cond()) { if (Date.now() - t0 > ms) throw new Error("tempo esgotado: " + label); await sleep(50); }
}
function openAppFrame() {
  return new Promise((resolve) => {
    const f = document.createElement('iframe');
    f.style.cssText = 'width:390px;height:700px';
    f.onload = () => resolve(f);
    f.src = '/index.html';
    document.body.appendChild(f);
  });
}
// Publica uma "versão nova" e faz o app perceber como faria ao voltar para a tela.
async function publishNewVersion(win) {
  await fetch('/__bump');
  win.document.dispatchEvent(new win.Event('visibilitychange'));
}
async function ready(f) {
  await until(() => f.contentWindow.navigator.serviceWorker && f.contentWindow.navigator.serviceWorker.controller, "service worker controlando a página");
}

test('app vazio: versão nova aparece sozinha, sem fechar e abrir', async () => {
  const f = await openAppFrame();
  await ready(f);
  f.contentWindow.__versaoAntiga = true;
  await publishNewVersion(f.contentWindow);
  await until(() => f.contentWindow.__versaoAntiga !== true && f.contentWindow.document.readyState === 'complete', "recarregar sozinho");
  f.remove();
});

test('com fotos na tela: não recarrega e avisa', async () => {
  const f = await openAppFrame();
  await ready(f);
  const win = f.contentWindow;
  const dt = new win.DataTransfer();
  dt.items.add(new win.File([await makePng(800, 1000)], 'p.png', { type: 'image/png' }));
  const input = win.document.getElementById('galleryInput');
  input.files = dt.files;
  input.dispatchEvent(new win.Event('change'));
  await until(() => win.document.querySelectorAll(".page").length === 1, "foto adicionada");
  win.__versaoAntiga = true;
  let changed = false;
  win.navigator.serviceWorker.addEventListener('controllerchange', () => { changed = true; });
  await publishNewVersion(win);
  await until(() => changed, "nova versão assumir");
  await sleep(500);
  assert(f.contentWindow.__versaoAntiga === true, 'recarregou e perdeu as fotos');
  assert(/atualização/i.test(win.document.getElementById('status').textContent), 'deveria avisar da atualização');
});
