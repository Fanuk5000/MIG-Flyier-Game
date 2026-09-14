# Implementation Plan & Specification: Game Loop & Physics (`lab-01`) [Vanilla JS]

## 1. Project Initialization & Tooling

- [ ] Initialize Vite project using Vanilla JS template (`vanilla`).
- [ ] Configure code quality tooling:
  - Setup Biome (or ESLint + Prettier) with clean JavaScript rules.
  - Setup `jsconfig.json` for IDE autocomplete and module path resolution.
- [ ] Create core directory layout:
  - `src/core/` — loop timing, input handling.
  - `src/physics/` — pure state integration, boundary wrap logic.
  - `src/render/` — canvas setup, HiDPI scaling, entity rendering.
  - `src/ui/` — performance HUD.
  - `src/experiments/` — toggles for the 3 benchmark experiments.

---

## 2. System Architecture & Internal Call Lifecycle

### Frame Execution Lifecycle

Every screen refresh triggers this execution pipeline:

```bash
requestAnimationFrame
  └── loop(timestamp)
        ├── Calculate delta time (dt = timestamp - lastTime)
        ├── Clamp dt (prevent large jumps when tab is inactive)
        ├── accumulator += dt
        │
        ├── [SIMULATION PHASE: Fixed 60 Hz]
        │     └── while (accumulator >= FIXED_STEP)
        │           ├── inputState = inputTracker.getState()
        │           ├── previousState = currentState
        │           ├── currentState = integrate(currentState, inputState, FIXED_STEP)
        │           ├── accumulator -= FIXED_STEP
        │           └── simulationSteps++
        │
        ├── [INTERPOLATION & RENDER PHASE: Monitor Refresh Rate]
        │     ├── alpha = accumulator / FIXED_STEP
        │     ├── clearCanvas()
        │     ├── renderShip(previousState, currentState, alpha)
        │     └── renderHUD(metrics)
        │
        └── requestAnimationFrame(loop)
```

### Internal Method Call Explanations

1. **`createLoop(update, render, hudUpdate)`**:
   - Master orchestrator closure.
   - Holds timing variables (`lastTime`, `accumulator`, frame counters) in private scope.
   - Calls `update` at a deterministic 60 Hz rate (`FIXED_STEP = 1 / 60`).
   - Calls `render` passing `alpha` (interpolation factor between `[0, 1)`) so movement stays smooth even on 120Hz/144Hz monitors.
   - Calls `hudUpdate` to refresh FPS and step counters once per second.

2. **`createInput()`**:
   - Closure holding keyboard state in private object.
   - Attaches DOM event listeners (`keydown`, `keyup`) on initialization.
   - `getState()` returns a simple snapshot object of active keys.
   - Isolates DOM dependencies: physics and loop code never touch `window` or `document`.

3. **`integrate(ship, input, dt)`**:
   - Pure physics function: `(shipState, inputState, dt) => newShipState`.
   - Never modifies input arguments directly; returns a fresh state object.
   - Updates orientation, calculates thrust vector, applies velocity, and wraps screen boundaries.

---

## 3. Core Component Requirements

### 3.1 Game Loop (`createLoop()`)

- [ ] Implement `requestAnimationFrame` recursion.
- [ ] Fixed timestep accumulator:
  - Simulation step: `FIXED_STEP = 1 / 60` (~16.667 ms).
  - Upper clamp on frame time (e.g., 0.25 s) to prevent accumulator explosion.
- [ ] Interpolation factor:
  - `alpha = accumulator / FIXED_STEP`.
- [ ] Performance tracker for HUD:
  - **steps/s**: simulation ticks executed per second.
  - **frames/s**: render frames delivered per second.
  - **frame time**: instantaneous and average frame duration in ms.

### 3.2 Input Subsystem (`createInput()`)

- [ ] Track pressed states for control keys (arrows, WASD).
- [ ] Prevent default browser scrolling on arrow keys and spacebar.
- [ ] Expose snapshot accessor:
  - Return plain JavaScript object containing active controls (e.g., `{ thrust, turnLeft, turnRight }`).
- [ ] Expose cleanup method to remove listeners if needed.

### 3.3 Physics Subsystem (`integrate(ship, input, dt)`)

- [ ] Define ship state structure (use JSDoc for IDE hints):
  - Position: `x`, `y`
  - Velocity: `vx`, `vy`
  - Rotation angle (radians)
- [ ] Calculate movement:
  - Angular change based on turning inputs and rotation speed.
  - Directional acceleration vector derived from ship heading angle and thrust input.
  - Velocity dampening / friction (if fitting the theme).
  - New position calculated from velocity multiplied by `dt`.
- [ ] Arena screen wrapping (Toroidal arena):
  - When ship crosses right edge, wrap to left; when crossing top, wrap to bottom (and vice versa).

### 3.4 Canvas Rendering & HiDPI

- [ ] Configure sharp rendering on HiDPI/Retina screens:
  - Read `window.devicePixelRatio`.
  - Set buffer size (`canvas.width`, `canvas.height`) scaled by DPR.
  - Set CSS style size (`canvas.style.width`, `canvas.style.height`) to logical size.
  - Scale drawing context via `ctx.scale(dpr, dpr)`.
- [ ] Render interpolation:
  - Render entity at interpolated position: `prev * (1 - alpha) + current * alpha`.
- [ ] Theme visualization:
  - Draw chosen entity (biplane, FPV drone, tank, or space ship).
  - Display direction heading and active thruster cues.
- [ ] Performance HUD:
  - Overlay displaying steps/s, frames/s, and frame time.

---

## 4. Intentional Breakage Experiments (`README.md`)

Add UI toggles or test scripts to trigger three flawed scenarios, record metrics, and explain them:

- [ ] **Experiment 1: Synchronous Blocking Cycle in Frame**
  - Insert heavy synchronous busy loop (e.g., 50-100ms) inside a frame.
  - **Observe**: Frame rate collapse, frame time spikes, accumulator catch-up spikes.
  - **Event Loop Analysis**: Explain how synchronous CPU work blocks the single JS thread, stalling rendering and delaying future `rAF` callbacks.

- [ ] **Experiment 2: `setInterval` Driver instead of `requestAnimationFrame`**
  - Run loop using `setInterval(..., 1000 / 60)`.
  - **Observe**: Frame jitter, uneven frame delivery, timer throttling when browser tab is inactive.
  - **Event Loop Analysis**: Explain differences between macrotask queue scheduling and VSync-aligned animation frame phases.

- [ ] **Experiment 3: Variable Step (`dt`) instead of Fixed Accumulator**
  - Pass variable elapsed frame time directly into `integrate(ship, input, dt)` without an accumulator.
  - **Observe**: Inconsistent physics speed at different monitor refresh rates (60Hz vs 144Hz) and tunneling during lag spikes.
  - **Event Loop Analysis**: Explain why numerical integration fails under variable time intervals.

---

## 5. Future TypeScript Migration Roadmap

For transitioning this codebase to TypeScript later without rewriting:

- [ ] **Phase 1: JSDoc Type Annotations (in plain `.js` files)**
  - Add `@typedef` for `ShipState` and `InputState`.
  - Annotate function parameters with `@param` and `@returns`.
  - Gives complete VS Code autocompletion and hover types with zero build step.
- [ ] **Phase 2: Editor Type Checking (`jsconfig.json`)**
  - Add `"compilerOptions": { "checkJs": true }` to `jsconfig.json`.
  - Highlights type mismatches directly inside `.js` files without running a compiler.
- [ ] **Phase 3: Incremental File Renaming**
  - Install TypeScript development dependency: `npm install -D typescript`.
  - Rename files one by one from `.js` to `.ts` (e.g., start with pure physics: `integrate.ts`).
- [ ] **Phase 4: Strict Interfaces & Types**
  - Introduce explicit `interface` declarations for state, input, and configuration objects.
  - Enable `strict: true` in `tsconfig.json`.

---

## 6. Deliverables & Defense Verification

- [ ] Public GitHub repository tagged with `lab-01`.
- [ ] `README.md` containing:
  - Project overview and chosen theme.
  - Metric tables and observations for all 3 experiments.
  - JS Event Loop explanations for each experiment.
- [ ] Defense preparation:
  - 5-minute live demo of flight and HUD.
  - Readiness for 2–3 questions from Reflection section.
