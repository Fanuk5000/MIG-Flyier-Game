import { createInput } from "./core/input.js";
import { createLoop } from "./core/loop.js";
import { PickupFactory } from "./factories/pickup.js";
import { Ship } from "./physics/entities/ship.js";
import { HomingBehavior } from "./physics/homing.js";
import { Vector2 } from "./physics/vector.js";
import { World } from "./physics/world.js";
import { clearCanvas, setupCanvas } from "./render/canvas.js";
import { lerp, lerpAngle } from "./render/math.js";
import { renderMIG } from "./render/vehicle.js";
import "./style.css";
import { createHUD, drawLoadingScreen } from "./ui/index.js";

export const GameState = Object.freeze({
    LOADING: "LOADING",
    LOBBY: "LOBBY",
    PLAYING: "PLAYING",
    GAME_OVER: "GAME_OVER",
});

let currentState = GameState.LOADING;
const loadingState = {
    progress: 0,
    status: "Initializing...",
    error: null,
};
const assets = {
    sprites: {},
    audio: {},
};

const canvas = document.querySelector("#game-canvas");
let renderCtx = setupCanvas(canvas);
const input = createInput();

// 1. Initialize World entity manager
const world = new World();

// 2. Spawn player ship
const ship = new Ship({
    pos: new Vector2(renderCtx.width / 2, renderCtx.height / 2),
});
world.spawn(ship);

// 3. Pregenerate Shahed drones slowly approaching MiG
world.pregenerate(renderCtx.width, renderCtx.height, 4, ship);

// 4. Initialize decoupled event-driven HUD
const hud = createHUD(world, ship);

// 5. Spawn initial test pickups (shield & repair)
world.spawn(
    PickupFactory.createShield(
        new Vector2(renderCtx.width / 2 - 80, renderCtx.height / 2 - 60),
    ),
);
world.spawn(
    PickupFactory.createRepair(
        new Vector2(renderCtx.width / 2 + 80, renderCtx.height / 2 - 60),
    ),
);

// State for render interpolation
let prevShipState = { x: ship.x, y: ship.y, angle: ship.angle };

// Find nearest Shahed drone for player homing bullets
function findNearestShahed(origin) {
    let nearest = null;
    let minDist = 350; // acquisition radius

    for (const drone of world.ofKind("shahed")) {
        const dist = drone.pos.sub(origin).length();
        if (dist < minDist) {
            minDist = dist;
            nearest = drone;
        }
    }
    return nearest;
}

// Shooting handler demonstrating call-site binding and homing composition
function handleShooting(keys) {
    if (keys.justPressed.shoot && ship.alive) {
        const bullet = ship.fire();

        world.dispatchEvent(
            new CustomEvent("fired", {
                detail: { pos: bullet.pos, kind: "bullet" },
            }),
        );

        // Attach gentle homing component to bullet if a Shahed is nearby
        const target = findNearestShahed(bullet.pos);
        if (target) {
            bullet.homing = new HomingBehavior({
                target,
                turnRate: 45,
                minDistance: 30,
            });
        }

        world.spawn(bullet);
    }
}

const loop = createLoop({
    simulate(dt) {
        if (currentState !== GameState.PLAYING) {
            return;
        }

        const keys = input.getState();

        prevShipState = { x: ship.x, y: ship.y, angle: ship.angle };

        // Handle ship shooting
        handleShooting(keys);

        // Step world simulation (updates all entities, applies arena boundaries, sweeps dead)
        world.step(dt, keys, renderCtx.width, renderCtx.height);

        // Clear edge-triggered keys after physics step
        input.clearJustPressed();
    },
    render(alpha, metrics) {
        clearCanvas(renderCtx.ctx, renderCtx.width, renderCtx.height);
        const ctx = renderCtx.ctx;

        if (currentState === GameState.LOADING) {
            drawLoadingScreen(
                ctx,
                renderCtx.width,
                renderCtx.height,
                loadingState,
            );
            return;
        }

        if (currentState === GameState.LOBBY) {
            drawLoadingScreen(ctx, renderCtx.width, renderCtx.height, {
                progress: 1,
                status: "Lobby active — select room...",
            });
            return;
        }

        // Render Pickups via entity method delegation
        for (const pickup of world.ofKind("pickup")) {
            pickup.draw(ctx);
        }

        // Render Shahed drones via entity method delegation
        for (const shahed of world.ofKind("shahed")) {
            shahed.draw(ctx, assets.sprites.shahed);
        }

        // Render Bullets via entity method delegation
        for (const bullet of world.ofKind("bullet")) {
            bullet.draw(ctx, assets.sprites.bullet);
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

            renderMIG(
                ctx,
                renderX,
                renderY,
                renderAngle,
                ship.thrust,
                assets.sprites.ship,
            );

            // Render protective energy shield bubble when active
            if (ship.shield > 0) {
                ctx.save();
                ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(renderX, renderY, ship.radius + 8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }

        // Render decoupled event-driven HUD overlay
        hud.draw(ctx, metrics);
    },
});

// Start loop engine
loop.start();

// Auto-adjust when resizing browser window
window.addEventListener("resize", () => {
    renderCtx = setupCanvas(canvas);
});

// Async bootstrap lifecycle
async function init() {
    try {
        currentState = GameState.LOADING;
        loadingState.status = "Loading core assets...";
        loadingState.progress = 0.3;

        // Stub progression until M1 asset pipeline integrates
        await new Promise((resolve) => setTimeout(resolve, 300));
        loadingState.progress = 0.7;
        loadingState.status = "Initializing simulation world...";

        await new Promise((resolve) => setTimeout(resolve, 300));
        loadingState.progress = 1.0;
        loadingState.status = "Ready";

        // Transition to PLAYING
        currentState = GameState.PLAYING;
    } catch (err) {
        loadingState.error = err.message || "Failed to initialize game";
        console.error("Initialization error:", err);
    }
}

init();
