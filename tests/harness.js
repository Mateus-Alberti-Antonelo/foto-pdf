// Mini-harness de testes: test(), assert(), assertEqual(), runTests().
(function () {
  const tests = [];
  window.test = (name, fn) => tests.push({ name, fn });
  window.assert = (cond, msg) => { if (!cond) throw new Error(msg || 'assert falhou'); };
  window.assertEqual = (actual, expected, msg) => {
    if (actual !== expected) {
      throw new Error((msg ? msg + ': ' : '') + 'esperado ' + JSON.stringify(expected) + ', recebido ' + JSON.stringify(actual));
    }
  };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  window.runTests = async () => {
    let passed = 0, failed = 0;
    for (const t of tests) {
      try { await t.fn(); passed++; }
      catch (e) {
        failed++;
        const pre = document.createElement('pre');
        pre.innerHTML = esc('FAIL: ' + t.name + ': ' + (e && e.message ? e.message : e));
        document.body.appendChild(pre);
      }
    }
    const pre = document.createElement('pre');
    pre.textContent = 'RESULT: ' + passed + ' passed, ' + failed + ' failed';
    document.body.appendChild(pre);
  };
})();
