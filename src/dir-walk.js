// src/dir-walk.js
export async function walkRoot(dir) {
  const arr = [];
  for await (let [name, handle] of dir) {
    if (handle.kind === 'file') {
      const file = await handle.getFile();
      arr.push({ name, handle, date: file.lastModified });
    }
  }
  return arr;
}

export async function walkRecursive(dir, arr = []) {
  for await (let [name, handle] of dir) {
    if (handle.kind === 'file') {
      const file = await handle.getFile();
      arr.push({ name, handle, date: file.lastModified });
    } else if (handle.kind === 'directory') {
      await walkRecursive(handle, arr);
    }
  }
  return arr;
}