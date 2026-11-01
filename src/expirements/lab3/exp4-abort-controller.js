/**
 * Experiment 4: AbortController, Timeouts & Listener Cleanup
 *
 * Demonstrates:
 * 1. Manual cancellation mid-flight via controller.abort("User clicked Cancel").
 * 2. Automatic timeouts via AbortSignal.timeout(ms).
 * 3. Cleaning up abort listeners to prevent memory leaks in persistent objects.
 */

function cancellableDelay(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException("Aborted immediately", "AbortError"));
            return;
        }

        let timer = null;
        const onAbort = () => {
            clearTimeout(timer);
            signal.removeEventListener("abort", onAbort);
            reject(
                new DOMException(
                    `Aborted: ${signal.reason || "Operation aborted"}`,
                    "AbortError",
                ),
            );
        };

        timer = setTimeout(() => {
            if (signal) {
                signal.removeEventListener("abort", onAbort);
            }
            resolve(`Done after ${ms}ms`);
        }, ms);

        if (signal) {
            signal.addEventListener("abort", onAbort, { once: true });
        }
    });
}

export async function runAbortControllerExperiment() {
    const logs = [];

    // Case 1: Manual Cancellation
    const manualCtrl = new AbortController();
    setTimeout(() => {
        manualCtrl.abort("Pilot bailed from mission");
    }, 40);

    try {
        await cancellableDelay(200, manualCtrl.signal);
        logs.push("Case 1: Failed to cancel");
    } catch (err) {
        logs.push({
            case: "1. Manual Abort",
            cancelled: true,
            errorName: err.name,
            reason: manualCtrl.signal.reason,
        });
    }

    // Case 2: AbortSignal.timeout()
    try {
        const timeoutSignal = AbortSignal.timeout(50);
        await cancellableDelay(250, timeoutSignal);
        logs.push("Case 2: Failed to timeout");
    } catch (err) {
        logs.push({
            case: "2. Automatic Timeout",
            timedOut: true,
            errorName: err.name,
            reason: "Timeout reached",
        });
    }

    // Case 3: Completed before timeout (clean execution)
    try {
        const timeoutSignal = AbortSignal.timeout(150);
        const res = await cancellableDelay(30, timeoutSignal);
        logs.push({
            case: "3. Completed in time",
            result: res,
            aborted: timeoutSignal.aborted,
        });
    } catch (err) {
        logs.push("Case 3: Unexpected error");
    }

    console.table(logs);
    return {
        name: "AbortController & Timeout",
        logs,
    };
}
