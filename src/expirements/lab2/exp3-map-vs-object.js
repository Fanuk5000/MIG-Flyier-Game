/**
 * Experiment 3: Map vs Plain Object Key Behavior.
 * Demonstrates key coercion, prototype collisions, and sizing differences.
 */
export function runExp3MapVsObject() {
    console.group("Experiment 3: Map vs Plain Object");

    const o = { "1": "x" };
    const m = new Map([[1, "x"]]);

    console.log("1. Key Coercion:");
    console.log("   o[1] (number 1 coerced to string '1'):", o[1]); // "x"
    console.log("   o['1']:", o["1"]); // "x"
    console.log("   m.get(1) (number key maintained):", m.get(1)); // "x"
    console.log("   m.get('1') (strict key identity check):", m.get("1")); // undefined

    console.log("\n2. Prototype Collisions:");
    console.log("   o['constructor'] (inherited from Object.prototype):", typeof o["constructor"]); // "function"
    console.log("   m.get('constructor') (safe, no inherited keys):", m.get("constructor")); // undefined

    console.log("\n3. Size Calculation:");
    console.log("   Object.keys(o).length (allocates temporary array):", Object.keys(o).length);
    console.log("   m.size (O(1) property access):", m.size);

    console.log("\nKey Takeaway: Map stores entities safely by ID without type coercion or prototype pollution.");
    console.groupEnd();

    return {
        objectCoercesNumberKey: o[1] === "x",
        mapDistinguishesTypes: m.get(1) === "x" && m.get("1") === undefined,
        objectPollutedByProto: typeof o["constructor"] === "function",
        mapSafeFromProto: m.get("constructor") === undefined,
    };
}
