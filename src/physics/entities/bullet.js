import { Entity } from "./entity.js";

/**
 * Bullet entity fired by ships.
 * Moves with constant velocity and expires after a time-to-live.
 */
export class Bullet extends Entity {
    constructor({
        pos,
        vel,
        angle = 0,
        radius = 4,
        ttl = 2,
        damage = 25,
        ownerId = null,
    } = {}) {
        super({ pos, vel, angle, radius, kind: "bullet" });
        this.ttl = ttl; // Time-to-live in seconds
        this.damage = damage;
        this.ownerId = ownerId;
    }

    update(dt) {
        super.update(dt);

        // Decrease TTL
        this.ttl -= dt;

        // If TTL is expired, mark as not alive
        if (this.ttl <= 0) {
            this.alive = false;
        }
    }

    /**
     * Renders elongated yellow energy projectile aligned with flight angle.
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.angle * Math.PI) / 180);
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.ellipse(0, 0, 2.5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
