/**
 * 2D Vector class with immutable (pure) operations.
 */
export class Vector2 {
    /**
     * @param {number} [x=0]
     * @param {number} [y=0]
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        Object.freeze(this);
    }

    /**
     * Returns a new vector scaled by a scalar.
     * @param {number} s
     * @returns {Vector2}
     */
    scale(s) {
        return new Vector2(this.x * s, this.y * s);
    }

    /**
     * Returns sum with vector v.
     * @param {Vector2} v
     * @returns {Vector2}
     */
    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    /**
     * Returns difference with vector v.
     * @param {Vector2} v
     * @returns {Vector2}
     */
    sub(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    /**
     * Vector length (magnitude).
     * @returns {number}
     */
    length() {
        return Math.hypot(this.x, this.y);
    }

    /**
     * Returns unit vector in same direction.
     * @returns {Vector2}
     */
    normalize() {
        const len = this.length();
        if (len === 0) return new Vector2(0, 0);
        return new Vector2(this.x / len, this.y / len);
    }

    /**
     * Dot product with vector v.
     * @param {Vector2} v
     * @returns {number}
     */
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    /**
     * Rotates vector by radians (counter-clockwise in standard Cartesian).
     * @param {number} rad
     * @returns {Vector2}
     */
    rotate(rad) {
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return new Vector2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos,
        );
    }

    /**
     * Creates a vector from standard angle in radians.
     * @param {number} rad
     * @param {number} [length=1]
     * @returns {Vector2}
     */
    static fromAngle(rad, length = 1) {
        return new Vector2(Math.cos(rad) * length, Math.sin(rad) * length);
    }

    /**
     * Creates a vector from heading degrees where 0 deg is UP (screen negative Y).
     * @param {number} deg
     * @param {number} [length=1]
     * @returns {Vector2}
     */
    static fromHeadingDegrees(deg, length = 1) {
        const rad = (deg * Math.PI) / 180;
        return new Vector2(Math.sin(rad) * length, -Math.cos(rad) * length);
    }
}
