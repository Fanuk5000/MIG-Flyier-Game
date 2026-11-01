import { PickupFactory } from "../factories/pickup.js";
import { wrapArena } from "./arena.js";
import { findCollisions } from "./collision.js";
import { spawnExplosion } from "./entities/explosion.js";
import { Shahed } from "./entities/shahed.js";
import { Vector2 } from "./vector.js";

export class World extends EventTarget {
    #entities = new Map();
    #score = 0;
    #shipRespawnTimer = 0;
    #shipRef = null;

    get score() {
        return this.#score;
    }

    set score(val) {
        const prev = this.#score;
        this.#score = val;
        if (prev !== val) {
            this.dispatchEvent(
                new CustomEvent("scoreChanged", {
                    detail: { score: this.#score, delta: val - prev },
                }),
            );
        }
    }

    spawn(entity) {
        this.#entities.set(entity.id, entity);
        if (entity.kind === "ship") {
            this.#shipRef = entity;
        }
        return entity;
    }

    despawn(id) {
        this.#check_id(id);
        const entity = this.#entities.get(id);
        if (entity) {
            entity.alive = false;
        }
    }

    get(id) {
        return this.get_entity(id);
    }

    get_entity(id) {
        this.#check_id(id);
        return this.#entities.get(id);
    }

    // Iteration over all entities in the world
    [Symbol.iterator]() {
        return this.#entities.values();
    }

    // Generator function to yield entities of a specific kind
    *ofKind(kind) {
        for (const entity of this.#entities.values()) {
            if (entity.kind === kind) {
                yield entity;
            }
        }
    }

    /**
     * Pregenerates initial drifting obstacles.
     * @param {number} width - Arena width
     * @param {number} height - Arena height
     * @param {number} [count=4] - Quantity of Shahed drones
     * @param {Entity} [target=null] - Target entity (player ship) to slowly track
     */
    pregenerate(width, height, count = 4, target = null) {
        const homingTarget = target || this.#shipRef;
        for (let i = 0; i < count; i++) {
            const headingDeg = Math.random() * 360;
            const speed = 40 + Math.random() * 15;
            this.spawn(
                new Shahed({
                    pos: new Vector2(
                        Math.random() * width,
                        Math.random() * height,
                    ),
                    vel: Vector2.fromHeadingDegrees(headingDeg, speed),
                    angle: headingDeg,
                    radius: 22 + Math.random() * 3,
                    speed,
                    target: homingTarget,
                }),
            );
        }
    }

    step(dt, inputs, arenaWidth, arenaHeight) {
        // 1. Update all alive entities
        for (const entity of this.#entities.values()) {
            if (!entity.alive) continue;

            if (entity.kind === "ship") {
                entity.update(dt, inputs);
            } else {
                entity.update(dt);
            }

            if (arenaWidth !== undefined && arenaHeight !== undefined) {
                wrapArena(entity, arenaWidth, arenaHeight);
            }
        }

        // 2. Resolve Collisions
        this.#resolveCollisions();

        // 3. Handle Ship Respawn (2 seconds delay at safe location)
        this.#handleRespawn(dt, arenaWidth, arenaHeight);

        // 4. Deferred sweep: purge dead entities at end of step
        for (const [id, entity] of this.#entities) {
            // Keep ship in map even when dead so state/respawn is maintained
            if (!entity.alive && entity.kind !== "ship") {
                this.#entities.delete(id);
            }
        }
    }

    #resolveCollisions() {
        for (const [a, b] of findCollisions(this)) {
            if (!a.alive || !b.alive) continue;

            // Bullet vs Shahed
            if (a.kind === "bullet" && b.kind === "shahed") {
                this.#bulletHitShahed(a, b);
            } else if (b.kind === "bullet" && a.kind === "shahed") {
                this.#bulletHitShahed(b, a);
            }

            // Bullet vs Ship
            else if (a.kind === "bullet" && b.kind === "ship") {
                this.#bulletHitShip(a, b);
            } else if (b.kind === "bullet" && a.kind === "ship") {
                this.#bulletHitShip(b, a);
            }

            // Ship vs Shahed
            else if (a.kind === "ship" && b.kind === "shahed") {
                this.#shipCrashShahed(a, b);
            } else if (b.kind === "ship" && a.kind === "shahed") {
                this.#shipCrashShahed(b, a);
            }

            // Ship vs Pickup
            else if (a.kind === "ship" && b.kind === "pickup") {
                this.#shipCollectPickup(a, b);
            } else if (b.kind === "ship" && a.kind === "pickup") {
                this.#shipCollectPickup(b, a);
            }
        }
    }

    #bulletHitShahed(bullet, shahed) {
        bullet.alive = false;
        shahed.takeDamage(bullet.damage || 25);
        this.dispatchEvent(
            new CustomEvent("hit", {
                detail: { pos: bullet.pos, target: "shahed" },
            }),
        );

        if (!shahed.alive) {
            this.score += 100;
            this.dispatchEvent(
                new CustomEvent("exploded", {
                    detail: { pos: shahed.pos, radius: 18, kind: "shahed" },
                }),
            );
            spawnExplosion(this, shahed.pos, 18, "#ef4444");

            // 35% chance to drop bonus Pickup on destruction
            if (Math.random() < 0.35) {
                this.spawn(PickupFactory.createRandom(shahed.pos));
            }
        } else {
            spawnExplosion(this, bullet.pos, 4, "#facc15");
        }
    }

    #bulletHitShip(bullet, ship) {
        bullet.alive = false;
        ship.takeDamage(bullet.damage || 25);
        this.dispatchEvent(
            new CustomEvent("hit", {
                detail: {
                    pos: bullet.pos,
                    target: "ship",
                    hp: ship.hp,
                    shield: ship.shield,
                },
            }),
        );

        if (!ship.alive) {
            this.dispatchEvent(
                new CustomEvent("exploded", {
                    detail: { pos: ship.pos, radius: 24, kind: "ship" },
                }),
            );
            this.dispatchEvent(
                new CustomEvent("shipDied", {
                    detail: { pos: ship.pos },
                }),
            );
            spawnExplosion(this, ship.pos, 24, "#ef4444");
            this.#shipRespawnTimer = 2.0;
        } else {
            spawnExplosion(this, bullet.pos, 4, "#ef4444");
        }
    }

    #shipCrashShahed(ship, shahed) {
        ship.takeDamage(50);
        shahed.takeDamage(50);
        this.dispatchEvent(
            new CustomEvent("hit", {
                detail: {
                    pos: ship.pos,
                    target: "crash",
                    hp: ship.hp,
                    shield: ship.shield,
                },
            }),
        );

        if (!ship.alive) {
            this.dispatchEvent(
                new CustomEvent("exploded", {
                    detail: { pos: ship.pos, radius: 24, kind: "ship" },
                }),
            );
            this.dispatchEvent(
                new CustomEvent("shipDied", {
                    detail: { pos: ship.pos },
                }),
            );
            spawnExplosion(this, ship.pos, 24, "#ef4444");
            this.#shipRespawnTimer = 2.0;
        } else {
            spawnExplosion(this, ship.pos, 8, "#f97316");
        }

        if (!shahed.alive) {
            this.score += 50;
            this.dispatchEvent(
                new CustomEvent("exploded", {
                    detail: { pos: shahed.pos, radius: 18, kind: "shahed" },
                }),
            );
            spawnExplosion(this, shahed.pos, 18, "#ef4444");
        }
    }

    #shipCollectPickup(ship, pickup) {
        pickup.applyTo(ship);
        pickup.alive = false;
        this.score += 25;
        const color = pickup.type === "shield" ? "#38bdf8" : "#34d399";
        spawnExplosion(this, pickup.pos, 10, color);
        this.dispatchEvent(
            new CustomEvent("pickupCollected", {
                detail: {
                    type: pickup.type,
                    pos: pickup.pos,
                    hp: ship.hp,
                    shield: ship.shield,
                },
            }),
        );
    }

    #handleRespawn(dt, width = 800, height = 600) {
        if (!this.#shipRef || this.#shipRef.alive) return;

        this.#shipRespawnTimer -= dt;
        if (this.#shipRespawnTimer <= 0) {
            // Find safe spot (far from Shaheds)
            const safePos = this.#findSafePosition(width, height);
            this.#shipRef.respawn(safePos);
            spawnExplosion(this, safePos, 12, "#38bdf8");
            this.dispatchEvent(
                new CustomEvent("respawned", {
                    detail: {
                        pos: safePos,
                        hp: this.#shipRef.hp,
                        shield: this.#shipRef.shield,
                    },
                }),
            );
        }
    }

    #findSafePosition(width, height) {
        let bestPos = new Vector2(width / 2, height / 2);
        let maxMinDist = 0;

        // Try 8 candidate points, pick one farthest from any Shahed drone
        for (let i = 0; i < 8; i++) {
            const candidate = new Vector2(
                100 + Math.random() * (width - 200),
                100 + Math.random() * (height - 200),
            );

            let minDist = Infinity;
            for (const shahed of this.ofKind("shahed")) {
                const dist = candidate.sub(shahed.pos).length();
                if (dist < minDist) minDist = dist;
            }

            if (minDist > maxMinDist) {
                maxMinDist = minDist;
                bestPos = candidate;
            }
        }

        return bestPos;
    }

    #check_id(id) {
        if (typeof id !== "string") {
            throw new TypeError("id must be a string");
        }
        if (!this.#entities.has(id)) {
            throw new Error(`Entity with id ${id} does not exist`);
        }
    }
}
