// Testes de integração: abre index.html num iframe e usa a tela de verdade.
function openApp() {
  return new Promise((resolve) => {
    const f = document.createElement('iframe');
    f.style.cssText = 'width:390px;height:800px';
    f.onload = () => resolve(f.contentWindow);
    f.src = '../index.html';
    document.body.appendChild(f);
  });
}
const waitFor = async (cond, ms = 4000) => {
  const t0 = Date.now();
  while (!cond()) { if (Date.now() - t0 > ms) throw new Error('tempo esgotado'); await new Promise((r) => setTimeout(r, 20)); }
};
async function filesFor(win, count) {
  const dt = new win.DataTransfer();
  for (let i = 0; i < count; i++) dt.items.add(new win.File([await makePng(800, 1000)], "p" + i + ".png", { type: "image/png" }));
  return dt.files;
}
function choose(win, inputId, files) {
  const input = win.document.getElementById(inputId);
  input.files = files;
  input.dispatchEvent(new win.Event("change"));
}
async function pick(win, inputId, count) { choose(win, inputId, await filesFor(win, count)); }

test('fotos escolhidas durante processamento não se perdem', async () => {
  const win = await openApp();
  const many = await filesFor(win, 3), one = await filesFor(win, 1);
  choose(win, "galleryInput", many);
  choose(win, "cameraInput", one); // chega enquanto as 3 primeiras ainda processam
  await waitFor(() => !/Processando/.test(win.document.getElementById("status").textContent) && win.document.querySelectorAll(".page").length > 0);
  await new Promise((r) => setTimeout(r, 300));
  assertEqual(win.document.querySelectorAll('.page').length, 4);
});

test('digitar o título não recria as miniaturas', async () => {
  const win = await openApp();
  await pick(win, 'galleryInput', 2);
  await waitFor(() => win.document.querySelectorAll('.page img').length === 2);
  const before = win.document.querySelector('.page img');
  const title = win.document.getElementById('title');
  title.value = 'Prova'; title.dispatchEvent(new win.Event('input'));
  assert(win.document.querySelector('.page img') === before, 'miniatura foi recriada');
  assert(/Prova\.pdf$/.test(win.document.getElementById('fileName').textContent), 'nome do arquivo não atualizou');
});

test('envio bloqueado por demora: próximo toque envia o mesmo PDF', async () => {
  const win = await openApp();
  await pick(win, 'galleryInput', 1);
  await waitFor(() => win.document.querySelectorAll('.page').length === 1 && !win.document.getElementById('send').disabled);
  const calls = [];
  Object.defineProperty(win.navigator, 'canShare', { configurable: true, value: () => true });
  Object.defineProperty(win.navigator, 'share', { configurable: true, value: async (data) => {
    calls.push(data.files[0]);
    if (calls.length === 1) throw new win.DOMException('x', 'NotAllowedError');
  } });
  win.document.getElementById('send').click();
  await waitFor(() => /toque em Enviar/.test(win.document.getElementById('status').textContent));
  win.document.getElementById('send').click();
  await waitFor(() => /PDF enviado/.test(win.document.getElementById('status').textContent));
  assertEqual(calls.length, 2);
  assert(calls[1].size > 0 && calls[1].name === calls[0].name, 'segundo envio deve usar o PDF pronto');
});
