// src/sidebar.js

/**
 * Scan the root directory for “Albums” (directories) and their sub-“Groups”.
 * @param {FileSystemDirectoryHandle} rootDir
 * @returns {Promise<Array<{ name: string, handle: FileSystemDirectoryHandle, groups: string[] }>>}
 */
export async function loadAlbums(rootDir) {
  const albums = [];
  for await (let [name, handle] of rootDir) {
    if (handle.kind === 'directory') {
      // For each album, collect its group names (subdirectories only)
      const groups = [];
      for await (let [gName, gHandle] of handle) {
        if (gHandle.kind === 'directory') {
          groups.push(gName);
        }
      }
      albums.push({ name, handle, groups });
    }
  }
  return albums;
}

/**
 * Render the albums/categories and their groups into the sidebar container.
 * @param {HTMLElement} treeContainer  The <div id="tree"> element.
 * @param {Array} albumsData           The array returned from loadAlbums().
 * @param {Function} onGroupClick      Callback(groupName, albumHandle, groupName) for navigation clicks.
 * @param {Function} onGroupDrop       Callback(event, albumHandle, groupName) for dropped files.
 */
export function renderAlbums(treeContainer, albumsData, onGroupClick, onGroupDrop) {
  treeContainer.innerHTML = '';
  albumsData.forEach(album => {
    // Category wrapper
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category';

    // Header with album name + “+” button
    const header = document.createElement('div');
    header.className = 'cat-header';
    header.textContent = album.name;
    const addBtn = document.createElement('button');
    addBtn.textContent = '➕';
    addBtn.addEventListener('click', async () => {
      const newGroup = prompt('New Group:');
      if (!newGroup) return;
      await album.handle.getDirectoryHandle(newGroup, { create: true });
      onGroupDrop('reload');  // signal to reload albums
    });
    header.appendChild(addBtn);
    categoryDiv.appendChild(header);

    // Each group listing
    album.groups.forEach(groupName => {
      const grpDiv = document.createElement('div');
      grpDiv.className = 'group';
      grpDiv.textContent = groupName;

      // Navigation click
      grpDiv.addEventListener('click', () => {
        onGroupClick(album.handle, groupName);
      });

      // Drag-over styling
      grpDiv.addEventListener('dragover', e => {
        e.preventDefault();
        grpDiv.classList.add('dragover');
      });
      grpDiv.addEventListener('dragleave', () => {
        grpDiv.classList.remove('dragover');
      });

      // Drop handling: move selected files into this group
      grpDiv.addEventListener('drop', e => {
        e.preventDefault();
        grpDiv.classList.remove('dragover');
        onGroupDrop(e, album.handle, groupName);
      });

      categoryDiv.appendChild(grpDiv);
    });

    treeContainer.appendChild(categoryDiv);
  });
}
