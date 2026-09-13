(function (root) {
  "use strict";
  const C =
    typeof module !== "undefined" && module.exports
      ? require("./content/catalog.js")
      : root.LB.Content;
  const D =
    typeof module !== "undefined" && module.exports
      ? require("./domain/game.js")
      : root.LB.Domain;
  const api = { ...C, ...D };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Bureaucracy = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
