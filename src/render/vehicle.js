/**
 * Render MiG jet fighter with heading angle and optional thruster flame.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Center X position
 * @param {number} y - Center Y position
 * @param {number} angle - Orientation in degrees (0 = pointing UP)
 * @param {boolean} isThrusting - Whether afterburner is active
 */
export function renderVehicle(ctx, x, y, angle, isThrusting = false) {
    ctx.save();
    ctx.translate(x, y);
    const radian = angle * (Math.PI / 180); // angle to radian conversion
    ctx.rotate(radian);

    // 1. Afterburner flame (drawn behind jet when thrust is active)
    if (isThrusting) {
        ctx.beginPath();
        ctx.moveTo(-4, 18);
        ctx.lineTo(0, 32);
        ctx.lineTo(4, 18);
        ctx.fillStyle = "#ff6600";
        ctx.fill();
    }

    // 2. MiG jet body (delta wings + fuselage)
    ctx.beginPath();
    ctx.moveTo(0, -25); // Nose tip
    ctx.lineTo(5, -5); // Right nose blend
    ctx.lineTo(18, 10); // Right wing tip
    ctx.lineTo(5, 12); // Right wing inner
    ctx.lineTo(6, 20); // Right tail stabilizer
    ctx.lineTo(-6, 20); // Left tail stabilizer
    ctx.lineTo(-5, 12); // Left wing inner
    ctx.lineTo(-18, 10); // Left wing tip
    ctx.lineTo(-5, -5); // Left nose blend
    ctx.closePath();

    ctx.fillStyle = "#94a3b8"; // Aircraft gray
    ctx.fill();
    ctx.strokeStyle = "#38bdf8"; // Cyan edge accent
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Cockpit canopy
    ctx.beginPath();
    ctx.ellipse(0, -6, 3, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#0284c7"; // Cockpit blue
    ctx.fill();

    ctx.restore();
}
