test('fila roda tarefas em sequência sem perder nenhuma', async () => {
  assertEqual(typeof App.createSerialRunner, 'function', 'createSerialRunner deve existir');
  const run = App.createSerialRunner(); const log = [];
  const task = (id, ms) => () => new Promise((r) => setTimeout(() => { log.push(id); r(); }, ms));
  await Promise.all([run(task('a', 30)), run(task('b', 0))]);
  assertEqual(log.join(), 'a,b');
});
test('fila continua depois de erro', async () => {
  assertEqual(typeof App.createSerialRunner, 'function', 'createSerialRunner deve existir');
  const run = App.createSerialRunner(); const log = [];
  const p1 = run(async () => { throw new Error('x'); });
  const p2 = run(async () => { log.push('ok'); });
  let rejected = false; try { await p1; } catch (e) { rejected = true; }
  await p2;
  assert(rejected, 'primeira deve rejeitar'); assertEqual(log.join(), 'ok');
});
