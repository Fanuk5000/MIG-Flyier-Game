export class World {
    #entites = new Map();

    spawn(entity) {
        this.#entites.set(entity.id, entity);
        return entity;
    }

    despawn(id) {
        this.#check_id(id);
        const entity = this.#entites.get(id);
        if (entity) {
            entity.alive = false;
        }
    }

    get(id) {
        return this.get_entity(id);
    }

    get_entity(id) {
        this.#check_id(id);
        return this.#entites.get(id);
    }

    // Iteration over all entities in the world
    [Symbol.iterator]() {
        return this.#entites.values();
    }

    // Generator function to yield entities of a specific kind
    *ofKind(kind) {
        for (const entity of this.#entites.values()) {
            if (entity.kind === kind) {
                yield entity;
            }
        }
    }

    step(dt, inputs) {
        // 1. Update all alive entities
        for (const entity of this.#entites.values()) {
            if (!entity.alive) continue;

            if (entity.kind === "ship") {
                entity.update(dt, inputs);
            } else {
                entity.update(dt);
            }
        }

        // 2. Deferred sweep: purge dead entities at end of step
        for (const [id, entity] of this.#entites) {
            if (!entity.alive) {
                this.#entites.delete(id);
            }
        }
    }

    #check_id(id) {
        if (typeof id !== "string") {
            throw new TypeError("id must be a string");
        }
        if (!this.#entites.has(id)) {
            throw new Error(`Entity with id ${id} does not exist`);
        }
    }
}
