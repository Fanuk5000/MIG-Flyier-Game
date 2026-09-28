import { createInput } from "./core/input.js";
import { createLoop } from "./core/loop.js";
import { Ship } from "./physics/entities/ship.js";
import { Vector2 } from "./physics/vector.js";
import { World } from "./physics/world.js";
import { clearCanvas, drawHUD, setupCanvas } from "./render/canvas.js";
import { lerp, lerpAngle } from "./render/math.js";
import { renderMIG } from "./render/vehicle.js";
import "./style.css";

const canvas = document.querySelector("#game-canvas");
let renderCtx = setupCanvas(canvas);
const input = createInput();

// 1. Initialize World entity manager and pregenerate obstacles
const world = new World();
world.pregenerate(renderCtx.width, renderCtx.height, 4);

// 2. Spawn player ship
const ship = new Ship({
    pos: new Vector2(renderCtx.width / 2, renderCtx.height / 2),
});
world.spawn(ship);

// State for render interpolation
let prevShipState = { x: ship.x, y: ship.y, angle: ship.angle };

// Shooting handler demonstrating call-site binding
function handleShooting(keys) {
    if (keys.justPressed.shoot && ship.alive) {
        const bullet = ship.fire();
        world.spawn(bullet);
    }
}

const loop = createLoop({
    simulate(dt) {
        const keys = input.getState();

        prevShipState = { x: ship.x, y: ship.y, angle: ship.angle };

        // Handle ship shooting
        handleShooting(keys);

        // Step world simulation (updates all entities, resolves collisions, applies arena boundaries, sweeps dead)
        world.step(dt, keys, renderCtx.width, renderCtx.height);

        // Clear edge-triggered keys after physics step
        input.clearJustPressed();
    },
    render(alpha, metrics) {
        clearCanvas(renderCtx.ctx, renderCtx.width, renderCtx.height);
        const ctx = renderCtx.ctx;

        // Render Asteroids via entity method delegation
        for (const asteroid of world.ofKind("asteroid")) {
            asteroid.draw(ctx);
        }

        // Render Bullets via entity method delegation
        for (const bullet of world.ofKind("bullet")) {
            bullet.draw(ctx);
        }

        // Render Particles (Explosions) via entity method delegation
        for (const particle of world.ofKind("particle")) {
            particle.draw(ctx);
        }

        // Render Player Ship if alive
        if (ship.alive) {
            const renderX = lerp(prevShipState.x, ship.x, alpha);
            const renderY = lerp(prevShipState.y, ship.y, alpha);
            const renderAngle = lerpAngle(
                prevShipState.angle,
                ship.angle,
                alpha,
            );

            renderMIG(ctx, renderX, renderY, renderAngle, ship.thrust);
        }

        // Render HUD with HP and Score
        drawHUD(ctx, {
            ...metrics,
            score: world.score,
            hp: ship.hp,
        });
    },
});

// Start loop engine
loop.start();

// Auto-adjust when resizing browser window
window.addEventListener("resize", () => {
    renderCtx = setupCanvas(canvas);
});
