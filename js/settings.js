// Nome do aluno salvo no aparelho.
(function (App) {
  const KEY = 'fotoPdf.nome';
  App.loadName = function () {
    try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; }
  };
  App.saveName = function (name) {
    try { localStorage.setItem(KEY, String(name || '')); } catch (e) { /* armazenamento indisponível */ }
  };
})(window.App = window.App || {});
