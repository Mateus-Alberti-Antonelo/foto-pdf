// Gera um PNG w×h (global, usado também por pdf.test.js).
function makePng(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3366cc'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w / 2, h / 2);
  return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
}

test('fit paisagem', () => { const r = App.fitWithin(4000, 3000, 1600); assertEqual(r.width, 1600); assertEqual(r.height, 1200); });
test('fit retrato', () => { const r = App.fitWithin(3000, 4000, 1600); assertEqual(r.width, 1200); assertEqual(r.height, 1600); });
test('fit não amplia', () => { const r = App.fitWithin(1000, 800, 1600); assertEqual(r.width, 1000); assertEqual(r.height, 800); });
test('compress reduz foto grande para JPEG', async () => {
  const p = await App.compressImage(await makePng(4000, 3000));
  assertEqual(p.width, 1600); assertEqual(p.height, 1200);
  assert(p.dataUrl.startsWith('data:image/jpeg'), 'deve ser jpeg');
});
test('compress rejeita não-imagem', async () => {
  assertEqual(typeof App.compressImage, 'function', 'compressImage deve existir');
  let rejected = false;
  try { await App.compressImage(new Blob(['nada'], { type: 'image/jpeg' })); } catch (e) { rejected = !(e instanceof TypeError); }
  assert(rejected, 'deveria rejeitar');
});
