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
        radius = 22,
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
        this.animTime = Math.random() * 10;
        this.frameRate = 12; // 12 FPS animation cycle
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
     * Updates gentle homing steering, animation timer, and linear position.
     * @param {number} dt
     */
    update(dt) {
        // Delegate steering to homing component to slowly track player
        if (this.homing) {
            this.homing.update(this, dt);
        }

        this.animTime += dt;
        super.update(dt);
    }

    /**
     * Renders Shahed drone using 6-frame sprite queue if available, or delta-wing vector fallback.
     * @param {CanvasRenderingContext2D} ctx
     * @param {Array<HTMLImageElement>|Object} [sprites=null]
     */
    draw(ctx, sprites = null) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.angle * Math.PI) / 180);

        let activeImg = null;
        if (Array.isArray(sprites) && sprites.length > 0) {
            const frameIdx =
                Math.floor(this.animTime * this.frameRate) % sprites.length;
            activeImg = sprites[frameIdx];
        } else if (sprites instanceof HTMLImageElement) {
            activeImg = sprites;
        } else if (sprites?.image) {
            activeImg = sprites.image;
        }

        const hasSprite = Boolean(
            activeImg &&
                activeImg.complete !== false &&
                activeImg.naturalWidth !== 0,
        );

        if (hasSprite) {
            // Shahed aspect ratio: 2400 x 1792 (1.338:1)
            // Preserves radius 22 hitbox
            const dw = 60;
            const dh = 45;
            ctx.drawImage(activeImg, -dw / 2, -dh / 2, dw, dh);
            if (this.homing) {
                ctx.strokeStyle = "#f87171";
                ctx.lineWidth = 1.5;
                ctx.strokeRect(-dw / 2, -dh / 2, dw, dh);
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
