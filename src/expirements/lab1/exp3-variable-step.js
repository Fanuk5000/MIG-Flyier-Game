/**
 * Experiment 3: Variable timestep (no accumulator) and 5.0-second trajectory test.
 * Demonstrates numerical integration error differences when throttled vs unthrottled.
 */
export function createVariableStepLoop({ simulate, render } = {}) {
  let lastTime = 0;
  let rAFId = 0;
  let isRunning = false;
  let frameCount = 0;
  let currentFps = 60;
  let lastMetricTime = 0;

  function tick(currentTime) {
    if (!isRunning) return;

    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    frameCount++;

    if (currentTime - lastMetricTime >= 1000) {
      currentFps = frameCount;
      frameCount = 0;
      lastMetricTime = currentTime;
    }

    // Variable timestep: NO ACCUMULATOR!
    // Physics receives raw, fluctuating delta directly
    if (simulate) simulate(dt);

    if (render) {
      render(1.0, {
        fps: currentFps,
        stepsPerSec: currentFps,
        frameTimeMs: Number((dt * 1000).toFixed(2)),
      });
    }

    rAFId = requestAnimationFrame(tick);
  }

  return {
    start() {
      if (isRunning) return;
      isRunning = true;
      lastTime = performance.now();
      lastMetricTime = performance.now();
      rAFId = requestAnimationFrame(tick);
      console.log("[Exp3] Variable timestep loop started (NO accumulator)");
    },
    stop() {
      isRunning = false;
      cancelAnimationFrame(rAFId);
      console.log("[Exp3] Variable timestep loop stopped");
    },
  };
}

/**
 * Runs an automated 5.0-second thrust trajectory benchmark.
 * Logs start and final positions to console.
 * @param {Object} options
 * @param {() => Object} options.getShip - Returns current ship state
 * @param {(state: boolean) => void} options.setThrust - Controls simulated thrust key
 * @param {string} [options.modeName="Run"] - Label for the benchmark run
 * @param {(results: Object) => void} [options.onComplete] - Callback with final results
 */
export function run5SecondBenchmark({
  getShip,
  setThrust,
  modeName = "Run",
  onComplete,
}) {
  console.log(`\n=== Starting 5.0s Benchmark [${modeName}] ===`);
  const initial = getShip();
  console.log(
    `Start Position: x=${initial.x.toFixed(2)}, y=${initial.y.toFixed(2)}`,
  );

  setThrust(true);
  const start = performance.now();

  const checkInterval = setInterval(() => {
    const elapsed = (performance.now() - start) / 1000;
    if (elapsed >= 5.0) {
      clearInterval(checkInterval);
      setThrust(false);
      const final = getShip();
      const dist = Math.hypot(final.x - initial.x, final.y - initial.y);

      const results = {
        modeName,
        startX: initial.x,
        startY: initial.y,
        finalX: final.x,
        finalY: final.y,
        finalVx: final.vx,
        finalVy: final.vy,
        distance: dist,
      };

      console.log(`=== 5.0s Finished [${modeName}] ===`);
      console.log(
        `Final Position: x=${final.x.toFixed(2)}, y=${final.y.toFixed(2)}`,
      );
      console.log(
        `Final Velocity: vx=${final.vx.toFixed(2)}, vy=${final.vy.toFixed(2)}`,
      );
      console.log(`Total Distance Traveled: ${dist.toFixed(2)} px\n`);

      if (onComplete) onComplete(results);
    }
  }, 16);
}
