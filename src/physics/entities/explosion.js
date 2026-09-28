import { Vector2 } from "../vector.js";
import { Entity } from "./entity.js";

/**
 * Short-lived particle entity for explosion effects.
 * Demonstrates many short-lived objects allocated and swept (Lab 7 benchmark prep).
 */
export class Particle extends Entity {
    /**
     * @param {Object} options
     * @param {Vector2} options.pos
     * @param {Vector2} options.vel
     * @param {number} [options.radius=2]
     * @param {number} [options.ttl=0.5]
     * @param {string} [options.color="#f97316"]
     */
    constructor({
        pos,
        vel,
        radius = 2,
        ttl = 0.5,
        color = "#f97316",
    } = {}) {
        super({ pos, vel, radius, kind: "particle" });
        this.ttl = ttl;
        this.maxTtl = ttl;
        this.color = color;
    }

    update(dt) {
        super.update(dt);
        this.ttl -= dt;
        if (this.ttl <= 0) {
            this.alive = false;
        }
    }

    draw(ctx) {
        const alpha = Math.max(0, this.ttl / this.maxTtl);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

/**
 * Spawns a radial burst of particle entities into the world.
 * @param {Object} world - World instance with spawn()
 * @param {Vector2} pos - Origin of explosion
 * @param {number} [count=16] - Particle count
 * @param {string} [color="#f97316"] - Main color
 */
export function spawnExplosion(world, pos, count = 16, color = "#f97316") {
    const colors = [color, "#facc15", "#ef4444", "#ffffff"];

    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = 40 + Math.random() * 120;
        const vel = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
        const particleColor = colors[Math.floor(Math.random() * colors.length)];

        world.spawn(
            new Particle({
                pos: new Vector2(pos.x, pos.y),
                vel,
                radius: 1.5 + Math.random() * 2,
                ttl: 0.3 + Math.random() * 0.4,
                color: particleColor,
            }),
        );
    }
}
