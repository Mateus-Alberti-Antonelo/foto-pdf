const pdfBlob = () => new Blob(['%PDF-1.3'], { type: 'application/pdf' });
function fakeDoc() {
  const d = { clicks: 0, lastDownload: null, body: { appendChild() {}, removeChild() {} } };
  d.createElement = () => ({ style: {}, click() { d.clicks++; d.lastDownload = this.download; } });
  return d;
}

test('compartilha quando suportado', async () => { const nav = { canShare: () => true, share: async () => {} }; assertEqual(await App.sharePdf(pdfBlob(), 'a.pdf', nav, fakeDoc()), 'shared'); });
test('cancelado não baixa', async () => { const d = fakeDoc(); const nav = { canShare: () => true, share: async () => { throw new DOMException('x', 'AbortError'); } }; assertEqual(await App.sharePdf(pdfBlob(), 'a.pdf', nav, d), 'cancelled'); assertEqual(d.clicks, 0); });
test('sem suporte baixa', async () => { const d = fakeDoc(); assertEqual(await App.sharePdf(pdfBlob(), 'a.pdf', {}, d), 'downloaded'); assertEqual(d.clicks, 1); assertEqual(d.lastDownload, 'a.pdf'); });
test('erro no share baixa', async () => { const d = fakeDoc(); const nav = { canShare: () => true, share: async () => { throw new Error('falhou'); } }; assertEqual(await App.sharePdf(pdfBlob(), 'a.pdf', nav, d), 'downloaded'); });
test('nome salvo', () => { App.saveName('Ana'); assertEqual(App.loadName(), 'Ana'); localStorage.removeItem('fotoPdf.nome'); assertEqual(App.loadName(), ''); });
