// src/main.js
import { openHandleDB, saveLastHandle, getLastHandle } from './storage.js';
import { walkRoot, walkRecursive } from './dir-walk.js';
import { applyFilters, resetGrid, loadMore, initObserver } from './grid-renderer.js';
import { loadAlbums, renderAlbums } from './sidebar.js';
import { showMetadata } from './metadata.js';
import { IMAGE_EXTS, VIDEO_EXTS, BATCH_SIZE } from './utils.js';

window.addEventListener('load', async () => {
  // 1. Initialize directory handle
  // 2. Load files and albums
  // 3. Setup observer on thumb grid
  // 4. Bind UI events
});

// TODO: Bind pickBtn, refreshBtn, searchInput, sortSelect, mediaFilter, includeSub