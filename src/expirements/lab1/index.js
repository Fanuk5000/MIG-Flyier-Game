import { blockEvery60thFrame } from "./exp1-blocking.js";
import { createIntervalLoop } from "./exp2-setinterval.js";
import {
  createVariableStepLoop,
  run5SecondBenchmark,
} from "./exp3-variable-step.js";

export {
  blockEvery60thFrame,
  createIntervalLoop,
  createVariableStepLoop,
  run5SecondBenchmark,
};

/**
 * Creates minimal on-screen experiment switcher overlay in bottom-left corner.
 * @param {Object} handlers
 * @param {() => void} handlers.setNormalMode
 * @param {() => void} handlers.setExp1Blocking
 * @param {() => void} handlers.setExp2Interval
 * @param {() => void} handlers.setExp3Variable
 * @param {() => void} handlers.runBenchmark
 */
export function setupExperimentUI({
  setNormalMode,
  setExp1Blocking,
  setExp2Interval,
  setExp3Variable,
  runBenchmark,
}) {
  const container = document.createElement("div");
  container.id = "experiment-panel";
  container.style.position = "fixed";
  container.style.bottom = "10px";
  container.style.left = "10px";
  container.style.display = "flex";
  container.style.gap = "8px";
  container.style.zIndex = "1000";
  container.style.fontFamily = "monospace";

  function createBtn(text, onClick) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.style.padding = "6px 12px";
    btn.style.background = "#1e293b";
    btn.style.color = "#38bdf8";
    btn.style.border = "1px solid #38bdf8";
    btn.style.borderRadius = "4px";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "12px";
    btn.addEventListener("click", onClick);
    return btn;
  }

  container.appendChild(createBtn("0: Normal (rAF)", setNormalMode));
  container.appendChild(createBtn("1: Exp 1 (Block 100ms)", setExp1Blocking));
  container.appendChild(createBtn("2: Exp 2 (setInterval)", setExp2Interval));
  container.appendChild(createBtn("3: Exp 3 (Variable dt)", setExp3Variable));
  container.appendChild(createBtn("Run 5s Test", runBenchmark));

  document.body.appendChild(container);
}
