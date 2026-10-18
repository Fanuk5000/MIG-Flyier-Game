/**
 * Circle-circle collision detection system.
 * Uses squared Euclidean distance to eliminate expensive Math.sqrt calls.
 */

/**
 * Tests whether two circular entities are overlapping.
 * @param {Object} a - Entity with x, y, and radius
 * @param {Object} b - Entity with x, y, and radius
 * @returns {boolean}
 */
export function areColliding(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distSq = dx * dx + dy * dy;
    const radiusSum = a.radius + b.radius;

    return distSq <= radiusSum * radiusSum;
}

/**
 * Generator emitting colliding entity pairs (a, b) from the world.
 * Swappable interface: takes world and yields pairs, allowing replacement
 * with a spatial hash or quadtree in Lab 7 without modifying collision resolution logic.
 *
 * @param {Iterable<Object>} world - Iterable entity collection
 * @yields {[Object, Object]} Colliding entity pair [a, b]
 */
export function* findCollisions(world) {
    const entities = [];
    for (const entity of world) {
        if (entity.alive && entity.radius > 0) {
            entities.push(entity);
        }
    }

    const count = entities.length;
    for (let i = 0; i < count; i++) {
        const a = entities[i];

        for (let j = i + 1; j < count; j++) {
            const b = entities[j];

            // Ignore bullet colliding with its own shooter
            if (a.kind === "bullet" && a.ownerId === b.id) continue;
            if (b.kind === "bullet" && b.ownerId === a.id) continue;

            // Two bullets don't collide with each other
            if (a.kind === "bullet" && b.kind === "bullet") continue;

            if (areColliding(a, b)) {
                yield [a, b];
            }
        }
    }
}

/**
 * Returns an array of all current collision pairs.
 * @param {Iterable<Object>} world
 * @returns {Array<[Object, Object]>}
 */
export function detectCollisions(world) {
    return Array.from(findCollisions(world));
}
