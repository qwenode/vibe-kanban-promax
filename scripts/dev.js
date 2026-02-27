#!/usr/bin/env node

/**
 * Cross-platform dev launcher.
 * Replaces the bash-only `dev` npm script so it works on Windows (CMD/PowerShell) too.
 */

const { spawn } = require("child_process");
const path = require("path");
const { getPorts } = require("./setup-dev-environment");

const isQA = process.argv.includes("--qa");

async function main() {
  const ports = await getPorts();

  const env = {
    ...process.env,
    FRONTEND_PORT: String(ports.frontend),
    BACKEND_PORT: String(ports.backend),
    VK_ALLOWED_ORIGINS: `http://localhost:${ports.frontend}`,
    VITE_VK_SHARED_API_BASE: process.env.VK_SHARED_API_BASE || "",
  };

  const concurrentlyBin = path.join(
    __dirname,
    "..",
    "node_modules",
    ".bin",
    "concurrently"
  );

  const backendScript = isQA ? "backend:dev:watch:qa" : "backend:dev:watch";

  const child = spawn(
    concurrentlyBin,
    [`"pnpm run ${backendScript}"`, `"pnpm run frontend:dev"`],
    {
      env,
      stdio: "inherit",
      shell: true,
    }
  );

  child.on("exit", (code) => process.exit(code ?? 1));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
