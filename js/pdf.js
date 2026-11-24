// Monta o PDF: uma página A4 por foto, centralizada, margem de 10 mm.
(function (App) {
  const A4 = { short: 210, long: 297 };
  const MARGIN = 10;

  App.pageLayout = function (imgWidth, imgHeight) {
    const orientation = imgWidth > imgHeight ? 'l' : 'p';
    const pageW = orientation === 'l' ? A4.long : A4.short;
    const pageH = orientation === 'l' ? A4.short : A4.long;
    const scale = Math.min((pageW - 2 * MARGIN) / imgWidth, (pageH - 2 * MARGIN) / imgHeight);
    const w = imgWidth * scale;
    const h = imgHeight * scale;
    return { orientation, x: (pageW - w) / 2, y: (pageH - h) / 2, w, h };
  };

  App.buildPdf = function (pages) {
    if (!pages || pages.length === 0) throw new Error('Adicione pelo menos uma foto');
    let doc = null;
    pages.forEach((page) => {
      const L = App.pageLayout(page.width, page.height);
      if (doc) doc.addPage('a4', L.orientation);
      else doc = new window.jspdf.jsPDF({ orientation: L.orientation, unit: 'mm', format: 'a4' });
      doc.addImage(page.dataUrl, 'JPEG', L.x, L.y, L.w, L.h);
    });
    return doc.output('blob');
  };
})(window.App = window.App || {});
