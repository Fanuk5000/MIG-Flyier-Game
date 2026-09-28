import { Entity } from "./entity.js";

/**
 * Asteroid obstacle entity.
 * Drifts through space, tumbles with angular speed, and takes damage.
 */
export class Asteroid extends Entity {
    constructor({
        pos,
        vel,
        angle = 0,
        radius = 20,
        hp = 50,
        rotSpeed = 45,
    } = {}) {
        super({ pos, vel, angle, radius, kind: "asteroid" });
        this.hp = hp;
        this.rotSpeed = rotSpeed;
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
     * Updates linear drift and tumbling rotation.
     * @param {number} dt
     */
    update(dt) {
        super.update(dt);
        this.angle = (this.angle + this.rotSpeed * dt) % 360;
    }

    /**
     * Renders solid filled asteroid with stone outline.
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.angle * Math.PI) / 180);
        ctx.fillStyle = "#334155";
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}
