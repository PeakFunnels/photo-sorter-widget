// src/metadata.js

/**
 * Display metadata for a given file entry in a modal.
 * Supports images via EXIF and videos via built-in metadata.
 * @param {{ name: string, handle: FileSystemFileHandle }} fileEntry
 * @param {HTMLElement} modalElement The modal container (#metaModal)
 */
export async function showMetadata(fileEntry, modalElement) {
  const { name, handle } = fileEntry;
  const file = await handle.getFile();
  let tags = {};

  // Extract EXIF tags for images
  if (file.type.startsWith('image/') && window.EXIF) {
    await new Promise(resolve => {
      EXIF.getData(file, function() {
        tags = EXIF.getAllTags(this);
        resolve();
      });
    });
  }

  // Build ordered metadata
  const data = {};
  data['File Name'] = name;
  // Original date from EXIF if available
  if (tags.DateTimeOriginal) {
    data['Original Date'] = tags.DateTimeOriginal;
  }
  // Camera make/model if available
  if (tags.Make || tags.Model) {
    data['Camera'] = [tags.Make, tags.Model].filter(Boolean).join(' ');
  }
  // Video metadata or fallback
  if (file.type.startsWith('video/')) {
    const url = URL.createObjectURL(file);
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.src = url;
    await new Promise(resolve => {
      vid.onloadedmetadata = () => {
        data['Duration'] = `${vid.duration.toFixed(2)} s`;
        data['Width'] = vid.videoWidth;
        data['Height'] = vid.videoHeight;
        resolve();
      };
    });
  }

  // Common fields
  data['Size'] = `${file.size} bytes`;
  data['Type'] = file.type;
  data['Last Modified'] = new Date(file.lastModified).toLocaleString();

  renderMetaModal(data, modalElement);
}
