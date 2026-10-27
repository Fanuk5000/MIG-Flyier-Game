/**
 * Render loading screen with progress bar and status text.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {{ progress?: number, status?: string, error?: string | null }} state
 */
export function drawLoadingScreen(ctx, width, height, state = {}) {
    const { progress = 0, status = "Loading...", error = null } = state;
    ctx.save();

    // Dark backdrop
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    const barWidth = Math.min(width * 0.6, 420);
    const barHeight = 24;
    const x = (width - barWidth) / 2;
    const y = height / 2;

    // Title
    ctx.textAlign = "center";
    ctx.font = "bold 24px monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("MIG-29 FLYER", width / 2, y - 50);

    // Progress Bar Background
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x, y, barWidth, barHeight);

    // Progress Bar Fill
    const clampedProgress = Math.max(0, Math.min(1, progress));
    ctx.fillStyle = error ? "#ef4444" : "#0284c7";
    ctx.fillRect(x, y, barWidth * clampedProgress, barHeight);

    // Border
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Percentage
    ctx.font = "14px monospace";
    ctx.fillStyle = "#ffffff";
    const percentText = `${Math.round(clampedProgress * 100)}%`;
    ctx.fillText(percentText, width / 2, y + 17);

    // Status or Error text
    ctx.font = "14px monospace";
    if (error) {
        ctx.fillStyle = "#f87171";
        ctx.fillText(`Error: ${error}`, width / 2, y + 55);
    } else {
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(status, width / 2, y + 55);
    }

    ctx.restore();
}
