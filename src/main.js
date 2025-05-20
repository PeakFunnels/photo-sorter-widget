// src/main.js

import { openHandleDB, saveLastHandle, getLastHandle } from './storage.js';
import { walkRoot, walkRecursive } from './dir-walk.js';
import { initObserver, applyFilters, resetGrid, loadMore, generateThumb } from './grid-renderer.js';
import { loadAlbums, renderAlbums } from './sidebar.js';
import { showMetadata } from './metadata.js';
import { IMAGE_EXTS, VIDEO_EXTS } from './utils.js';

// DOM references
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

let rootDir, currentHandle;
let allFiles = [];

// 1) Initialize the lazy-load observer
initObserver(thumbGrid, generateThumb);

// 2) Infinite scroll
thumbGrid.addEventListener('scroll', () => {
  if (thumbGrid.scrollTop + thumbGrid.clientHeight >= thumbGrid.scrollHeight - 100) {
    loadMore(thumbGrid);
  }
});

// 3) Navigation highlight
function setActiveNav(el) {
  document.querySelectorAll('.nav-item, .group').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
}

// 4) Breadcrumb update
function updateBreadcrumb(cat, grp) {
  breadcrumb.textContent = !cat
    ? 'Home'
    : !grp
      ? `Home / ${cat}`
      : `Home / ${cat} / ${grp}`;
}

// 5) Load & render files
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

// 6) Sidebar initializer
async function initSidebar() {
  const albums = await loadAlbums(rootDir);
  renderAlbums(tree, albums,
    // onGroupClick
    async (albumHandle, groupName, navEl) => {
      setActiveNav(navEl);
      currentHandle = await albumHandle.getDirectoryHandle(groupName);
      updateBreadcrumb(albumHandle.name, groupName);
      await loadRootFiles();
    },
    // onGroupDrop
    async (eOrSignal, albumHandle, groupName) => {
      if (eOrSignal === 'reload') {
        await initSidebar();
        return;
      }
      const names = JSON.parse(eOrSignal.dataTransfer.getData('application/json'));
      let moved = 0, failed = 0;
      for (let nm of names) {
        try {
          const entry = allFiles.find(x => x.name === nm);
          const blob = await entry.handle.getFile();
          const targetDir = await albumHandle.getDirectoryHandle(groupName, { create: true });
          const dest = await targetDir.getFileHandle(nm, { create: true });
          const w = await dest.createWritable(); await w.write(blob); await w.close();
          await currentHandle.removeEntry(nm);
          moved++;
        } catch {
          failed++;
        }
      }
      alert(`Moved ${moved} file${moved!==1?'s':''}${failed?`, ${failed} failed`:''}.`);
      await loadRootFiles();
    }
  );
}

// 7) Pick folder
pickBtn.addEventListener('click', async () => {
  rootDir = await window.showDirectoryPicker();
  await saveLastHandle(rootDir);
  currentHandle = rootDir;
  await loadRootFiles();
  await initSidebar();
  setActiveNav(navRoot);
});

// 8) Add album
addAlbum.addEventListener('click', async () => {
  const name = prompt('New Album:');
  if (!name) return;
  await rootDir.getDirectoryHandle(name, { create: true });
  await initSidebar();
});

// 9) Filters & controls
refreshBtn.addEventListener('click', loadRootFiles);
searchInput.addEventListener('input', loadRootFiles);
mediaFilter.addEventListener('change', loadRootFiles);
sortSelect.addEventListener('change', loadRootFiles);
includeSub.addEventListener('change', () => {
  loadRootFiles();
});

// 10) Delegate metadata button clicks
thumbGrid.addEventListener('click', e => {
  if (e.target.matches('.thumb .actions button[title="Metadata"]')) {
    // Find corresponding file entry
    const cell = e.target.closest('.thumb');
    const entry = allFiles.find(f => f.name === cell._filename);
    showMetadata(entry, metaModal);
  }
});

// 11) Close metadata modal
metaClose.addEventListener('click', () => {
  metaModal.style.display = 'none';
});

// 12) Initialization on load
window.addEventListener('load', async () => {
  const last = await getLastHandle();
  if (last) {
    rootDir = last;
  } else {
    rootDir = await window.showDirectoryPicker({ startIn: 'downloads' });
    await saveLastHandle(rootDir);
  }
  currentHandle = rootDir;

  await loadRootFiles();
  await initSidebar();
  setActiveNav(navRoot);
});
