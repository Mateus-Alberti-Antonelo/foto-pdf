test('nome do arquivo é só o título', () => assertEqual(App.buildFileName('Lista 3 Cálculo'), 'Lista 3 Cálculo.pdf'));
test('título vazio usa data', () => assertEqual(App.buildFileName('  ', new Date(2026, 10, 5)), 'Caderno 2026-11-05.pdf'));
test('caracteres proibidos', () => assertEqual(App.sanitizeFileNamePart('Lista 1/2: "Física"?'), 'Lista 1 2 Física'));
test('caracteres proibidos no título', () => assertEqual(App.buildFileName('Mateus<>Prova'), 'Mateus Prova.pdf'));
test('pontos finais removidos', () => assertEqual(App.sanitizeFileNamePart('Resumo...'), 'Resumo'));
test('limite de tamanho', () => {
  const f = App.buildFileName('x'.repeat(300));
  assertEqual(f.length, 124); // 120 + ".pdf"
});
test('barra invertida', () => assertEqual(App.sanitizeFileNamePart('Lista 1\\2'), 'Lista 1 2'));
