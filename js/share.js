// Entrega o PDF: compartilhamento nativo quando houver; senão, download.
(function (App) {
  App.downloadPdf = function (blob, fileName, doc = document) {
    const url = URL.createObjectURL(blob);
    const a = doc.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    doc.body.appendChild(a);
    a.click();
    doc.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  App.sharePdf = async function (blob, fileName, nav = navigator, doc = document) {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: fileName });
        return 'shared';
      } catch (e) {
        if (e && e.name === 'AbortError') return 'cancelled';
        // Demorou demais desde o toque: o navegador exige um toque novo.
        if (e && e.name === 'NotAllowedError') return 'needs-tap';
      }
    }
    App.downloadPdf(blob, fileName, doc);
    return 'downloaded';
  };
})(window.App = window.App || {});
