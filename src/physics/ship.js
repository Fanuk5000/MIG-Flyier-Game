/**
 * Factory creating initial ship state with default physical parameters.
 * @param {number} [x=0]
 * @param {number} [y=0]
 */
export function createShip(x = 0, y = 0) {
    return {
        x,
        y,
        vx: 0,
        vy: 0,
        angle: 0,
        thrust: false,
        thrustPower: 450, // Acceleration in pixels/s^2
        turnRate: 180, // Rotation in degrees/s
        drag: 0.8, // Velocity damping
        maxSpeed: 400, // Speed clamp in pixels/s
    };
}

/**
 * Pure physics step: applies rotation, thrust, drag, speed clamp, and movement.
 * Pure function of (ship, input, dt). Zero DOM, zero screen bounds.
 * @param {ReturnType<typeof createShip>} ship
 * @param {Object} input - Key state from createInput()
 * @param {number} dt - Delta time in seconds
 * @returns {ReturnType<typeof createShip>} New ship state
 */
export function integrate(ship, input, dt) {
    let { x, y, vx, vy, angle, thrustPower, turnRate, drag, maxSpeed } = ship;

    // 1. Angular steering (in degrees)
    if (input.turnLeft) {
        angle -= turnRate * dt;
    }
    if (input.turnRight) {
        angle += turnRate * dt;
    }

    // 2. Thrust acceleration along heading
    const isThrusting = Boolean(input.moveForward);
    if (isThrusting) {
        const rad = angle * (Math.PI / 180);
        const ax = Math.sin(rad) * thrustPower;
        const ay = -Math.cos(rad) * thrustPower;
        vx += ax * dt;
        vy += ay * dt;
    }

    // 3. Drag damping (air resistance)
    const damping = Math.max(0, 1 - drag * dt);
    vx *= damping;
    vy *= damping;

    // 4. Speed clamping
    const currentSpeed = Math.hypot(vx, vy);
    if (currentSpeed > maxSpeed && currentSpeed > 0) {
        const scale = maxSpeed / currentSpeed;
        vx *= scale;
        vy *= scale;
    }

    // 5. Position integration
    x += vx * dt;
    y += vy * dt;

    return {
        ...ship,
        x,
        y,
        vx,
        vy,
        angle,
        thrust: isThrusting,
    };
}

export const updateShipState = integrate;
