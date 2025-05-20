// src/main.js

import { getLastHandle, saveLastHandle } from './storage.js';
import { walkRoot, walkRecursive } from './dir-walk.js';
import { initObserver, resetGrid, loadMore, generateThumb } from './grid-renderer.js';
import { loadAlbums, renderAlbums } from './sidebar.js';
import { showMetadata } from './metadata.js';

// DOM refs
const pickBtn     = document.getElementById('pickBtn');
const refreshBtn  = document.getElementById('refreshBtn');
const searchInput = document.getElementById('searchInput');
const mediaFilter = document.getElementById('mediaFilter');
const sortSelect  = document.getElementById('sortSelect');
const includeSub  = document.getElementById('includeSub');
const thumbGrid   = document.getElementById('thumbGrid');
const tree        = document.getElementById('tree');
const addAlbum    = document.getElementById('addCat');
const navRoot     = document.querySelector('.nav-item[data-type="root"]');
const breadcrumb  = document.getElementById('breadcrumb');
const metaModal   = document.getElementById('metaModal');
const metaClose   = metaModal.querySelector('.close');

let rootDir, currentHandle, allFiles = [], selected = new Set();

// 1) Lazy-load observer
initObserver(thumbGrid, generateThumb);

// 2) Infinite scroll
thumbGrid.addEventListener('scroll', () => {
  if (thumbGrid.scrollTop + thumbGrid.clientHeight >= thumbGrid.scrollHeight - 100) {
    loadMore(thumbGrid);
  }
});

// 3) Active nav highlight
function setActiveNav(el) {
  document.querySelectorAll('.nav-item, .group').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
}

// 4) Breadcrumb
function updateBreadcrumb(cat, grp) {
  breadcrumb.textContent = !cat
    ? 'Home'
    : !grp
      ? `Home / ${cat}`
      : `Home / ${cat} / ${grp}`;
}

// 5) Load files
async function loadRootFiles() {
  allFiles = includeSub.checked
    ? await walkRecursive(currentHandle)
    : await walkRoot(currentHandle);

  resetGrid(
    thumbGrid,
    allFiles,
    searchInput.value,
    mediaFilter.value,
    sortSelect.value
  );
  updateBreadcrumb();
  refreshBtn.disabled = false;
}

// 6) Sidebar init
async function initSidebar() {
  const albums = await loadAlbums(rootDir);
  renderAlbums(tree, albums,
    // onGroupClick with reliable clickedElement
    async (albumHandle, groupName, clickedEl) => {
      setActiveNav(clickedEl);
      currentHandle = await albumHandle.getDirectoryHandle(groupName);
      updateBreadcrumb(albumHandle.name, groupName);
      await loadRootFiles();
    },
    // onGroupDrop reading text/plain
    async (eventOrSignal, albumHandle, groupName) => {
      if (eventOrSignal === 'reload') {
        return await initSidebar();
      }
      const raw = eventOrSignal.dataTransfer.getData('text/plain');
      if (!raw) return;
      const names = JSON.parse(raw);
      let moved = 0, failed = 0;
      for (const nm of names) {
        try {
          const ent = allFiles.find(f => f.name === nm);
          const blob = await ent.handle.getFile();
          const tgt = await albumHandle.getDirectoryHandle(groupName, { create: true });
          const fileH = await tgt.getFileHandle(nm, { create: true });
          const w = await fileH.createWritable();
          await w.write(blob); await w.close();
          await currentHandle.removeEntry(nm);
          moved++;
        } catch {
          failed++;
        }
      }
      alert(`Moved ${moved} file${moved !== 1 ? 's' : ''}${failed ? `, ${failed} failed` : ''}.`);
      await loadRootFiles();
    }
  );
}

// 7) Pick folder
pickBtn.onclick = async () => {
  rootDir = await window.showDirectoryPicker();
  await saveLastHandle(rootDir);
  currentHandle = rootDir;
  await loadRootFiles();
  await initSidebar();
  setActiveNav(navRoot);
};

// 8) Add album
addAlbum.onclick = async () => {
  const nm = prompt('New Album:');
  if (!nm) return;
  await rootDir.getDirectoryHandle(nm, { create: true });
  await initSidebar();
};

// 9) Filters
refreshBtn.onclick = loadRootFiles;
searchInput.oninput   = loadRootFiles;
mediaFilter.onchange  = loadRootFiles;
sortSelect.onchange   = loadRootFiles;
includeSub.onchange   = loadRootFiles;

// 10) Metadata delegate
thumbGrid.addEventListener('click', e => {
  if (e.target.matches('.thumb .actions button[title="Metadata"]')) {
    const cell = e.target.closest('.thumb');
    const entry = allFiles.find(f => f.name === cell._filename);
    showMetadata(entry, metaModal);
  }
});

// 11) Close modal
metaClose.onclick = () => metaModal.style.display = 'none';

// 12) On load
window.addEventListener('load', async () => {
  const last = await getLastHandle();
  rootDir = last || await window.showDirectoryPicker({ startIn: 'downloads' });
  if (!last) await saveLastHandle(rootDir);
  currentHandle = rootDir;

  await loadRootFiles();
  await initSidebar();
  setActiveNav(navRoot);
});
