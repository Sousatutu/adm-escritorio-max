(function (root) {
  "use strict";
  const escape = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  function create() {
    const el = document.getElementById("modal"),
      content = document.getElementById("modal-content"),
      closeButton = document.getElementById("close-modal");
    let locked = false,
      previous = null,
      onClose = null;
    function close() {
      if (locked) return;
      el.close();
      if (onClose) onClose();
      const focus = previous?.isConnected
        ? previous
        : document.getElementById("office");
      focus?.focus({ preventScroll: true });
    }
    closeButton.onclick = close;
    el.addEventListener("cancel", (e) => {
      e.preventDefault();
      close();
    });
    return {
      get open() {
        return el.open;
      },
      content,
      close,
      show(kicker, title, html, options = {}) {
        if (!el.open) previous = document.activeElement;
        locked = !!options.locked;
        onClose = options.onClose || null;
        closeButton.hidden = locked;
        el.classList.toggle("wide", !!options.wide);
        document.getElementById("modal-kicker").textContent = kicker;
        document.getElementById("modal-title").textContent = title;
        content.innerHTML = html;
        if (!el.open) el.showModal();
        const auto = content.querySelector("[autofocus]");
        if (auto) {
          auto.focus({ preventScroll: true });
        } else {
          el.focus({ preventScroll: true });
        }
      },
      bind(id, fn) {
        const button = document.getElementById(id);
        if (button) button.onclick = fn;
      },
    };
  }
  root.LB.UI = { escape, dialog: create };
})(globalThis);
