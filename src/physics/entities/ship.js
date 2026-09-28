import { Vector2 } from "../vector.js";
import { Bullet } from "./bullet.js";
import { Entity } from "./entity.js";

/**
 * Player-controlled ship entity.
 * Demonstrates single-level class inheritance (Ship extends Entity).
 */
export class Ship extends Entity {
    #hp = 100;
    #maxHp = 100;

    /**
     * @param {Object} [options={}]
     * @param {Vector2} [options.pos=new Vector2(0, 0)]
     * @param {Vector2} [options.vel=new Vector2(0, 0)]
     * @param {number} [options.angle=0]
     * @param {number} [options.radius=16]
     * @param {number} [options.thrustPower=450]
     * @param {number} [options.turnRate=180]
     * @param {number} [options.drag=0.8]
     * @param {number} [options.maxSpeed=400]
     */
    constructor({
        pos = new Vector2(0, 0),
        vel = new Vector2(0, 0),
        angle = 0,
        radius = 16,
        thrustPower = 450,
        turnRate = 180,
        drag = 0.8,
        maxSpeed = 400,
    } = {}) {
        super({ pos, vel, angle, radius, kind: "ship" });
        this.thrust = false;
        this.thrustPower = thrustPower;
        this.turnRate = turnRate;
        this.drag = drag;
        this.maxSpeed = maxSpeed;
    }

    get hp() {
        return this.#hp;
    }

    /**
     * Applies damage to ship HP.
     * @param {number} amount
     */
    takeDamage(amount) {
        this.#hp = Math.max(0, this.#hp - amount);
        if (this.#hp === 0) {
            this.alive = false;
        }
    }

    /**
     * Heals or resets ship HP.
     * @param {number} [amount=100]
     */
    heal(amount = 100) {
        this.#hp = Math.min(this.#maxHp, this.#hp + amount);
        if (this.alive === false) this.alive = true;
    }

    /**
     * Spawns a bullet from the ship's nose with inherited velocity.
     * NOTE: Relies on `this`. Passing this method unbound as a callback loses `this`.
     * @param {number} [bulletSpeed=600]
     * @returns {Bullet}
     */
    fire(bulletSpeed = 600) {
        const heading = Vector2.fromHeadingDegrees(this.angle);
        const nosePos = this.pos.add(heading.scale(this.radius + 6));
        const bulletVel = this.vel.add(heading.scale(bulletSpeed));

        return new Bullet({
            pos: nosePos,
            vel: bulletVel,
            angle: this.angle,
            ownerId: this.id,
        });
    }

    /**
     * Updates ship steering, acceleration, damping, and position.
     * @param {number} dt - Delta time in seconds
     * @param {Object} [input={}] - Input state
     */
    update(dt, input = {}) {
        // 1. Angular steering
        if (input.turnLeft) {
            this.angle -= this.turnRate * dt;
        }
        if (input.turnRight) {
            this.angle += this.turnRate * dt;
        }
        this.angle = ((this.angle % 360) + 360) % 360;

        // 2. Thrust acceleration along heading
        this.thrust = Boolean(input.moveForward);
        if (this.thrust) {
            const accel = Vector2.fromHeadingDegrees(
                this.angle,
                this.thrustPower,
            );
            this.vel = this.vel.add(accel.scale(dt));
        }

        // 3. Drag damping
        const damping = Math.max(0, 1 - this.drag * dt);
        this.vel = this.vel.scale(damping);

        // 4. Speed clamping
        const speed = this.vel.length();
        if (speed > this.maxSpeed && speed > 0) {
            this.vel = this.vel.scale(this.maxSpeed / speed);
        }

        // 5. Integrate position via base Entity
        super.update(dt);
    }
}

/**
 * Factory helper for backwards compatibility.
 * @param {number} [x=0]
 * @param {number} [y=0]
 * @returns {Ship}
 */
export function createShip(x = 0, y = 0) {
    return new Ship({ pos: new Vector2(x, y) });
}

/**
 * Compatibility function for legacy functional update callers.
 * @param {Ship} ship
 * @param {Object} input
 * @param {number} dt
 * @returns {Ship}
 */
export function updateShipState(ship, input, dt) {
    ship.update(dt, input);
    return ship;
}
