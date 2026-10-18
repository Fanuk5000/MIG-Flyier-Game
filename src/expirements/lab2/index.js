import { runExp1Delegation } from "./exp1-delegation.js";
import { runExp2ThisBinding } from "./exp2-this-binding.js";
import { runExp3MapVsObject } from "./exp3-map-vs-object.js";

export { runExp1Delegation, runExp2ThisBinding, runExp3MapVsObject };

/**
 * Executes all three Lab 02 theory experiments in console.
 */
export function runLab2Experiments() {
    console.log("=== Running Lab 02 Theory Experiments ===");
    const exp1 = runExp1Delegation();
    const exp2 = runExp2ThisBinding();
    const exp3 = runExp3MapVsObject();
    console.log("=== All Lab 02 Experiments Complete ===");

    return { exp1, exp2, exp3 };
}

// Auto-run if opened directly in browser environment
if (typeof window !== "undefined") {
    window.runLab2Experiments = runLab2Experiments;
}
