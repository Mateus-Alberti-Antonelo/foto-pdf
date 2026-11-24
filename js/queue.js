// Fila simples: cada tarefa só começa quando a anterior termina (com ou sem erro).
(function (App) {
  App.createSerialRunner = function () {
    let tail = Promise.resolve();
    return function run(task) {
      const result = tail.then(() => task());
      tail = result.catch(() => {});
      return result;
    };
  };
})(window.App = window.App || {});
