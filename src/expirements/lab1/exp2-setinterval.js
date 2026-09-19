/**
 * Experiment 2: setInterval(frame, 16) driver instead of requestAnimationFrame.
 * Demonstrates macrotask scheduling jitter and background tab throttling.
 * @param {Object} options
 * @param {(dt: number) => void} options.simulate - Physics update callback
 * @param {(alpha: number, metrics: Object) => void} options.render - Render callback
 * @param {number} [options.intervalMs=16] - Interval in ms (approx 60 Hz)
 */
export function createIntervalLoop({ simulate, render, intervalMs = 16 } = {}) {
  let timerId = null;
  let lastTime = performance.now();
  let frameCount = 0;
  let currentFps = 60;
  let lastMetricTime = performance.now();
  let frameDurations = [];

  function frame() {
    const currentTime = performance.now();
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    frameCount++;

    const frameTimeMs = dt * 1000;
    frameDurations.push(frameTimeMs);

    // Metric tracking every 1000ms
    if (currentTime - lastMetricTime >= 1000) {
      currentFps = frameCount;
      frameCount = 0;
      lastMetricTime = currentTime;

      // Compute jitter (standard deviation of frame times)
      if (frameDurations.length > 1) {
        const avg =
          frameDurations.reduce((a, b) => a + b, 0) / frameDurations.length;
        const variance =
          frameDurations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) /
          frameDurations.length;
        const jitter = Math.sqrt(variance);
        console.log(
          `[Exp2 setInterval] FPS: ${currentFps}, Avg Frame Time: ${avg.toFixed(2)}ms, Jitter: ±${jitter.toFixed(2)}ms`,
        );
      }
      frameDurations = [];
    }

    if (simulate) simulate(dt);
    if (render) {
      render(1.0, {
        fps: currentFps,
        stepsPerSec: currentFps,
        frameTimeMs: Number(frameTimeMs.toFixed(2)),
      });
    }
  }

  return {
    start() {
      if (timerId !== null) return;
      lastTime = performance.now();
      lastMetricTime = performance.now();
      timerId = setInterval(frame, intervalMs);
      console.log("[Exp2] setInterval loop started (interval = 16ms)");
    },
    stop() {
      if (timerId === null) return;
      clearInterval(timerId);
      timerId = null;
      console.log("[Exp2] setInterval loop stopped");
    },
  };
}
