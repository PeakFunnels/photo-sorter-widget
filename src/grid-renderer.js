// src/grid-renderer.js

import { BATCH_SIZE, IMAGE_EXTS, VIDEO_EXTS } from './utils.js';

let observer;
let loaded = 0;
let displayed = [];

/**
 * Initialize the IntersectionObserver on the thumbnail grid for lazy-loading.
 * @param {HTMLElement} gridEl
 * @param {Function} generateThumbFn
 */
export function initObserver(gridEl, generateThumbFn) {
  observer = new IntersectionObserver(entries => {
    for (let entry of entries) {
      if (entry.isIntersecting && !entry.target._loaded) {
        generateThumbFn(entry.target._handle, entry.target);
        entry.target._loaded = true;
        observer.unobserve(entry.target);
      }
    }
  }, { root: gridEl, rootMargin: '200px' });
}

/**
 * Filter and sort the full file list.
 * @param {Array} allFiles
 * @param {string} searchQuery
 * @param {string} mediaFilterValue
 * @param {string} sortValue
 * @returns {Array}
 */
export function applyFilters(allFiles, searchQuery, mediaFilterValue, sortValue) {
  let list = [...allFiles];
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    list = list.filter(f => f.name.toLowerCase().includes(q));
  }
  if (mediaFilterValue !== 'all') {
    list = list.filter(f => {
      const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
      return mediaFilterValue === 'photos'
        ? IMAGE_EXTS.includes(ext)
        : VIDEO_EXTS.includes(ext);
    });
  }
  if (sortValue === 'alpha') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    list.sort((a, b) => b.date - a.date);
  }
  return list;
}

/**
 * Clear and reset the thumbnail grid.
 * @param {HTMLElement} container
 * @param {Array} allFiles
 * @param {string} searchQuery
 * @param {string} mediaFilterValue
 * @param {string} sortValue
 */
export function resetGrid(container, allFiles, searchQuery, mediaFilterValue, sortValue) {
  container.innerHTML = '';
  loaded = 0;
  displayed = applyFilters(allFiles, searchQuery, mediaFilterValue, sortValue);
  loadMore(container);
}

/**
 * Load next batch of thumbnails with action buttons, selection, and drag.
 * @param {HTMLElement} container
 */
export async function loadMore(container) {
  const slice = displayed.slice(loaded, loaded + BATCH_SIZE);
  for (let f of slice) {
    const cell = document.createElement('div');
    cell.className = 'thumb';
    cell._handle = f.handle;
    cell._filename = f.name;

    // Placeholder icon
    const ph = document.createElement('div');
    ph.className = 'icon';
    ph.textContent = '…';
    cell.appendChild(ph);

    // Actions container
    const acts = document.createElement('div');
    acts.className = 'actions';

    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();

    // Rename
    const renameBtn = document.createElement('button');
    renameBtn.textContent = '✎';
    renameBtn.title = 'Rename';
    renameBtn.onclick = async e => {
      e.stopPropagation();
      const base = prompt('Rename to:', f.name.replace(ext, ''));
      if (!base) return;
      const nm = base.endsWith(ext) ? base : base + ext;
      const file = await f.handle.getFile();
      const nh = await currentHandle.getFileHandle(nm, { create: true });
      const w = await nh.createWritable();
      await w.write(file);
      await w.close();
      await currentHandle.removeEntry(f.name);
      await loadRootFiles();
    };
    acts.appendChild(renameBtn);

    // Delete
    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑';
    delBtn.title = 'Delete';
    delBtn.onclick = async e => {
      e.stopPropagation();
      if (!confirm(`Delete ${f.name}?`)) return;
      await currentHandle.removeEntry(f.name);
      await loadRootFiles();
    };
    acts.appendChild(delBtn);

    // Metadata
    const infoBtn = document.createElement('button');
    infoBtn.textContent = 'ℹ️';
    infoBtn.title = 'Metadata';
    acts.appendChild(infoBtn);

    // Open
    const openBtn = document.createElement('button');
    openBtn.textContent = VIDEO_EXTS.includes(ext) ? '▶️' : '🔍';
    openBtn.title = 'Open';
    openBtn.onclick = async e => {
      e.stopPropagation();
      const file = await f.handle.getFile();
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
    };
    acts.appendChild(openBtn);

    cell.appendChild(acts);

    // Filename label
    const lbl = document.createElement('div');
    lbl.className = 'name';
    lbl.textContent = f.name;
    cell.appendChild(lbl);

    // Selection
    cell.onclick = e => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        if (selected.has(f)) {
          selected.delete(f);
          cell.classList.remove('selected');
        } else {
          selected.add(f);
          cell.classList.add('selected');
        }
      } else {
        container.querySelectorAll('.thumb.selected').forEach(x => x.classList.remove('selected'));
        selected.clear();
        selected.add(f);
        cell.classList.add('selected');
      }
    };

    // Drag
    cell.draggable = true;
    cell.ondragstart = e => {
      const names = selected.has(f)
        ? Array.from(selected).map(x => x.name)
        : [f.name];
      e.dataTransfer.setData('application/json', JSON.stringify(names));
    };

    container.appendChild(cell);
    observer.observe(cell);
  }
  loaded += slice.length;
}

/**
 * Generate a thumbnail image or fallback icon in the cell.
 * @param {FileSystemFileHandle} handle
 * @param {HTMLElement} cell
 */
export async function generateThumb(handle, cell) {
  const file = await handle.getFile();
  const size = parseInt(getComputedStyle(cell).getPropertyValue('--thumb'));
  const url = URL.createObjectURL(file);
  const probe = document.createElement('video');
  const canPlay = probe.canPlayType(file.type) !== '';

  if (file.type.startsWith('video/') && canPlay) {
    probe.preload = 'metadata';
    probe.muted = true;
    probe.src = url;
    probe.currentTime = 0.5;
    probe.onseeked = async () => {
      const bm = await createImageBitmap(probe, { resizeWidth: size, resizeHeight: size, resizeQuality: 'high' });
      const cnv = document.createElement('canvas');
      cnv.width = cnv.height = size;
      cnv.getContext('2d').drawImage(bm, 0, 0);
      const img = document.createElement('img');
      img.src = cnv.toDataURL('image/jpeg', 0.75);
      cell.replaceChild(img, cell.querySelector('.icon'));
    };
  } else if (file.type.startsWith('image/')) {
    const img = new Image();
    img.src = url;
    img.onload = async () => {
      const bm = await createImageBitmap(img, { resizeWidth: size, resizeHeight: size, resizeQuality: 'high' });
      const cnv = document.createElement('canvas');
      cnv.width = cnv.height = size;
      cnv.getContext('2d').drawImage(bm, 0, 0);
      const thumb = document.createElement('img');
      thumb.src = cnv.toDataURL('image/jpeg', 0.75);
      cell.replaceChild(thumb, cell.querySelector('.icon'));
    };
  } else if (file.type.startsWith('video/')) {
    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.textContent = '🎥';
    cell.replaceChild(icon, cell.querySelector('.icon'));
  } else {
    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.textContent = '📄';
    cell.replaceChild(icon, cell.querySelector('.icon'));
  }
}
