(function (root) {
  "use strict";
  const KEY = "labirinto-burocratico-v3",
    OLD = "labirinto-burocratico-v1";
  function create(options = {}) {
    let storage = null,
      indexedDB = null;
    try {
      storage = Object.hasOwn(options, "storage")
        ? options.storage
        : root.localStorage;
    } catch {}
    try {
      indexedDB = Object.hasOwn(options, "indexedDB")
        ? options.indexedDB
        : root.indexedDB;
    } catch {}
    let database = null,
      openPromise = null,
      queue = Promise.resolve();
    function open() {
      if (openPromise) return openPromise;
      openPromise = new Promise((resolve) => {
        if (!indexedDB) return resolve(null);
        let request;
        try {
          request = indexedDB.open("labirinto-burocratico", 1);
        } catch {
          return resolve(null);
        }
        request.onupgradeneeded = () =>
          request.result.createObjectStore("saves");
        request.onsuccess = () => {
          database = request.result;
          resolve(database);
        };
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      });
      return openPromise;
    }
    async function idbRead() {
      const db = await open();
      if (!db) return null;
      return new Promise((resolve) => {
        try {
          const request = db
            .transaction("saves")
            .objectStore("saves")
            .get("current");
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    }
    async function load() {
      let local = null,
        legacy = null;
      try {
        local = JSON.parse(storage?.getItem(KEY) || "null");
      } catch {}
      try {
        legacy = JSON.parse(storage?.getItem(OLD) || "null");
      } catch {}
      const remote = await idbRead();
      const candidates = [local, remote]
        .filter((x) => x && x.state && Number.isFinite(x.savedAt))
        .sort((a, b) => b.savedAt - a.savedAt);
      return { candidates, legacy };
    }
    function save(envelope) {
      const snapshot = JSON.parse(JSON.stringify(envelope));
      const task = queue.then(async () => {
        let localOK = false,
          idbOK = false;
        try {
          storage?.setItem(KEY, JSON.stringify(snapshot));
          localOK = !!storage;
        } catch {}
        const db = await open();
        if (db)
          idbOK = await new Promise((resolve) => {
            try {
              const tx = db.transaction("saves", "readwrite");
              tx.objectStore("saves").put(snapshot, "current");
              tx.oncomplete = () => resolve(true);
              tx.onerror = () => resolve(false);
              tx.onabort = () => resolve(false);
            } catch {
              resolve(false);
            }
          });
        return {
          ok: localOK || idbOK,
          backend: idbOK ? "IndexedDB" : localOK ? "local" : "memory",
        };
      });
      queue = task.catch(() => {});
      return task;
    }
    function quickSave(envelope) {
      try {
        storage?.setItem(KEY, JSON.stringify(envelope));
        return !!storage;
      } catch {
        return false;
      }
    }
    return { load, save, quickSave, flush: () => queue, key: KEY };
  }
  const api = { create, KEY, OLD };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else (root.LB ||= {}).Storage = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
