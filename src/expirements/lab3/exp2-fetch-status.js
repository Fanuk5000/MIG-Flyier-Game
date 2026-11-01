/**
 * Experiment 2: Fetch HTTP Status vs Promise Fulfillment
 *
 * Demonstrates:
 * 1. fetch() fulfills successfully on HTTP 404 (with response.ok === false).
 *    HTTP 404 is an application-level response, NOT a network error!
 * 2. fetch() only rejects on network loss, DNS failure, or aborted requests.
 */

export async function runFetchStatusExperiment() {
    const results = [];
    const baseUrl =
        typeof window !== "undefined"
            ? window.location.origin
            : "https://httpbin.org";

    // Case 1: Valid resource (200 OK)
    try {
        const url =
            typeof window !== "undefined"
                ? "/api/rooms.json"
                : "https://httpbin.org/status/200";
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        results.push({
            scenario: `Valid Endpoint (${url})`,
            fulfilled: true,
            status: res.status,
            ok: res.ok,
            conclusion: "Fulfills with response.ok === true",
        });
    } catch (err) {
        results.push({
            scenario: "Valid Endpoint",
            fulfilled: false,
            error: err.message,
        });
    }

    // Case 2: Missing resource (404 Not Found)
    try {
        const url =
            typeof window !== "undefined"
                ? "/api/non-existent-sector-404.json"
                : "https://httpbin.org/status/404";
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        results.push({
            scenario: `Missing Resource (404: ${url})`,
            fulfilled: true,
            status: res.status,
            ok: res.ok,
            conclusion:
                "CRITICAL: fetch() fulfilled! It did NOT throw! Must manually check response.ok.",
        });
    } catch (err) {
        results.push({
            scenario: "Missing Resource (404)",
            fulfilled: false,
            error: err.message,
        });
    }

    // Case 3: Completely broken domain (DNS / Network failure)
    try {
        await fetch("http://invalid-non-existent-domain-xyz.local", {
            signal: AbortSignal.timeout(1000),
        });
        results.push({
            scenario: "Unresolvable Domain (Network Failure)",
            fulfilled: true,
            conclusion: "Unexpected fulfillment",
        });
    } catch (err) {
        results.push({
            scenario: "Unresolvable Domain (Network Failure)",
            fulfilled: false,
            rejected: true,
            errorName: err.name,
            errorMessage: err.message,
            conclusion:
                "fetch() only rejects on DNS/connection failure or aborts.",
        });
    }

    console.table(results);
    return {
        name: "Fetch Status vs Promise Rejection",
        results,
    };
}
