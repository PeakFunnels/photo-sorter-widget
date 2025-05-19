// src/grid-renderer.js
import { BATCH_SIZE, IMAGE_EXTS, VIDEO_EXTS } from './utils.js';

let observer;
export function initObserver(root) {
  observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !e.target._loaded) {
        generateThumb(e.target._handle, e.target);
        e.target._loaded = true;
        observer.unobserve(e.target);
      }
    });
  }, { root, rootMargin: '200px' });
}

export function applyFilters(allFiles, searchValue, mediaValue, sortValue) {
  // TODO: implement search, filter, sort logic
  return [];
}

export function resetGrid(container, files, loadMoreFn) {
  // TODO: clear container, reset counters, call loadMoreFn
}

export async function loadMore(container, displayedFiles) {
  // TODO: append next BATCH_SIZE items
}

async function generateThumb(handle, cell) {
  // TODO: create thumbnail or fallback icon
}