// src/sidebar.js
export async function loadAlbums(rootDir) {
  // TODO: scan rootDir for directories and return structure
}

export function renderAlbums(container, albumsData, onGroupClick) {
  // TODO: render categories and groups into container
}

// src/metadata.js
export async function showMetadata(fileEntry, modalContainer) {
  // TODO: extract EXIF or video metadata, then call renderMetaModal
}

export function renderMetaModal(data, modalElement) {
  // TODO: build table in modalElement from data object
}