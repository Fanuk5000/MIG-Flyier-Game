/**
 * Standalone HUD drawing routine.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} metrics
 */
export function drawHUD(ctx, metrics) {
    const { stepsPerSec, fps, frameTimeMs, mode, score, hp, shield } = metrics;
    ctx.save();
    ctx.font = "16px monospace";
    ctx.fillStyle = "#ffffff";
    if (stepsPerSec !== undefined) {
        ctx.fillText(`Steps/sec: ${stepsPerSec.toFixed(1)}`, 10, 20);
    }
    if (fps !== undefined) {
        ctx.fillText(`FPS: ${fps.toFixed(1)}`, 10, 40);
    }
    if (frameTimeMs !== undefined) {
        ctx.fillText(`Frame time: ${frameTimeMs.toFixed(2)} ms`, 10, 60);
    }

    let hudY = 85;
    if (score !== undefined) {
        ctx.fillStyle = "#facc15";
        ctx.fillText(`Score: ${score}`, 10, hudY);
        hudY += 20;
    }

    if (hp !== undefined) {
        ctx.fillStyle = hp > 30 ? "#4ade80" : "#ef4444";
        ctx.fillText(`HP: ${hp}`, 10, hudY);
        hudY += 20;
    }

    if (shield !== undefined) {
        ctx.fillStyle = "#38bdf8";
        ctx.fillText(`Shield: ${shield}`, 10, hudY);
        hudY += 20;
    }

    if (mode) {
        ctx.fillStyle = "#38bdf8";
        ctx.fillText(`Mode: ${mode}`, 10, hudY);
    }
    ctx.restore();
}

/**
 * Creates an event-driven HUD instance that decouples presentation from simulation.
 * Subscribes to EventTarget events: "scoreChanged", "hit", "shipDied", "pickupCollected", "respawned".
 *
 * @param {EventTarget} [eventTarget]
 * @param {{ hp?: number, shield?: number }} [initialShip]
 */
export function createHUD(eventTarget, initialShip = null) {
    let score = 0;
    let hp = initialShip?.hp ?? 100;
    let shield = initialShip?.shield ?? 0;

    if (eventTarget) {
        eventTarget.addEventListener("scoreChanged", (e) => {
            if (e.detail?.score !== undefined) {
                score = e.detail.score;
            }
        });

        eventTarget.addEventListener("hit", (e) => {
            if (e.detail?.hp !== undefined) {
                hp = e.detail.hp;
            }
            if (e.detail?.shield !== undefined) {
                shield = e.detail.shield;
            }
        });

        eventTarget.addEventListener("shipDied", () => {
            hp = 0;
            shield = 0;
        });

        eventTarget.addEventListener("pickupCollected", (e) => {
            if (e.detail?.hp !== undefined) {
                hp = e.detail.hp;
            }
            if (e.detail?.shield !== undefined) {
                shield = e.detail.shield;
            }
        });

        eventTarget.addEventListener("respawned", (e) => {
            hp = e.detail?.hp ?? 100;
            shield = e.detail?.shield ?? 0;
        });
    }

    return {
        get score() {
            return score;
        },
        get hp() {
            return hp;
        },
        get shield() {
            return shield;
        },
        draw(ctx, loopMetrics = {}) {
            drawHUD(ctx, {
                ...loopMetrics,
                score,
                hp,
                shield,
            });
        },
    };
}
