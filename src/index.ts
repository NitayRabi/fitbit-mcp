#!/usr/bin/env node

import { z } from "zod";
import { initServer, configSchema } from "./server.js";

// Smithery default export - creates an MCP server with the given config
export default function ({ config }: { config: z.infer<typeof configSchema> }) {
  return initServer(config).smitheryServer();
}

// Export the config schema for Smithery
export { configSchema };

// Fallback for stdio mode (when not running in Smithery)
async function main() {
  // Check if running directly (not in Smithery) by checking if this is the main module
  if (process.argv[1] && process.argv[1].endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
    await initServer().stdioServer();
  }
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});