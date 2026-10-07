/**
 * Experiment 1: Prototype Delegation vs Property Copying.
 * Demonstrates that Object.create establishes a live delegate link, not a snapshot copy.
 */
export function runExp1Delegation() {
    console.group("Experiment 1: Prototype Delegation (Object.create)");

    const a = { hello: "initial prototype value" };
    const b = Object.create(a);

    console.log("1. Initial state:");
    console.log("   a.hello:", a.hello);
    console.log("   b.hello (looked up on prototype):", b.hello);
    console.log("   b.hasOwnProperty('hello'):", b.hasOwnProperty("hello")); // false

    // Mutating prototype object
    a.hello = "mutated prototype value";
    console.log("\n2. After mutating a.hello = 'mutated prototype value':");
    console.log("   b.hello dynamically reflects change:", b.hello);

    // Shadowing on child
    b.hello = "shadowed own value";
    console.log("\n3. After setting b.hello = 'shadowed own value':");
    console.log("   b.hello (own property):", b.hello);
    console.log("   b.hasOwnProperty('hello'):", b.hasOwnProperty("hello")); // true
    console.log("   a.hello remains untouched:", a.hello);

    console.log("\nKey Takeaway: class methods work by delegation (lookup), not copy.");
    console.groupEnd();

    return {
        inherited: b.hello,
        protoValue: a.hello,
        isOwnOnChild: b.hasOwnProperty("hello"),
    };
}
