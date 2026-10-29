import { HomingBehavior } from "../homing.js";
import { Entity } from "./entity.js";

/**
 * Shahed delta-wing kamikaze drone entity.
 * Slowly glides and tracks the player MiG with gentle homing course corrections.
 */
export class Shahed extends Entity {
    /**
     * @param {Object} [options={}]
     * @param {Vector2} options.pos
     * @param {Vector2} options.vel
     * @param {number} [options.angle=0]
     * @param {number} [options.radius=18]
     * @param {number} [options.hp=40]
     * @param {number} [options.speed=45]
     * @param {HomingBehavior} [options.homing=null]
     * @param {Entity} [options.target=null]
     */
    constructor({
        pos,
        vel,
        angle = 0,
        radius = 18,
        hp = 40,
        speed = 45,
        homing = null,
        target = null,
    } = {}) {
        super({ pos, vel, angle, radius, kind: "shahed" });
        this.hp = hp;
        this.speed = speed;
        this.homing =
            homing ||
            (target
                ? new HomingBehavior({
                      target,
                      turnRate: 25,
                      minDistance: 10,
                  })
                : null);
    }

    /**
     * Applies damage and marks dead if hp reaches 0.
     * @param {number} amount
     */
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.alive = false;
        }
    }

    /**
     * Updates gentle homing steering and linear position.
     * @param {number} dt
     */
    update(dt) {
        // Delegate steering to homing component to slowly track player
        if (this.homing) {
            this.homing.update(this, dt);
        }

        super.update(dt);
    }

    /**
     * Renders Shahed drone using sprite if available, or delta-wing vector fallback.
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
            const size = this.radius * 2;
            ctx.drawImage(
                image,
                sx,
                sy,
                sw,
                sh,
                -this.radius,
                -this.radius,
                size,
                size,
            );
            if (this.homing) {
                ctx.strokeStyle = "#f87171";
                ctx.lineWidth = 1.5;
                ctx.strokeRect(-this.radius, -this.radius, size, size);
            }
        } else {
            // Delta-wing silhouette (Shahed-136 loitering drone)
            ctx.beginPath();
            ctx.moveTo(0, -this.radius * 1.1); // Nose seeker
            ctx.lineTo(this.radius * 0.95, this.radius * 0.9); // Right wing tip
            ctx.lineTo(this.radius * 0.7, this.radius * 0.75); // Right inner trailing edge
            ctx.lineTo(0, this.radius * 0.55); // Pusher engine bay
            ctx.lineTo(-this.radius * 0.7, this.radius * 0.75); // Left inner trailing edge
            ctx.lineTo(-this.radius * 0.95, this.radius * 0.9); // Left wing tip
            ctx.closePath();

            ctx.fillStyle = "#334155"; // Dark military slate
            ctx.fill();
            ctx.strokeStyle = "#ef4444"; // Red perimeter alert accent
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Winglet vertical stabilizers
            ctx.beginPath();
            ctx.moveTo(this.radius * 0.95, this.radius * 0.9);
            ctx.lineTo(this.radius * 0.95, this.radius * 0.2);
            ctx.moveTo(-this.radius * 0.95, this.radius * 0.9);
            ctx.lineTo(-this.radius * 0.95, this.radius * 0.2);
            ctx.strokeStyle = "#94a3b8";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Engine pusher flame / combustion glow
            ctx.beginPath();
            ctx.arc(0, this.radius * 0.65, 3, 0, Math.PI * 2);
            ctx.fillStyle = "#f97316"; // Bright engine exhaust
            ctx.fill();

            // Seeker nose camera/detonator
            ctx.beginPath();
            ctx.arc(0, -this.radius * 0.9, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = "#dc2626"; // Crimson optical sensor
            ctx.fill();
        }

        ctx.restore();
    }
}
