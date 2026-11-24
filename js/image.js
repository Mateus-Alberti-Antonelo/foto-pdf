// Reduz e recomprime fotos em JPEG para o PDF não ficar pesado.
(function (App) {
  App.MAX_SIDE = 1600;
  App.JPEG_QUALITY = 0.7;

  App.fitWithin = function (width, height, maxSide) {
    const scale = Math.min(1, maxSide / Math.max(width, height));
    return { width: Math.round(width * scale), height: Math.round(height * scale) };
  };

  function decode(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível ler a imagem')); };
      img.src = url; // o navegador aplica a orientação EXIF
    });
  }

  App.compressImage = async function (file) {
    const img = await decode(file);
    const { width, height } = App.fitWithin(img.naturalWidth, img.naturalHeight, App.MAX_SIDE);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', App.JPEG_QUALITY);
    canvas.width = canvas.height = 0; // libera memória cedo
    return { dataUrl, width, height };
  };
})(window.App = window.App || {});
