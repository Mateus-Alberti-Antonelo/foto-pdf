// Monta o nome do arquivo PDF: "<Título>.pdf" (ou "Caderno AAAA-MM-DD.pdf" sem título).
(function (App) {
  const MAX_BASE_LENGTH = 120;

  App.sanitizeFileNamePart = function (s) {
    return String(s || '')
      .replace(/[\\/:*?"<>|\x00-\x1F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[.\s]+$/, '');
  };

  function isoLocalDate(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  App.buildFileName = function (title, today = new Date()) {
    const base = (App.sanitizeFileNamePart(title) || 'Caderno ' + isoLocalDate(today))
      .slice(0, MAX_BASE_LENGTH)
      .trim();
    return base + '.pdf';
  };
})(window.App = window.App || {});
