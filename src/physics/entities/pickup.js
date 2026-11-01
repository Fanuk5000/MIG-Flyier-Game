import { Entity } from "./entity.js";

/**
 * Stationary collidable bonus item.
 * Demonstrates composition over inheritance: Pickup extends Entity (one level), NOT Ship.
 */
export class Pickup extends Entity {
    /**
     * @param {Object} options
     * @param {Vector2} options.pos
     * @param {string} [options.type="shield"] - "shield" or "repair"
     * @param {number} [options.radius=12]
     * @param {Function} [options.onCollect] - Strategy callback: (collector: Entity) => void
     */
    constructor({ pos, type = "shield", radius = 12, onCollect } = {}) {
        super({ pos, radius, kind: "pickup" });
        this.type = type;
        this.onCollect = onCollect;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }

    /**
     * Applies item effect to collector.
     * @param {Object} target
     */
    applyTo(target) {
        if (typeof this.onCollect === "function") {
            this.onCollect(target);
            return;
        }

        // Fallback for backwards-compatibility
        if (this.type === "shield") {
            target.addShield?.(50);
        } else if (this.type === "repair") {
            target.heal?.(35);
        }
    }

    /**
     * Updates subtle pulse animation phase.
     * @param {number} dt
     */
    update(dt) {
        this.pulsePhase += dt * 3;
    }

    /**
     * Renders glowing pickup orb on canvas.
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        const isShield = this.type === "shield";
        const baseColor = isShield ? "#38bdf8" : "#34d399";
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.18;
        const currentRadius = this.radius * pulse;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Outer glow
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner core
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Icon symbol
        ctx.font = "bold 10px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isShield ? "S" : "+", 0, 0);

        ctx.restore();
    }
}
