/**
 * Parallax Scrolling Sky & Cloud Background
 * Creates multi-layered depth illusion using repeating canvas patterns,
 * forward flight cruise drift, and ship velocity reaction.
 */

/**
 * Pre-processes side-scroller cloud image onto an offscreen canvas
 * with soft vertical alpha fade at top and bottom margins to eliminate straight line seams.
 * @param {HTMLImageElement} img
 * @param {number} [fadeRatio=0.18]
 * @returns {HTMLCanvasElement|null}
 */
function createSeamlessVerticalCanvas(img, fadeRatio = 0.18) {
    if (!img || !img.naturalWidth || !img.naturalHeight) return null;
    if (typeof document === "undefined") return null;

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 1. Draw source cloud image
    ctx.drawImage(img, 0, 0);

    // 2. Alpha fade top and bottom edges into transparency
    ctx.globalCompositeOperation = "destination-in";
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(fadeRatio, "rgba(0, 0, 0, 1)");
    gradient.addColorStop(1 - fadeRatio, "rgba(0, 0, 0, 1)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    return canvas;
}

export class ParallaxBackground {
    /**
     * @param {Record<string, HTMLImageElement>} [assets={}] - Loaded background images
     */
    constructor(assets = {}) {
        this.assets = assets;
        this.theme = "day"; // "day" | "night"

        // Layer definitions for day and night themes
        this.themes = {
            day: [
                {
                    key: "dayGeneralClouds",
                    scrollFactor: 0.12,
                    baseDriftY: 18,
                    baseDriftX: 2,
                    alpha: 0.75,
                    offsetX: 0,
                    offsetY: 0,
                    pattern: null,
                },
                {
                    key: "dayMidClouds",
                    scrollFactor: 0.28,
                    baseDriftY: 38,
                    baseDriftX: 4,
                    alpha: 0.85,
                    offsetX: 0,
                    offsetY: 0,
                    pattern: null,
                },
                {
                    key: "dayLowerClouds",
                    scrollFactor: 0.55,
                    baseDriftY: 70,
                    baseDriftX: 6,
                    alpha: 0.9,
                    offsetX: 0,
                    offsetY: 0,
                    pattern: null,
                },
            ],
            night: [
                {
                    key: "nightGeneralClouds",
                    scrollFactor: 0.14,
                    baseDriftY: 18,
                    baseDriftX: 2,
                    alpha: 0.7,
                    offsetX: 0,
                    offsetY: 0,
                    pattern: null,
                },
                {
                    key: "nightChunkCloud",
                    scrollFactor: 0.32,
                    baseDriftY: 38,
                    baseDriftX: 4,
                    alpha: 0.8,
                    offsetX: 0,
                    offsetY: 0,
                    pattern: null,
                },
                {
                    key: "nightLowerCloud",
                    scrollFactor: 0.6,
                    baseDriftY: 72,
                    baseDriftX: 6,
                    alpha: 0.88,
                    offsetX: 0,
                    offsetY: 0,
                    pattern: null,
                },
            ],
        };

        // Celestial object (Sun) parallax offset
        this.celestialOffset = { x: 0, y: 0 };
    }

    /**
     * Switch active environmental theme.
     * @param {"day"|"night"} themeName
     */
    setTheme(themeName) {
        if (this.themes[themeName]) {
            this.theme = themeName;
        }
    }

    /**
     * Updates layer offsets based on elapsed time and ship velocity.
     * @param {number} dt - Delta time in seconds
     * @param {Object} [shipVel={ x: 0, y: 0 }] - Current ship velocity vector
     */
    update(dt, shipVel = { x: 0, y: 0 }) {
        const layers = this.themes[this.theme] || [];

        for (const layer of layers) {
            // Clouds drift downwards (+Y) to simulate jet forward flight,
            // while shifting opposite to the jet's velocity vectors.
            layer.offsetX += (layer.baseDriftX - shipVel.x * layer.scrollFactor) * dt;
            layer.offsetY += (layer.baseDriftY - shipVel.y * layer.scrollFactor) * dt;
        }

        // Sun / Moon moves very subtly
        this.celestialOffset.x -= shipVel.x * 0.02 * dt;
        this.celestialOffset.y -= shipVel.y * 0.02 * dt;
    }

    /**
     * Renders background gradient, celestial bodies, and layered repeating cloud patterns.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width - Viewport width
     * @param {number} height - Viewport height
     */
    draw(ctx, width, height) {
        const isDay = this.theme === "day";
        const gradientKey = isDay ? "dayGradient" : "nightGradient";
        const gradientImg = this.assets[gradientKey];

        // 1. Base Gradient Sky
        if (gradientImg && gradientImg.naturalWidth > 0) {
            ctx.drawImage(gradientImg, 0, 0, width, height);
        } else {
            // Vector fallback if image not loaded
            ctx.fillStyle = isDay ? "#1e3a8a" : "#070b14";
            ctx.fillRect(0, 0, width, height);
        }

        // 2. Sun (Day only)
        if (isDay) {
            const sunImg = this.assets.daySun;
            if (sunImg && sunImg.naturalWidth > 0) {
                const sunSize = Math.min(width, height) * 0.28;
                const sunBaseX = width * 0.78 + (this.celestialOffset.x % (width * 0.3));
                const sunBaseY = height * 0.22 + (this.celestialOffset.y % (height * 0.3));
                ctx.save();
                ctx.globalAlpha = 0.95;
                ctx.drawImage(
                    sunImg,
                    sunBaseX - sunSize / 2,
                    sunBaseY - sunSize / 2,
                    sunSize,
                    sunSize,
                );
                ctx.restore();
            }
        }

        // 3. Repeating Cloud Layers
        const layers = this.themes[this.theme] || [];
        for (const layer of layers) {
            const img = this.assets[layer.key];
            if (!img || !img.naturalWidth || !img.naturalHeight) continue;

            const imgW = img.naturalWidth;
            const imgH = img.naturalHeight;

            // Cache pattern on the layer using vertical alpha fade canvas to remove straight lines
            if (!layer.pattern || layer.patternSource !== img) {
                const seamlessCanvas = createSeamlessVerticalCanvas(img);
                layer.pattern = ctx.createPattern(seamlessCanvas || img, "repeat");
                layer.patternSource = img;
            }

            if (!layer.pattern) continue;

            // Modulo offset so translation never overflows
            const ox = ((layer.offsetX % imgW) + imgW) % imgW;
            const oy = ((layer.offsetY % imgH) + imgH) % imgH;

            ctx.save();
            ctx.globalAlpha = layer.alpha;
            ctx.translate(ox, oy);
            ctx.fillStyle = layer.pattern;

            // Draw bounding rectangle spanning screen plus margin for seamless tiling
            ctx.fillRect(-imgW, -imgH, width + imgW * 2, height + imgH * 2);
            ctx.restore();
        }
    }
}
