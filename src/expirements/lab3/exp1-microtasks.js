/**
 * Experiment 1: Microtasks vs Macrotasks vs Synchronous Execution Order
 *
 * Demonstrates:
 * 1. Synchronous code executes immediately on the main callstack.
 * 2. Microtask queue (Promise.then, await resumes, queueMicrotask) drains completely
 *    as soon as the callstack empties, before any macrotasks run.
 * 3. Macrotasks (setTimeout, requestAnimationFrame, DOM events) wait for microtasks to finish.
 */

export async function runMicrotasksExperiment() {
    const log = [];
    const record = (msg) => {
        log.push(msg);
        console.log(`[Exp 1] ${msg}`);
    };

    record("1. Synchronous Start (callstack begins)");

    // Macrotask: setTimeout (0ms)
    setTimeout(() => {
        record("7. Macrotask: setTimeout(0) executed");
    }, 0);

    // Browser Animation Frame (runs before paint in browser)
    if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => {
            record("8. Macrotask/Rendering: requestAnimationFrame executed");
        });
    }

    // Microtask: Promise.resolve().then()
    Promise.resolve()
        .then(() => {
            record("3. Microtask: Promise.then() #1");
            return Promise.resolve();
        })
        .then(() => {
            record("5. Microtask: Promise.then() #2 (chained microtask)");
        });

    // Microtask: queueMicrotask()
    if (typeof queueMicrotask === "function") {
        queueMicrotask(() => {
            record("4. Microtask: queueMicrotask executed");
        });
    }

    // Async function desugaring with await
    (async () => {
        record("2. Synchronous inside async function before await");
        await null; // Desugars to: Promise.resolve(null).then(...)
        record("6. Microtask: Resumed after await");
    })();

    record("2. Synchronous End (callstack emptying now)");

    // Wait for all queued tasks to finish
    await new Promise((resolve) => setTimeout(resolve, 60));

    return {
        name: "Microtasks vs Macrotasks",
        trace: log,
        explanation:
            "Synchronous runs first (1 -> 2). Callstack empties. Microtask queue drains completely (3 -> 4 -> 5 -> 6). Macrotasks execute last (7 -> 8).",
    };
}
