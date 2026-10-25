import { Vector2 } from "./vector.js";

/**
 * Reusable Homing component.
 * Demonstrates composition over inheritance: can be attached to Bullet, Asteroid, or any Entity.
 */
export class HomingBehavior {
    /**
     * @param {Object} [options={}]
     * @param {Object} [options.target=null] - Target entity to track
     * @param {number} [options.turnRate=40] - Max steering turn speed in degrees per second
     * @param {number} [options.minDistance=50] - Distance cutoff where steering disengages to allow overshoot
     */
    constructor({ target = null, turnRate = 40, minDistance = 50 } = {}) {
        this.target = target;
        this.turnRate = turnRate;
        this.minDistance = minDistance;
    }

    /**
     * Gently curves entity trajectory toward target.
     * @param {Object} entity - Host entity with pos, vel, angle
     * @param {number} dt - Delta time in seconds
     */
    update(entity, dt) {
        if (!this.target || !this.target.alive) {
            return;
        }

        const dx = this.target.x - entity.x;
        const dy = this.target.y - entity.y;
        const distSq = dx * dx + dy * dy;

        // Stop steering at close range so dodging targets can evade
        if (distSq < this.minDistance * this.minDistance) {
            return;
        }

        // Desired heading angle in degrees (0 deg = UP)
        const desiredRad = Math.atan2(dx, -dy);
        const desiredAngle = (desiredRad * 180) / Math.PI;
        const targetHeading = ((desiredAngle % 360) + 360) % 360;

        // Calculate shortest angular difference
        let diff = targetHeading - entity.angle;
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;

        // Clamp turn rate by delta time (gentle curve)
        const maxTurn = this.turnRate * dt;
        const turn = Math.max(-maxTurn, Math.min(maxTurn, diff));
        entity.angle = (((entity.angle + turn) % 360) + 360) % 360;

        // Maintain entity speed along new heading
        const speed = entity.vel.length();
        if (speed > 0) {
            entity.vel = Vector2.fromHeadingDegrees(entity.angle, speed);
        }
    }
}
