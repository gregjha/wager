/**
 * CJS-compatible reimplementation of p-limit's public API (matching the last
 * CJS release, v3). The workspace root pins `p-limit` to v4 (pure ESM) via
 * package.json `overrides`, which breaks Jest's own internals (jest-runner,
 * jest-circus) that `require("p-limit")` directly. This shim is mapped in
 * only via this app's Jest `moduleNameMapper` so Jest can load it without
 * touching the workspace-wide override.
 */
"use strict";

function pLimit(concurrency) {
  if (!((Number.isInteger(concurrency) || concurrency === Infinity) && concurrency > 0)) {
    throw new TypeError("Expected `concurrency` to be a number from 1 and up");
  }

  const queue = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      queue.shift()();
    }
  };

  const run = async (fn, resolve, args) => {
    activeCount++;
    const result = (async () => fn(...args))();
    resolve(result);
    try {
      await result;
    } catch {
      // Errors are surfaced through the returned promise; nothing to do here.
    }
    next();
  };

  const enqueue = (fn, resolve, args) => {
    queue.push(run.bind(undefined, fn, resolve, args));
    if (activeCount < concurrency && queue.length > 0) {
      queue.shift()();
    }
  };

  const generator = (fn, ...args) => new Promise((resolve) => enqueue(fn, resolve, args));

  Object.defineProperties(generator, {
    activeCount: { get: () => activeCount },
    pendingCount: { get: () => queue.length },
    clearQueue: { value: () => { queue.length = 0; } },
  });

  return generator;
}

module.exports = pLimit;
module.exports.default = pLimit;
