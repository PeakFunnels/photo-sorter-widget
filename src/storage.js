// src/storage.js
export async function openHandleDB() {
  const req = indexedDB.open('file-sorter-db', 1);
  return new Promise((resolve, reject) => {
    req.onupgradeneeded = () => req.result.createObjectStore('handles');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLastHandle(handle) {
  const db = await openHandleDB();
  const tx = db.transaction('handles', 'readwrite');
  tx.objectStore('handles').put(handle, 'last');
  return new Promise(res => tx.oncomplete = res);
}

export async function getLastHandle() {
  const db = await openHandleDB();
  return new Promise(resolve => {
    const tx = db.transaction('handles', 'readonly');
    const get = tx.objectStore('handles').get('last');
    get.onsuccess = () => resolve(get.result);
    get.onerror = () => resolve(null);
  });
}