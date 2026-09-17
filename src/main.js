import { createInput } from "./core/input.js";
import { createLoop } from "./core/loop.js";
import { updateShipState } from "./physics/ship.js";
import { clearCanvas, drawHUD, setupCanvas } from "./render/canvas.js";
import { renderVehicle } from "./render/vehicle.js";
import "./style.css";

const canvas = document.querySelector("#game-canvas");
let renderCtx = setupCanvas(canvas);
const input = createInput();

// Initial ship state
let currentShip = {
    x: renderCtx.width / 2,
    y: renderCtx.height / 2,
    angle: 0,
    speed: 250, // Pixels per second
    turnSpeed: 50, // Radians per second
};
let previousShip = { ...currentShip };

const loop = createLoop({
    update(dt) {
        const keys = input.getState();
        previousShip = currentShip;
        currentShip = updateShipState(currentShip, keys, dt);
    },
    render(alpha, metrics) {
        clearCanvas(renderCtx.ctx, renderCtx.width, renderCtx.height);
        const keys = input.getState();
        const isThrusting = keys.moveForward || keys.moveBackward;

        const renderX = previousShip.x * (1 - alpha) + currentShip.x * alpha;
        const renderY = previousShip.y * (1 - alpha) + currentShip.y * alpha;

        renderVehicle(
            renderCtx.ctx,
            renderX,
            renderY,
            currentShip.angle,
            isThrusting,
        );
        drawHUD(renderCtx.ctx, metrics);
    },
});

// Start loop engine
loop.start();

const currentTime = performance.now();
let prevTime = currentTime;
while (currentTime - prevTime >= 1000) {
    prevTime = performance.now();
    console.log(`Testing queue: ${prevTime}`);
}

// Auto-adjust when resizing browser window
window.addEventListener("resize", () => {
    renderCtx = setupCanvas(canvas);
});
