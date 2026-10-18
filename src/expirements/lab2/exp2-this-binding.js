/**
 * Experiment 2: Call-Site 'this' Binding and Detached Methods.
 * Demonstrates Kyle Simpson's 4 rules and why detached callbacks lose 'this'.
 */
export function runExp2ThisBinding() {
    console.group("Experiment 2: 'this' Binding and Detached Methods");

    class A {
        m() {
            return this;
        }
    }

    const a = new A();
    const m = a.m;

    console.log("1. Implicit binding (a.m()):");
    console.log("   Result:", a.m() === a ? "returns instance a" : "failed");

    console.log("\n2. Default binding (detached function call m()):");
    let detachedResult;
    try {
        detachedResult = m();
    } catch (err) {
        detachedResult = err.message;
    }
    console.log("   Result:", detachedResult === undefined ? "undefined (strict mode)" : detachedResult);

    console.log("\n3. Explicit binding (m.call(a)):");
    console.log("   Result:", m.call(a) === a ? "returns instance a" : "failed");

    console.log("\n4. Hard binding (m.bind(a)()):");
    const boundM = m.bind(a);
    console.log("   Result:", boundM() === a ? "returns instance a" : "failed");

    console.log("\n5. Lexical arrow closure (() => a.m()):");
    const arrowM = () => a.m();
    console.log("   Result:", arrowM() === a ? "returns instance a" : "failed");

    console.log("\nKey Takeaway: ship.fire passed directly as callback loses 'this'. Wrap in arrow function or bind.");
    console.groupEnd();

    return {
        implicitWorks: a.m() === a,
        detachedIsUndefined: detachedResult === undefined,
        callWorks: m.call(a) === a,
        bindWorks: boundM() === a,
        arrowWorks: arrowM() === a,
    };
}
