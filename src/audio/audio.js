/**
 * Web Audio Engine (src/audio/audio.js)
 * Encapsulates AudioContext, user-gesture unlocking, zero-latency buffer playback,
 * and decoupled EventTarget event bus subscription.
 */

let sharedCtx = null;
let sharedBuffers = {};

/**
 * Returns or lazily creates the shared AudioContext instance.
 * @returns {AudioContext|null}
 */
export function getAudioContext() {
    if (sharedCtx) return sharedCtx;

    if (typeof window !== "undefined") {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            sharedCtx = new AudioCtx();
        }
    }
    return sharedCtx;
}

/**
 * Unlocks the AudioContext on a user gesture (click, keydown, etc.).
 * @param {AudioContext} [ctx]
 * @returns {Promise<void>}
 */
export async function unlockAudio(ctx = getAudioContext()) {
    if (!ctx) return;
    if (ctx.state === "suspended") {
        await ctx.resume();
    }
}

/**
 * Registers pre-decoded AudioBuffers into the audio engine registry.
 * @param {Record<string, AudioBuffer>} buffers
 */
export function setBuffers(buffers = {}) {
    sharedBuffers = { ...sharedBuffers, ...buffers };
}

/**
 * Plays a pre-decoded AudioBuffer by name with configurable volume and pitch.
 * Gracefully degrades (no-ops) if buffer is missing or AudioContext is unavailable.
 *
 * @param {string} bufferName
 * @param {Object} [options={}]
 * @param {number} [options.volume=1]
 * @param {number} [options.pitch=1]
 * @param {AudioContext} [options.ctx]
 * @param {Record<string, AudioBuffer>} [options.buffers]
 */
export function play(
    bufferName,
    {
        volume = 1,
        pitch = 1,
        ctx = getAudioContext(),
        buffers = sharedBuffers,
    } = {},
) {
    if (!ctx || !buffers) return null;

    const buffer = buffers[bufferName];
    if (!buffer) return null;

    // Best-effort resume if browser suspended context
    if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
    }

    try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = pitch;

        const gainNode = ctx.createGain();
        gainNode.gain.value = Math.max(0, volume);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start(0);
        return source;
    } catch {
        // Graceful degradation if AudioBuffer is a stub or context failed
        return null;
    }
}

/**
 * Subscribes to simulation events ("fired", "hit", "exploded", "pickup", "pickupCollected")
 * on an EventTarget bus without coupling simulation logic to audio.
 *
 * @param {EventTarget} eventTarget
 * @param {Object} [options={}]
 * @param {Function} [options.playFn=play]
 * @returns {() => void} Cleanup function to remove event listeners
 */
export function bindEvents(eventTarget, { playFn = play } = {}) {
    if (!eventTarget || typeof eventTarget.addEventListener !== "function") {
        return () => {};
    }

    const onFired = () => {
        playFn("laser", {
            volume: 0.6,
            pitch: 0.95 + Math.random() * 0.1,
        });
    };

    const onHit = () => {
        const clip = sharedBuffers.hit ? "hit" : "explosion";
        playFn(clip, {
            volume: 0.4,
            pitch: 1.6,
        });
    };

    const onExploded = () => {
        playFn("explosion", {
            volume: 0.9,
            pitch: 0.9 + Math.random() * 0.2,
        });
    };

    const onPickup = () => {
        playFn("pickup", {
            volume: 0.8,
            pitch: 1.0,
        });
    };

    eventTarget.addEventListener("fired", onFired);
    eventTarget.addEventListener("hit", onHit);
    eventTarget.addEventListener("exploded", onExploded);
    eventTarget.addEventListener("pickup", onPickup);
    eventTarget.addEventListener("pickupCollected", onPickup);

    return () => {
        eventTarget.removeEventListener("fired", onFired);
        eventTarget.removeEventListener("hit", onHit);
        eventTarget.removeEventListener("exploded", onExploded);
        eventTarget.removeEventListener("pickup", onPickup);
        eventTarget.removeEventListener("pickupCollected", onPickup);
    };
}

/**
 * Factory creating a self-contained audio manager instance.
 * @param {Record<string, AudioBuffer>} [initialBuffers={}]
 */
export function createAudioEngine(initialBuffers = {}) {
    const ctx = getAudioContext();
    setBuffers(initialBuffers);

    return {
        get ctx() {
            return ctx;
        },
        get buffers() {
            return sharedBuffers;
        },
        unlockAudio: () => unlockAudio(ctx),
        setBuffers,
        play: (name, opts = {}) => play(name, { ...opts, ctx }),
        bindEvents: (target) =>
            bindEvents(target, {
                playFn: (name, opts) => play(name, { ...opts, ctx }),
            }),
    };
}
