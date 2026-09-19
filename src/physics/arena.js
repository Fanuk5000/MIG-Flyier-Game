/**
 * Wraps entity coordinates around arena boundaries (toroidal geometry).
 * @param {Object} entity - Entity with x, y coordinates
 * @param {number} width - Arena width in pixels
 * @param {number} height - Arena height in pixels
 * @returns {Object} Wrapped entity
 */
export function wrapArena(entity, width, height) {
  let x = entity.x;
  let y = entity.y;

  if (x < 0) x = width;
  else if (x > width) x = 0;

  if (y < 0) y = height;
  else if (y > height) y = 0;

  if (x === entity.x && y === entity.y) return entity;

  return {
    ...entity,
    x,
    y,
  };
}
