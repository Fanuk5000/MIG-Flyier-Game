/**
 * Setup canvas dimensions and apply devicePixelRatio for sharp rendering.
 * @param {HTMLCanvasElement} canvas
 */
export function setupCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Buffer dimensions scaled by DPR
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // CSS display size in screen pixels
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Scale context so drawing units match CSS pixels
    ctx.scale(dpr, dpr);

    return { canvas, ctx, width, height, dpr };
}

/**
 * Clear the entire canvas frame.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 */
export function clearCanvas(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
}

export function drawHUD(ctx, metrics) {
    const { stepsPerSec, fps, frameTimeMs } = metrics;
    ctx.save();
    ctx.font = "16px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`Steps/sec: ${stepsPerSec.toFixed(1)}`, 10, 20);
    ctx.fillText(`FPS: ${fps.toFixed(1)}`, 10, 40);
    ctx.fillText(`Frame time: ${frameTimeMs.toFixed(2)} ms`, 10, 60);
    ctx.restore();
}
