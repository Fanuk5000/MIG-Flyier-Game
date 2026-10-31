/**
 * Experiment 3: Parallel (Promise.all) vs Sequential (await in loop) Benchmark
 *
 * Demonstrates:
 * 1. Sequential execution with await forces waterfalls: Total Time = sum(T_i).
 * 2. Parallel execution with Promise.all runs concurrently: Total Time = max(T_i).
 */

function simulateAsyncNetworkLoad(id, delayMs) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ id, delayMs });
        }, delayMs);
    });
}

export async function runParallelVsSequentialExperiment() {
    const payloads = [
        { name: "Ship Sprite", delay: 80 },
        { name: "Shahed Drone Sprite", delay: 110 },
        { name: "Laser Audio Clip", delay: 60 },
        { name: "Explosion Audio Clip", delay: 90 },
        { name: "Tactical Arena JSON", delay: 70 },
    ];

    const totalTheoreticalSequential = payloads.reduce(
        (sum, p) => sum + p.delay,
        0,
    );
    const maxTheoreticalParallel = Math.max(...payloads.map((p) => p.delay));

    // 1. Sequential Execution
    const seqStart = performance.now();
    const seqResults = [];
    for (const item of payloads) {
        const res = await simulateAsyncNetworkLoad(item.name, item.delay);
        seqResults.push(res);
    }
    const seqDuration = performance.now() - seqStart;

    // 2. Parallel Execution (Promise.all)
    const parStart = performance.now();
    const parResults = await Promise.all(
        payloads.map((item) => simulateAsyncNetworkLoad(item.name, item.delay)),
    );
    const parDuration = performance.now() - parStart;

    const speedup = (seqDuration / parDuration).toFixed(2);

    const report = {
        name: "Parallel vs Sequential Benchmark",
        itemsCount: payloads.length,
        theoretical: {
            sequentialSumMs: totalTheoreticalSequential,
            parallelMaxMs: maxTheoreticalParallel,
        },
        measured: {
            sequentialTimeMs: Number(seqDuration.toFixed(2)),
            parallelTimeMs: Number(parDuration.toFixed(2)),
            speedupMultiplier: `${speedup}x faster`,
        },
    };

    console.log("[Exp 3] Parallel vs Sequential Benchmark Results:");
    console.table(report.measured);
    return report;
}
