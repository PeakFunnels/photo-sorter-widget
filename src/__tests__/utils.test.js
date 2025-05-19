// src/__tests__/utils.test.js

test('constants are defined', async () => {
  const { IMAGE_EXTS, VIDEO_EXTS, BATCH_SIZE } = await import('../utils.js');

  expect(Array.isArray(IMAGE_EXTS)).toBe(true);
  expect(Array.isArray(VIDEO_EXTS)).toBe(true);
  expect(typeof BATCH_SIZE).toBe('number');
});
