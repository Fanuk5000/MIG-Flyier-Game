/**
 * Render on-screen diagnostic HUD with FPS, steps/s, health, shield, and score.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} metrics
 */
export function drawHUD(ctx, metrics) {
    const { stepsPerSec, fps, frameTimeMs, mode, score, hp, shield } = metrics;
    ctx.save();
    ctx.font = "16px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`Steps/sec: ${stepsPerSec.toFixed(1)}`, 10, 20);
    ctx.fillText(`FPS: ${fps.toFixed(1)}`, 10, 40);
    ctx.fillText(`Frame time: ${frameTimeMs.toFixed(2)} ms`, 10, 60);

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
