import { Entity } from "./entity.js";

/**
 * Bullet entity fired by ships.
 * Moves with constant velocity and expires after a time-to-live.
 * Supports optional homing component via composition.
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
        homing = null,
    } = {}) {
        super({ pos, vel, angle, radius, kind: "bullet" });
        this.ttl = ttl; // Time-to-live in seconds
        this.damage = damage;
        this.ownerId = ownerId;
        this.homing = homing;
    }

    update(dt) {
        // Delegate steering to homing component if attached
        if (this.homing) {
            this.homing.update(this, dt);
        }

        super.update(dt);

        // Decrease TTL
        this.ttl -= dt;

        // If TTL is expired, mark as not alive
        if (this.ttl <= 0) {
            this.alive = false;
        }
    }

    /**
     * Renders bullet using sprite slice or fallback vector energy beam.
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} [sprite=null]
     */
    draw(ctx, sprite = null) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.angle * Math.PI) / 180);

        if (sprite?.image) {
            const { image, sx = 0, sy = 0 } = sprite;
            const sw = sprite.sw || image.width;
            const sh = sprite.sh || image.height;
            const dw = sprite.width || 8;
            const dh = sprite.height || 16;
            ctx.drawImage(image, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
        } else {
            ctx.fillStyle = this.homing ? "#38bdf8" : "#facc15"; // Cyan glow if homing
            ctx.beginPath();
            ctx.ellipse(0, 0, 2.5, 7, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
