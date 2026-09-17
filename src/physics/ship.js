/**
 * Pure physics step: calculates next state from input and dt.
 * @param {typeof currentShip} shipState
 * @param {ReturnType<typeof input.getState>} keys
 * @param {number} dt
 * @param {number} alpha - Interpolation ratio between [0, 1)
 */
export function integrate(shipState, keys, dt) {
    // * Left for future: implement turning and thrusting physics
    // const position = shipState.x;
    // if (keys.turnLeft) position -= shipState.turnSpeed * dt;
    // if (keys.turnRight) position += shipState.turnSpeed * dt;
    // if (keys.thrust) {
    //     x += Math.sin(angle) * shipState.thrust * dt;
    //     y -= Math.cos(angle) * shipState.thrust * dt;
    // }

    let x = shipState.x;
    let y = shipState.y;
    const angle = shipState.angle;

    if (keys.turnLeft) {
        x -= shipState.speed * dt;
    }
    if (keys.turnRight) {
        x += shipState.speed * dt;
    }
    if (keys.moveBackward) {
        x -= Math.sin(angle) * shipState.speed * dt;
        y += Math.cos(angle) * shipState.speed * dt;
    }
    if (keys.moveForward) {
        x += Math.sin(angle) * shipState.speed * dt;
        y -= Math.cos(angle) * shipState.speed * dt;
    }

    // Toroidal screen boundary wrap
    if (x < 0) x = renderCtx.width;
    if (x > renderCtx.width) x = 0;
    if (y < 0) y = renderCtx.height;
    if (y > renderCtx.height) y = 0;

    return {
        ...shipState,
        x,
        y,
        angle,
    };
}
export const updateShipState = integrate; // Alias for clarity in main.js
