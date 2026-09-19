export const FIXED_STEP = 1 / 60;

/**
 * @callback simulateCallback
 * @param {number} dt - Fixed delta time in seconds (1/60)
 */

/**
 * @callback RenderCallback
 * @param {number} alpha - Interpolation ratio between [0, 1)
 */

/**
 * @callback HudCallback
 * @param {{ stepsPerSec: number, fps: number, frameTimeMs: number }} metrics
 */

/**
 * @typedef {Object} GameLoopOptions
 * @property {simulateCallback} [simulate] - Fixed simulation step callback
 * @property {RenderCallback} [render] - Variable render callback
 * @property {HudCallback} [hud] - Periodic HUD metrics callback
 * @property {number} [step=FIXED_STEP] - Fixed simulation step in seconds
 */

/**
 * Creates the game loop driving fixed physics and interpolated rendering.
 * @param {GameLoopOptions} [options={}]
 */
export function createLoop({ simulate, render, step = FIXED_STEP } = {}) {
    let lastTime = 0;
    let accumulator = 0;
    let rAFId = 0;
    let isRunning = false;

    let stepCounter = 0;
    let lastMetricTime = 0;
    let currentStepsPerSec = 0;

    let currentFPS = 0;
    let frameCounter = 0;

    function tick(currentTime) {
        if (!isRunning) return;
        frameCounter++;

        // 1. Measure real elapsed time in seconds
        const dt = Math.min((currentTime - lastTime) / 1000, 0.25);

        // Safety clamp: prevent spiral of death if tab was unfocused
        lastTime = currentTime;

        // 2. Deposit elapsed time into the time bank
        accumulator += dt;

        // 3. Fixed simulation phase (runs strictly at 60 Hz)
        while (accumulator >= step) {
            if (simulate) simulate(step);
            accumulator -= step;
            stepCounter++;
        }

        // reset step counter+fps every second to calculate correctly
        if (currentTime - lastMetricTime >= 1000) {
            currentStepsPerSec = stepCounter;
            currentFPS = frameCounter;

            stepCounter = 0;
            frameCounter = 0;
            lastMetricTime = currentTime;
        }

        const metrics = {
            fps: currentFPS, // Calculate FPS based on the current frame's delta time
            frameTimeMs: Number((dt * 1000).toFixed(2)), // Frame time in milliseconds
            stepsPerSec: currentStepsPerSec,
        };

        // 4. Interpolation factor for smooth rendering: [0.0, 1.0)
        const alpha = accumulator / step;
        if (render) {
            render(alpha, metrics);
        }

        // 5. Schedule next frame
        rAFId = requestAnimationFrame(tick);
    }

    return {
        start() {
            if (isRunning) return;
            isRunning = true;
            lastTime = performance.now();
            rAFId = requestAnimationFrame(tick);
        },
        stop() {
            isRunning = false;
            cancelAnimationFrame(rAFId);
        },
    };
}
