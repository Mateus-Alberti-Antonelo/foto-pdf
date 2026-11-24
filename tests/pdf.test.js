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
test('pdf vazio lança erro', () => {
  assertEqual(typeof App.buildPdf, 'function', 'buildPdf deve existir');
  let threw = false; try { App.buildPdf([]); } catch (e) { threw = true; } assert(threw);
});
