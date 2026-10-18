import { Vector2 } from "../vector.js";

/**
 * Base Entity class for game simulation.
 * Manages identity, spatial properties, and base physics integration.
 */
export class Entity {
    #id = crypto.randomUUID();

    /**
     * @param {Object} [options={}]
     * @param {Vector2} [options.pos=new Vector2(0, 0)]
     * @param {Vector2} [options.vel=new Vector2(0, 0)]
     * @param {number} [options.angle=0]
     * @param {number} [options.radius=10]
     * @param {boolean} [options.alive=true]
     * @param {string} [options.kind="entity"]
     */
    constructor({
        pos = new Vector2(0, 0),
        vel = new Vector2(0, 0),
        angle = 0,
        radius = 10,
        alive = true,
        kind = "entity",
    } = {}) {
        this.pos = pos;
        this.vel = vel;
        this.angle = angle;
        this.radius = radius;
        this.alive = alive;
        this.kind = kind;
    }

    get id() {
        return this.#id;
    }

    // Compatibility getters/setters for callers accessing scalar coordinates
    get x() {
        return this.pos.x;
    }

    set x(value) {
        this.#check_number(value, "x");
        this.pos = new Vector2(value, this.pos.y);
    }

    get y() {
        return this.pos.y;
    }

    set y(value) {
        this.#check_number(value, "y");
        this.pos = new Vector2(this.pos.x, value);
    }

    get vx() {
        return this.vel.x;
    }

    set vx(value) {
        this.#check_number(value, "vx");
        this.vel = new Vector2(value, this.vel.y);
    }

    get vy() {
        return this.vel.y;
    }

    set vy(value) {
        this.#check_number(value, "vy");
        this.vel = new Vector2(this.vel.x, value);
    }

    /**
     * Integrates velocity into position over time step dt.
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        this.#check_number(dt, "dt");
        this.pos = this.pos.add(this.vel.scale(dt));
    }

    #check_number(num, name = "argument") {
        if (typeof num !== "number") {
            throw new TypeError(`Argument ${name} must be a number`);
        }
    }
}
