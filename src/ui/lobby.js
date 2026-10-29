import { fetchJson } from "../assets/loader.js";

/**
 * HTTP Room Lobby state controller.
 * Extends EventTarget to decouple network polling & cancellation from DOM rendering.
 *
 * Emits:
 * - "roomsChanged": { detail: { rooms } }
 * - "error":        { detail: { error, message } }
 * - "joined":       { detail: { room, roomId, playerName } }
 * - "aborted":      { detail: { reason } }
 */
export class Lobby extends EventTarget {
    #controller = null;
    #timerId = null;

    /**
     * @param {Object} [options={}]
     * @param {string} [options.endpoint="/api/rooms.json"]
     * @param {number} [options.timeoutMs=3000]
     */
    constructor({ endpoint = "/api/rooms.json", timeoutMs = 3000 } = {}) {
        super();
        this.endpoint = endpoint;
        this.timeoutMs = timeoutMs;
        this.rooms = [];
        this.loading = false;
    }

    /**
     * Fetches the room list with a 3000ms timeout and AbortController support.
     * Cancels any previous in-flight request before starting a new one.
     * @returns {Promise<Array<Object>>}
     */
    async refresh() {
        // Cancel previous in-flight request if still pending
        if (this.#controller) {
            this.#controller.abort("superseded");
        }

        const manualController = new AbortController();
        this.#controller = manualController;
        this.loading = true;

        const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
        const signal =
            typeof AbortSignal.any === "function"
                ? AbortSignal.any([manualController.signal, timeoutSignal])
                : this.#combineSignals(manualController.signal, timeoutSignal);

        try {
            const payload = await fetchJson(this.endpoint, signal);
            const rooms = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.rooms)
                  ? payload.rooms
                  : [];

            this.rooms = rooms;
            this.loading = false;

            this.dispatchEvent(
                new CustomEvent("roomsChanged", {
                    detail: { rooms: this.rooms },
                }),
            );
            return this.rooms;
        } catch (err) {
            this.loading = false;

            // If manually aborted (e.g., left lobby or superseded by newer refresh), do not surface as UI error
            if (manualController.signal.aborted) {
                this.dispatchEvent(
                    new CustomEvent("aborted", {
                        detail: { reason: manualController.signal.reason },
                    }),
                );
                return this.rooms;
            }

            const isTimeout =
                err?.name === "TimeoutError" || timeoutSignal.aborted;
            const message = isTimeout
                ? `Request timed out after ${this.timeoutMs}ms`
                : err?.message || "Failed to load lobby rooms";

            this.dispatchEvent(
                new CustomEvent("error", {
                    detail: { error: err, message, isTimeout },
                }),
            );
            return [];
        } finally {
            if (this.#controller === manualController) {
                this.#controller = null;
            }
        }
    }

    /**
     * Starts periodic room polling and triggers an immediate refresh.
     * @param {number} [intervalMs=4000]
     */
    startAutoRefresh(intervalMs = 4000) {
        this.stopAutoRefresh();
        this.refresh();
        this.#timerId = setInterval(() => {
            this.refresh();
        }, intervalMs);
    }

    /**
     * Stops periodic polling and aborts any in-flight HTTP request.
     */
    stopAutoRefresh() {
        if (this.#timerId !== null) {
            clearInterval(this.#timerId);
            this.#timerId = null;
        }
        if (this.#controller) {
            this.#controller.abort("lobby_stopped");
            this.#controller = null;
        }
        this.loading = false;
    }

    /**
     * Selects a room, cancels lobby polling, and emits "joined".
     * @param {string} [roomId]
     * @param {string} [playerName="Ghost-1"]
     */
    join(roomId, playerName = "Ghost-1") {
        this.stopAutoRefresh();

        const selectedRoom =
            this.rooms.find((r) => r.id === roomId) ||
            this.rooms[0] || {
                id: roomId || "default-sector",
                name: "Default Sector",
                shahedCount: 4,
                difficulty: "Standard",
                ping: 20,
            };

        const cleanName = (playerName || "Ghost-1").trim() || "Ghost-1";

        this.dispatchEvent(
            new CustomEvent("joined", {
                detail: {
                    room: selectedRoom,
                    roomId: selectedRoom.id,
                    playerName: cleanName,
                },
            }),
        );

        return selectedRoom;
    }

    /**
     * Fallback signal combiner for environments without AbortSignal.any.
     * @param {AbortSignal} sigA
     * @param {AbortSignal} sigB
     * @returns {AbortSignal}
     */
    #combineSignals(sigA, sigB) {
        const ctrl = new AbortController();
        const onAbortA = () => ctrl.abort(sigA.reason);
        const onAbortB = () => ctrl.abort(sigB.reason);

        if (sigA.aborted) {
            ctrl.abort(sigA.reason);
        } else if (sigB.aborted) {
            ctrl.abort(sigB.reason);
        } else {
            sigA.addEventListener("abort", onAbortA, { once: true });
            sigB.addEventListener("abort", onAbortB, { once: true });
        }
        return ctrl.signal;
    }
}
