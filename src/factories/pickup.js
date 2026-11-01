import { Pickup } from "../physics/entities/pickup.js";

/**
 * Factory for creating configured pickup items with attached gameplay effects.
 */
export const PickupFactory = {
    /**
     * Creates a shield recharge pickup.
     * @param {Vector2} pos
     * @param {number} [amount=50]
     * @returns {Pickup}
     */
    createShield(pos, amount = 50) {
        return new Pickup({
            pos,
            type: "shield",
            onCollect: (target) => target.addShield?.(amount),
        });
    },

    /**
     * Creates a hull repair pickup.
     * @param {Vector2} pos
     * @param {number} [amount=35]
     * @returns {Pickup}
     */
    createRepair(pos, amount = 35) {
        return new Pickup({
            pos,
            type: "repair",
            onCollect: (target) => target.heal?.(amount),
        });
    },

    /**
     * Creates a random bonus pickup (50% shield, 50% repair).
     * @param {Vector2} pos
     * @returns {Pickup}
     */
    createRandom(pos) {
        return Math.random() < 0.5
            ? this.createShield(pos)
            : this.createRepair(pos);
    },
};
