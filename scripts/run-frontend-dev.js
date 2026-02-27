#!/usr/bin/env node

/**
 * Cross-platform frontend dev launcher.
 * Replaces: cd frontend && pnpm run dev -- --port ${FRONTEND_PORT:-3000}
 */

const { execSync } = require("child_process");
const path = require("path");

const port = process.env.FRONTEND_PORT || "3000";
const frontendDir = path.join(__dirname, "..", "frontend");

try {
  execSync(`pnpm run dev -- --port ${port}`, {
    cwd: frontendDir,
    env: process.env,
    stdio: "inherit",
  });
} catch (err) {
  process.exit(err.status ?? 1);
}
