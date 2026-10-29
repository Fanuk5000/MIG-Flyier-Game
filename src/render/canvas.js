/**
 * Setup canvas dimensions and apply devicePixelRatio for sharp rendering.
 * @param {HTMLCanvasElement} canvas
 */
export function setupCanvas(canvas) {
    const ctx = canvas.getContext("2d", { alpha: false });
    const dpr = 1.5;
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
 * Clear the entire canvas frame with opaque space background.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 */
export function clearCanvas(ctx, width, height) {
    ctx.fillStyle = "#0b0f19";
    ctx.fillRect(0, 0, width, height);
}
