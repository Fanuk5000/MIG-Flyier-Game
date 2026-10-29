/**
 * Asset Pipeline Loader
 * Handles async fetching, decoding, retries, and concurrent loading with progress tracking.
 */

export class HttpError extends Error {
    /**
     * @param {number} status
     * @param {string} statusText
     * @param {string} url
     */
    constructor(status, statusText, url) {
        super(`HTTP ${status} (${statusText || "Error"}) fetching ${url}`);
        this.name = "HttpError";
        this.status = status;
        this.statusText = statusText;
        this.url = url;
    }
}

/**
 * Fetches and parses a JSON resource. Throws HttpError on !response.ok.
 * @param {string} url
 * @param {AbortSignal} [signal]
 * @returns {Promise<any>}
 */
export async function fetchJson(url, signal) {
    if (signal?.aborted) {
        throw new DOMException("The operation was aborted", "AbortError");
    }

    const response = await fetch(url, { signal });
    if (!response.ok) {
        throw new HttpError(response.status, response.statusText, url);
    }

    return await response.json();
}

/**
 * Wraps an HTMLImageElement in a Promise with AbortSignal cancellation support.
 * @param {string} url
 * @param {AbortSignal} [signal]
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(url, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException("The operation was aborted", "AbortError"));
            return;
        }

        const img = new Image();
        let onAbort = null;

        const cleanup = () => {
            img.onload = null;
            img.onerror = null;
            if (signal && onAbort) {
                signal.removeEventListener("abort", onAbort);
            }
        };

        img.onload = () => {
            cleanup();
            resolve(img);
        };

        img.onerror = () => {
            cleanup();
            reject(new Error(`Failed to load image from: ${url}`));
        };

        if (signal) {
            onAbort = () => {
                cleanup();
                img.src = "";
                reject(
                    new DOMException("The operation was aborted", "AbortError"),
                );
            };
            signal.addEventListener("abort", onAbort, { once: true });
        }

        img.src = url;
    });
}

/**
 * Fetches an audio file as an ArrayBuffer and decodes it into an AudioBuffer using Web Audio API.
 * @param {AudioContext} ctx
 * @param {string} url
 * @param {AbortSignal} [signal]
 * @returns {Promise<AudioBuffer>}
 */
export async function loadAudio(ctx, url, signal) {
    if (!ctx) {
        throw new Error("AudioContext is required to decode audio");
    }

    if (signal?.aborted) {
        throw new DOMException("The operation was aborted", "AbortError");
    }

    const response = await fetch(url, { signal });
    if (!response.ok) {
        throw new HttpError(response.status, response.statusText, url);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (signal?.aborted) {
        throw new DOMException("The operation was aborted", "AbortError");
    }

    return new Promise((resolve, reject) => {
        ctx.decodeAudioData(
            arrayBuffer,
            (decoded) => resolve(decoded),
            (err) =>
                reject(
                    err || new Error(`Failed to decode audio data for ${url}`),
                ),
        );
    });
}

/**
 * Wraps an async function with exponential backoff and jitter.
 * Crucial Rule: NEVER retry HTTP 4xx client errors (400-499); only retry network errors or 5xx server errors.
 *
 * @template T
 * @param {(signal?: AbortSignal) => Promise<T>} asyncFn
 * @param {Object} [options]
 * @param {number} [options.attempts=3]
 * @param {number} [options.baseMs=200]
 * @param {number} [options.factor=2]
 * @param {boolean} [options.jitter=true]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<T>}
 */
export async function withRetry(
    asyncFn,
    { attempts = 3, baseMs = 200, factor = 2, jitter = true, signal } = {},
) {
    let lastError;

    for (let attempt = 0; attempt < attempts; attempt++) {
        if (signal?.aborted) {
            throw new DOMException("The operation was aborted", "AbortError");
        }

        try {
            return await asyncFn(signal);
        } catch (err) {
            lastError = err;

            // Abort should stop immediately without retrying
            if (err?.name === "AbortError" || signal?.aborted) {
                throw err;
            }

            // Never retry 4xx errors (client errors: 404, 403, 400, etc.)
            const is4xx =
                (err instanceof HttpError || typeof err?.status === "number") &&
                err.status >= 400 &&
                err.status < 500;
            if (is4xx) {
                throw err;
            }

            // Exhausted attempts
            if (attempt === attempts - 1) {
                throw err;
            }

            // Compute backoff delay: baseMs * (factor ^ attempt) + random jitter
            const expDelay = baseMs * factor ** attempt;
            const delay = jitter ? expDelay + Math.random() * baseMs : expDelay;

            await new Promise((resolve, reject) => {
                let timer = null;
                let onAbort = null;

                const cleanup = () => {
                    if (timer) clearTimeout(timer);
                    if (signal && onAbort) {
                        signal.removeEventListener("abort", onAbort);
                    }
                };

                if (signal?.aborted) {
                    reject(
                        new DOMException(
                            "The operation was aborted",
                            "AbortError",
                        ),
                    );
                    return;
                }

                timer = setTimeout(() => {
                    cleanup();
                    resolve();
                }, delay);

                if (signal) {
                    onAbort = () => {
                        cleanup();
                        reject(
                            new DOMException(
                                "The operation was aborted",
                                "AbortError",
                            ),
                        );
                    };
                    signal.addEventListener("abort", onAbort, { once: true });
                }
            });
        }
    }

    throw lastError;
}

/**
 * Loads all assets in the given manifest concurrently via Promise.all.
 *
 * @param {string|Object} manifest Object containing sprite/audio/arena maps, or URL to manifest.json
 * @param {Object} [options]
 * @param {AudioContext} [options.audioCtx] AudioContext instance for decoding audio
 * @param {(progress: number) => void} [options.onProgress] Callback receiving normalized progress (0.0 to 1.0)
 * @param {AbortSignal} [options.signal] AbortSignal for canceling in-flight loads
 * @returns {Promise<{ sprites: Record<string, HTMLImageElement>, audio: Record<string, AudioBuffer>, arena: Record<string, any>, config: Record<string, any> }>}
 */
export async function loadAll(
    manifest,
    { audioCtx = null, onProgress = null, signal = null } = {},
) {
    let manifestData = manifest;
    if (typeof manifest === "string") {
        manifestData = await withRetry((s) => fetchJson(manifest, s), {
            signal,
        });
    }

    if (!manifestData || typeof manifestData !== "object") {
        throw new Error(
            "Invalid manifest: expected an object or valid manifest URL",
        );
    }

    const sprites = manifestData.sprites || {};
    const audio = manifestData.audio || {};
    const arena = manifestData.arena || manifestData.config || {};

    const spriteEntries = Object.entries(sprites);
    const audioEntries = Object.entries(audio);
    const arenaEntries = Object.entries(arena);

    const totalCount =
        spriteEntries.length + audioEntries.length + arenaEntries.length;
    let loadedCount = 0;

    if (typeof onProgress === "function") {
        onProgress(totalCount === 0 ? 1 : 0);
    }

    const notifyProgress = () => {
        loadedCount++;
        if (typeof onProgress === "function" && totalCount > 0) {
            onProgress(Math.min(1, loadedCount / totalCount));
        }
    };

    const tasks = [];

    for (const [key, url] of spriteEntries) {
        tasks.push(
            withRetry((s) => loadImage(url, s), { signal }).then((img) => {
                notifyProgress();
                return { category: "sprites", key, asset: img };
            }),
        );
    }

    for (const [key, url] of audioEntries) {
        tasks.push(
            (async () => {
                let sound = null;
                if (audioCtx) {
                    sound = await withRetry(
                        (s) => loadAudio(audioCtx, url, s),
                        { signal },
                    );
                } else {
                    // If AudioContext not provided, fetch raw ArrayBuffer
                    const res = await withRetry(
                        async (s) => {
                            const resp = await fetch(url, { signal: s });
                            if (!resp.ok)
                                throw new HttpError(
                                    resp.status,
                                    resp.statusText,
                                    url,
                                );
                            return resp;
                        },
                        { signal },
                    );
                    sound = await res.arrayBuffer();
                }
                notifyProgress();
                return { category: "audio", key, asset: sound };
            })(),
        );
    }

    for (const [key, url] of arenaEntries) {
        tasks.push(
            withRetry((s) => fetchJson(url, s), { signal }).then((json) => {
                notifyProgress();
                return { category: "arena", key, asset: json };
            }),
        );
    }

    const results = await Promise.all(tasks);

    const registry = {
        sprites: {},
        audio: {},
        arena: {},
        config: {},
    };

    for (const { category, key, asset } of results) {
        registry[category][key] = asset;
        if (category === "arena") {
            registry.config[key] = asset;
        }
    }

    return registry;
}

/**
 * Creates a placeholder checkerboard texture for graceful 404 image fallback.
 * @param {number} [width=32]
 * @param {number} [height=32]
 * @returns {HTMLCanvasElement|null}
 */
export function createFallbackTexture(width = 32, height = 32) {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
        const halfW = width / 2;
        const halfH = height / 2;
        ctx.fillStyle = "#ff00ff"; // magenta
        ctx.fillRect(0, 0, halfW, halfH);
        ctx.fillRect(halfW, halfH, halfW, halfH);
        ctx.fillStyle = "#000000"; // black
        ctx.fillRect(halfW, 0, halfW, halfH);
        ctx.fillRect(0, halfH, halfW, halfH);
    }
    return canvas;
}

/**
 * Creates a silent stub AudioBuffer for graceful missing sound degradation.
 * @param {AudioContext} ctx
 * @param {number} [durationSec=0.1]
 * @returns {AudioBuffer|null}
 */
export function createSilentAudioBuffer(ctx, durationSec = 0.1) {
    if (!ctx || typeof ctx.createBuffer !== "function") return null;
    const sampleRate = ctx.sampleRate || 44100;
    const frameCount = Math.max(1, Math.floor(sampleRate * durationSec));
    return ctx.createBuffer(1, frameCount, sampleRate);
}
