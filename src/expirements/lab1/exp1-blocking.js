/**
 * Experiment 1: Synchronous 100ms blocking loop every 60th frame.
 * Demonstrates single-threaded event loop blockage.
 * @param {number} frameCount - Total frames rendered so far
 * @param {number} [durationMs=100] - Duration of busy wait in milliseconds
 * @returns {boolean} Whether a block occurred this frame
 */
export function blockEvery60thFrame(frameCount, durationMs = 100) {
  if (frameCount > 0 && frameCount % 60 === 0) {
    const start = performance.now();
    while (performance.now() < start + durationMs) {
      // Empty busy-wait burning CPU clock cycles synchronously
    }
    return true;
  }
  return false;
}
