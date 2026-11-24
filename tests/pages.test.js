test('add e ordem', () => { const l = App.createPageList(); l.add('a'); l.add('b'); assertEqual(l.items().join(), 'a,b'); });
test('move para o fim', () => { const l = App.createPageList(); ['a','b','c'].forEach(x => l.add(x)); l.move(0, 2); assertEqual(l.items().join(), 'b,c,a'); });
test('move fora do intervalo não faz nada', () => { const l = App.createPageList(); ['a','b'].forEach(x => l.add(x)); l.move(0, -1); l.move(1, 5); assertEqual(l.items().join(), 'a,b'); });
test('remove', () => { const l = App.createPageList(); ['a','b','c'].forEach(x => l.add(x)); l.remove(1); assertEqual(l.items().join(), 'a,c'); assertEqual(l.count(), 2); });
test('items é cópia', () => { const l = App.createPageList(); l.add('a'); l.items().push('z'); assertEqual(l.count(), 1); });
test('clear', () => { const l = App.createPageList(); l.add('a'); l.clear(); assertEqual(l.count(), 0); });
