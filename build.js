#!/usr/bin/env node

require("esbuild")
  .build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    outfile: "dist/index.js",
    platform: "node",
    target: "node18",
  })
  .catch(() => process.exit(1));
