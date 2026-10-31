import { runMicrotasksExperiment } from "./exp1-microtasks.js";
import { runFetchStatusExperiment } from "./exp2-fetch-status.js";
import { runParallelVsSequentialExperiment } from "./exp3-parallel-vs-sequential.js";
import { runAbortControllerExperiment } from "./exp4-abort-controller.js";
import { runEventTargetExperiment } from "./exp5-event-target.js";

export const experiments = {
    exp1: runMicrotasksExperiment,
    exp2: runFetchStatusExperiment,
    exp3: runParallelVsSequentialExperiment,
    exp4: runAbortControllerExperiment,
    exp5: runEventTargetExperiment,
};

export async function runAll() {
    console.log("=== RUNNING ALL LAB 03 EXPERIMENTS ===");
    const results = {};
    for (const [key, fn] of Object.entries(experiments)) {
        console.group(`--- Running ${key} ---`);
        try {
            results[key] = await fn();
        } catch (err) {
            results[key] = { error: err.message };
            console.error(err);
        }
        console.groupEnd();
    }
    console.log("=== ALL EXPERIMENTS COMPLETE ===");
    return results;
}

// Attach to window for interactive browser DevTools execution:
// Open Console -> `window.lab3.runAll()` or `window.lab3.exp1()`
if (typeof window !== "undefined") {
    window.lab3 = {
        ...experiments,
        runAll,
    };
    console.log(
        "%c[Lab 03 Experiments Ready] Run `window.lab3.runAll()` or `window.lab3.exp1()` in console.",
        "color: #38bdf8; font-weight: bold;",
    );
}
