test('com nome', () => assertEqual(App.buildFileName('Lista 3 Cálculo', 'Ana Souza', true), 'Ana Souza - Lista 3 Cálculo.pdf'));
test('sem nome', () => assertEqual(App.buildFileName('Lista 3 Cálculo', 'Ana Souza', false), 'Lista 3 Cálculo.pdf'));
test('nome ligado mas vazio', () => assertEqual(App.buildFileName('Lista 3', '   ', true), 'Lista 3.pdf'));
test('título vazio usa data', () => assertEqual(App.buildFileName('  ', '', false, new Date(2026, 10, 5)), 'Caderno 2026-11-05.pdf'));
test('título vazio com nome', () => assertEqual(App.buildFileName('', 'Ana', true, new Date(2026, 10, 5)), 'Ana - Caderno 2026-11-05.pdf'));
test('caracteres proibidos', () => assertEqual(App.sanitizeFileNamePart('Lista 1/2: "Física"?'), 'Lista 1 2 Física'));
test('nome com proibidos', () => assertEqual(App.buildFileName('Prova', 'Ana<>Souza', true), 'Ana Souza - Prova.pdf'));
test('pontos finais removidos', () => assertEqual(App.sanitizeFileNamePart('Resumo...'), 'Resumo'));
test('limite de tamanho', () => {
  const f = App.buildFileName('x'.repeat(300), '', false);
  assertEqual(f.length, 124); // 120 + ".pdf"
});
test('barra invertida', () => assertEqual(App.sanitizeFileNamePart('Lista 1\\2'), 'Lista 1 2'));
