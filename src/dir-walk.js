// src/dir-walk.js

/**
 * Walk only the top level of `dir`, collecting file entries.
 * @param {FileSystemDirectoryHandle} dir
 * @returns {Promise<Array<{ name: string, handle: FileSystemFileHandle, date: number }>>}
 */
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

/**
 * Recursively walk `dir` and all subdirectories, collecting file entries.
 * @param {FileSystemDirectoryHandle} dir
 * @param {Array} arr  Accumulator array (for internal use)
 * @returns {Promise<Array<{ name: string, handle: FileSystemFileHandle, date: number }>>}
 */
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
