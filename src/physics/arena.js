/**
 * Wraps entity coordinates around arena boundaries (toroidal geometry).
 * Preserves class prototype and methods on Entity instances.
 * @param {Object} entity - Entity with x, y getters/setters or properties
 * @param {number} width - Arena width in pixels
 * @param {number} height - Arena height in pixels
 * @returns {Object} Wrapped entity instance
 */
export function wrapArena(entity, width, height) {
    let x = entity.x;
    let y = entity.y;
    let wrapped = false;

    if (x < 0) {
        x = width;
        wrapped = true;
    } else if (x > width) {
        x = 0;
        wrapped = true;
    }

    if (y < 0) {
        y = height;
        wrapped = true;
    } else if (y > height) {
        y = 0;
        wrapped = true;
    }

    entity.x = x;
    entity.y = y;

    // Disable homing when bullet crosses screen boundary
    if (wrapped && entity.kind === "bullet" && entity.homing) {
        entity.homing = null;
    }

    return entity;
}
