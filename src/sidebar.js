// src/sidebar.js

/**
 * Scan the root directory for albums and their sub-groups.
 */
export async function loadAlbums(rootDir) {
  const albums = [];
  for await (let [name, handle] of rootDir) {
    if (handle.kind === 'directory') {
      const groups = [];
      for await (let [gName, gHandle] of handle) {
        if (gHandle.kind === 'directory') groups.push(gName);
      }
      albums.push({ name, handle, groups });
    }
  }
  return albums;
}

/**
 * Render albums & groups into the sidebar.
 * onGroupClick(albumHandle, groupName, clickedElement)
 * onGroupDrop(event, albumHandle, groupName)
 */
export function renderAlbums(container, albums, onGroupClick, onGroupDrop) {
  container.innerHTML = '';
  albums.forEach(album => {
    const cat = document.createElement('div');
    cat.className = 'category';

    const hdr = document.createElement('div');
    hdr.className = 'cat-header';
    hdr.textContent = album.name;
    const add = document.createElement('button');
    add.textContent = '➕';
    add.onclick = async () => {
      const nm = prompt('New Group:');
      if (!nm) return;
      await album.handle.getDirectoryHandle(nm, { create: true });
      onGroupDrop('reload');
    };
    hdr.appendChild(add);
    cat.appendChild(hdr);

    album.groups.forEach(grpName => {
      const grp = document.createElement('div');
      grp.className = 'group';
      grp.textContent = grpName;

      // when clicked, pass itself as clickedElement
      grp.onclick = () => onGroupClick(album.handle, grpName, grp);

      grp.addEventListener('dragover', e => {
        e.preventDefault(); grp.classList.add('dragover');
      });
      grp.addEventListener('dragleave', () => grp.classList.remove('dragover'));
      grp.addEventListener('drop', e => {
        e.preventDefault(); grp.classList.remove('dragover');
        onGroupDrop(e, album.handle, grpName);
      });

      cat.appendChild(grp);
    });

    container.appendChild(cat);
  });
}
