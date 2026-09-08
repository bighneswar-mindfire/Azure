const { cpSync, existsSync } = require("fs");
const path = require("path");

const frontendDist = path.join(__dirname, "..", "..", "frontend", "dist");
const target = path.join(__dirname, "..", "public");

if (!existsSync(frontendDist)) {
  throw new Error(`Frontend build not found at ${frontendDist}. Run "npm run build" in frontend/ first.`);
}

cpSync(frontendDist, target, { recursive: true });
console.log(`Copied frontend build from ${frontendDist} to ${target}`);
