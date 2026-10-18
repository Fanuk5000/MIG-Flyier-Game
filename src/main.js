import { createInput } from "./core/input.js";
import { createLoop } from "./core/loop.js";
import { Pickup } from "./physics/entities/pickup.js";
import { Ship } from "./physics/entities/ship.js";
import { HomingBehavior } from "./physics/homing.js";
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

// 3. Spawn initial test pickups (shield & repair)
world.spawn(
    new Pickup({
        pos: new Vector2(renderCtx.width / 2 - 80, renderCtx.height / 2 - 60),
        type: "shield",
    }),
);
world.spawn(
    new Pickup({
        pos: new Vector2(renderCtx.width / 2 + 80, renderCtx.height / 2 - 60),
        type: "repair",
    }),
);

// 4. Attach gentle Homing component to one asteroid tracking player ship
const initialAsteroid = Array.from(world.ofKind("asteroid"))[0];
if (initialAsteroid) {
    initialAsteroid.homing = new HomingBehavior({
        target: ship,
        turnRate: 25,
        minDistance: 60,
    });
}

// State for render interpolation
let prevShipState = { x: ship.x, y: ship.y, angle: ship.angle };

// Find nearest asteroid for player homing bullets
function findNearestAsteroid(origin) {
    let nearest = null;
    let minDist = 350; // acquisition radius

    for (const asteroid of world.ofKind("asteroid")) {
        const dist = asteroid.pos.sub(origin).length();
        if (dist < minDist) {
            minDist = dist;
            nearest = asteroid;
        }
    }
    return nearest;
}

// Shooting handler demonstrating call-site binding and homing composition
function handleShooting(keys) {
    if (keys.justPressed.shoot && ship.alive) {
        const bullet = ship.fire();

        // Attach gentle homing component to bullet if an asteroid is nearby
        const target = findNearestAsteroid(bullet.pos);
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

        // Render Pickups via entity method delegation
        for (const pickup of world.ofKind("pickup")) {
            pickup.draw(ctx);
        }

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

        // Render HUD with HP, Shield, and Score
        drawHUD(ctx, {
            ...metrics,
            score: world.score,
            hp: ship.hp,
            shield: ship.shield,
        });
    },
});

// Start loop engine
loop.start();

// Auto-adjust when resizing browser window
window.addEventListener("resize", () => {
    renderCtx = setupCanvas(canvas);
});
