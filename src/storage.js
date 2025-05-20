// src/storage.js

/**
 * Open (or create) the IndexedDB database and object store.
 * @returns {Promise<IDBDatabase>}
 */
export async function openHandleDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('file-sorter-db', 1);
    req.onupgradeneeded = () => {
      // Create an object store named "handles"
      req.result.createObjectStore('handles');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Save the last-picked directory handle under key "last".
 * @param {FileSystemDirectoryHandle} handle
 * @returns {Promise<void>}
 */
export async function saveLastHandle(handle) {
  const db = await openHandleDB();
  const tx = db.transaction('handles', 'readwrite');
  tx.objectStore('handles').put(handle, 'last');
  return new Promise(resolve => {
    tx.oncomplete = resolve;
  });
}

/**
 * Retrieve the last-picked directory handle, or null if none.
 * @returns {Promise<FileSystemDirectoryHandle|null>}
 */
export async function getLastHandle() {
  const db = await openHandleDB();
  const tx = db.transaction('handles', 'readonly');
  return new Promise(resolve => {
    const req = tx.objectStore('handles').get('last');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}
