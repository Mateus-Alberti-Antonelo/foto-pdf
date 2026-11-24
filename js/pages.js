// Lista ordenada das páginas (fotos) do PDF. Índices inválidos são ignorados.
(function (App) {
  App.createPageList = function () {
    let pages = [];
    const valid = (i) => Number.isInteger(i) && i >= 0 && i < pages.length;
    return {
      items: () => pages.slice(),
      count: () => pages.length,
      add(page) { pages.push(page); },
      remove(index) { if (valid(index)) pages.splice(index, 1); },
      move(from, to) {
        if (!valid(from) || !valid(to) || from === to) return;
        const [page] = pages.splice(from, 1);
        pages.splice(to, 0, page);
      },
      clear() { pages = []; },
    };
  };
})(window.App = window.App || {});
