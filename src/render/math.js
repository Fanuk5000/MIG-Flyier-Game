/**
 * Linear interpolation between two scalar numbers.
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} alpha - Blend factor [0, 1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, alpha) {
  return a * (1 - alpha) + b * alpha;
}

/**
 * Shortest-path angular interpolation (in degrees).
 * Prevents 350-degree spin-around glitch when crossing 0°/360° boundary.
 * @param {number} prev - Previous angle in degrees
 * @param {number} curr - Current angle in degrees
 * @param {number} alpha - Blend factor [0, 1)
 * @returns {number} Smooth interpolated angle
 */
export function lerpAngle(prev, curr, alpha) {
  let diff = (curr - prev) % 360;

  // Wrap diff into [-180, +180] range to take shortest arc
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  return prev + diff * alpha;
}
