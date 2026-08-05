const DB_NAME = 'reloj-checador-db';
const STORE_NAME = 'keyval';

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(type, callback) {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, type);
  const store = transaction.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    callback(store, resolve, reject);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

export function get(key) {
  return withStore('readonly', (store, resolve) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
  });
}

export function set(key, value) {
  return withStore('readwrite', (store, resolve) => {
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
  });
}

export function del(key) {
  return withStore('readwrite', (store, resolve) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve();
  });
}