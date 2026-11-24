// Executa sw.js com self/caches falsos para ver o que o install guarda.
function loadText(url) {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest(); x.open('GET', url);
    x.onload = () => resolve(x.responseText); x.onerror = () => reject(new Error('não leu ' + url)); x.send();
  });
}
test('install busca arquivos ignorando o cache HTTP', async () => {
  const src = await loadText('../sw.js');
  const handlers = {}; let added = null;
  const fakeSelf = { addEventListener: (t, h) => { handlers[t] = h; }, skipWaiting: () => {}, clients: { claim: () => {} } };
  const fakeCaches = { open: async () => ({ addAll: async (reqs) => { added = reqs; } }) };
  new Function('self', 'caches', src)(fakeSelf, fakeCaches);
  let waited = null;
  handlers.install({ waitUntil: (p) => { waited = p; } });
  await waited;
  assert(Array.isArray(added) && added.length > 0, 'addAll não chamado');
  added.forEach((r) => assert(r instanceof Request && r.cache === 'reload', 'sem cache reload: ' + (r.url || r)));
});
