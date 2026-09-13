"use strict";
LB.App.boot().catch((error) => {
  console.error("Falha ao iniciar o expediente:", error);
  document.getElementById("load-status").textContent =
    "Não foi possível iniciar. Confira se todas as pastas do projeto foram copiadas junto com index.html.";
});
