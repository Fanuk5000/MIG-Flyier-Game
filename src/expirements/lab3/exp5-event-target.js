/**
 * Experiment 5: EventTarget Decoupling & Converting Events to One-Shot Promises
 *
 * Demonstrates:
 * 1. Observer pattern via native EventTarget (multiple decoupled subscribers).
 * 2. Converting a recurring event listener into a single one-shot Promise (with optional timeout/abort).
 */

/**
 * Utility: Converts a single event emission on an EventTarget into a Promise.
 * @param {EventTarget} target
 * @param {string} eventName
 * @param {Object} [options={}]
 * @param {number} [options.timeoutMs=5000]
 * @returns {Promise<any>}
 */
export function once(target, eventName, { timeoutMs = 5000 } = {}) {
    return new Promise((resolve, reject) => {
        let timer = null;

        const onEvent = (event) => {
            if (timer) clearTimeout(timer);
            resolve(event.detail ?? event);
        };

        target.addEventListener(eventName, onEvent, { once: true });

        if (timeoutMs > 0) {
            timer = setTimeout(() => {
                target.removeEventListener(eventName, onEvent);
                reject(
                    new Error(
                        `Timeout waiting for event "${eventName}" after ${timeoutMs}ms`,
                    ),
                );
            }, timeoutMs);
        }
    });
}

export async function runEventTargetExperiment() {
    const bus = new EventTarget();
    const trace = [];

    // 1. Multiple subscribers to bus
    bus.addEventListener("shahedDetected", (e) => {
        trace.push(`Radar HUD: Detected ${e.detail.count} drones`);
    });

    bus.addEventListener("shahedDetected", (e) => {
        trace.push(`Siren System: Alert sounded at Sector ${e.detail.sector}`);
    });

    // 2. Dispatch event to all subscribers
    bus.dispatchEvent(
        new CustomEvent("shahedDetected", {
            detail: { count: 4, sector: "Kyiv-North" },
        }),
    );

    // 3. Awaiting a future one-shot event as a Promise
    setTimeout(() => {
        bus.dispatchEvent(
            new CustomEvent("missileIntercept", {
                detail: { targetId: "drone-01", hit: true },
            }),
        );
    }, 40);

    const interceptResult = await once(bus, "missileIntercept", {
        timeoutMs: 200,
    });
    trace.push(
        `Missile System (Awaited Promise): Target intercepted -> ${interceptResult.targetId}`,
    );

    console.log("[Exp 5] EventTarget Execution Trace:");
    console.log(trace);

    return {
        name: "EventTarget & Promise Bridge",
        trace,
    };
}
