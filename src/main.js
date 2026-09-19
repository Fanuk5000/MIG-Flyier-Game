import { createInput } from "./core/input.js";
import { createLoop } from "./core/loop.js";
import { wrapArena } from "./physics/arena.js";
import { createShip, updateShipState } from "./physics/ship.js";
import { clearCanvas, drawHUD, setupCanvas } from "./render/canvas.js";
import { renderMIG } from "./render/vehicle.js";
import "./style.css";

const canvas = document.querySelector("#game-canvas");
let renderCtx = setupCanvas(canvas);
const input = createInput();

// Initial ship state from single source of truth
let currentShip = createShip(renderCtx.width / 2, renderCtx.height / 2);
let previousShip = { ...currentShip };

const loop = createLoop({
    simulate(dt) {
        const keys = input.getState();
        previousShip = currentShip;

        // 1. Move ship in space (pure physics)
        currentShip = updateShipState(currentShip, keys, dt);

        // 2. Wrap ship around arena boundaries
        currentShip = wrapArena(currentShip, renderCtx.width, renderCtx.height);

        // Clear edge-triggered keys after physics step
        input.clearJustPressed();
    },
    render(alpha, metrics) {
        clearCanvas(renderCtx.ctx, renderCtx.width, renderCtx.height);

        // Interpolate rendered position
        const renderX = previousShip.x * (1 - alpha) + currentShip.x * alpha;
        const renderY = previousShip.y * (1 - alpha) + currentShip.y * alpha;

        renderMIG(
            renderCtx.ctx,
            renderX,
            renderY,
            currentShip.angle,
            currentShip.thrust,
        );
        drawHUD(renderCtx.ctx, metrics);
    },
});

// Start loop engine
loop.start();

// Auto-adjust when resizing browser window
window.addEventListener("resize", () => {
    renderCtx = setupCanvas(canvas);
});
