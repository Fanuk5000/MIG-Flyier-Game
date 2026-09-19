import { createInput } from "../../core/input.js";
import { createLoop } from "../../core/loop.js";
import {
    blockEvery60thFrame,
    createIntervalLoop,
    createVariableStepLoop,
    run5SecondBenchmark,
    setupExperimentUI,
} from "../../expirements/lab1/index.js";
import { wrapArena } from "../../physics/arena.js";
import { createShip, updateShipState } from "../../physics/ship.js";
import { clearCanvas, drawHUD, setupCanvas } from "../../render/canvas.js";
import { lerp, lerpAngle } from "../../render/math.js";
import { renderMIG } from "../../render/vehicle.js";
import "../../style.css";

const canvas = document.querySelector("#game-canvas");
let renderCtx = setupCanvas(canvas);
const input = createInput();

// Initial ship state
let currentShip = createShip(renderCtx.width / 2, renderCtx.height / 2);
let previousShip = { ...currentShip };

// Experiment mode state
let currentMode = "normal"; // "normal" | "exp1" | "exp2" | "exp3"
let renderFrameCount = 0;
let autoThrustOverride = false;
let activeLoop = null;

function stepPhysics(dt) {
    const keys = input.getState();
    if (autoThrustOverride) {
        keys.moveForward = true;
    }
    previousShip = currentShip;

    // 1. Move ship in space (pure physics)
    currentShip = updateShipState(currentShip, keys, dt);

    // 2. Wrap ship around arena boundaries
    currentShip = wrapArena(currentShip, renderCtx.width, renderCtx.height);

    // Clear edge-triggered keys after physics step
    input.clearJustPressed();
}

function renderFrame(alpha, metrics) {
    renderFrameCount++;

    // Exp 1: Inject 100ms blocking loop every 60th frame
    if (currentMode === "exp1") {
        blockEvery60thFrame(renderFrameCount, 100);
    }

    clearCanvas(renderCtx.ctx, renderCtx.width, renderCtx.height);

    // Smoothly interpolate position and angle along shortest path
    const renderX = lerp(previousShip.x, currentShip.x, alpha);
    const renderY = lerp(previousShip.y, currentShip.y, alpha);
    const renderAngle = lerpAngle(previousShip.angle, currentShip.angle, alpha);

    renderMIG(renderCtx.ctx, renderX, renderY, renderAngle, currentShip.thrust);

    // Append active mode name to HUD
    const hudMetrics = {
        ...metrics,
        mode: currentMode.toUpperCase(),
    };
    drawHUD(renderCtx.ctx, hudMetrics);
}

function switchMode(mode) {
    if (activeLoop) {
        activeLoop.stop();
    }
    currentMode = mode;
    renderFrameCount = 0;

    if (mode === "normal" || mode === "exp1") {
        activeLoop = createLoop({
            simulate: stepPhysics,
            render: renderFrame,
        });
    } else if (mode === "exp2") {
        activeLoop = createIntervalLoop({
            simulate: stepPhysics,
            render: renderFrame,
            intervalMs: 16,
        });
    } else if (mode === "exp3") {
        activeLoop = createVariableStepLoop({
            simulate: stepPhysics,
            render: renderFrame,
        });
    }

    activeLoop.start();
}

// Initialize in Normal mode
switchMode("normal");

// Connect experiment switcher UI buttons
setupExperimentUI({
    setNormalMode: () => switchMode("normal"),
    setExp1Blocking: () => switchMode("exp1"),
    setExp2Interval: () => switchMode("exp2"),
    setExp3Variable: () => switchMode("exp3"),
    runBenchmark: () => {
        currentShip = createShip(renderCtx.width / 2, renderCtx.height / 2);
        previousShip = { ...currentShip };

        run5SecondBenchmark({
            getShip: () => currentShip,
            setThrust: (val) => {
                autoThrustOverride = val;
            },
            modeName: currentMode.toUpperCase(),
        });
    },
});

// Keyboard shortcuts for experiments (0, 1, 2, 3, T)
window.addEventListener("keydown", (e) => {
    if (e.key === "0") switchMode("normal");
    if (e.key === "1") switchMode("exp1");
    if (e.key === "2") switchMode("exp2");
    if (e.key === "3") switchMode("exp3");
    if (e.key.toLowerCase() === "t") {
        currentShip = createShip(renderCtx.width / 2, renderCtx.height / 2);
        previousShip = { ...currentShip };
        run5SecondBenchmark({
            getShip: () => currentShip,
            setThrust: (val) => {
                autoThrustOverride = val;
            },
            modeName: currentMode.toUpperCase(),
        });
    }
});

// Auto-adjust when resizing browser window
window.addEventListener("resize", () => {
    renderCtx = setupCanvas(canvas);
});
