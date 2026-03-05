// vite.config.ts
import { createLogger, defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "path";
import fs from "fs";
import pkg from "./package.json";

function createFilteredLogger() {
  const logger = createLogger();
  const originalError = logger.error.bind(logger);

  let lastRestartLog = 0;
  // Proxy (especially WS proxy) can be noisy while backend restarts.
  // Debounce aggressively so it doesn't drown useful logs.
  const DEBOUNCE_MS = 15000;

  logger.error = (msg, options) => {
    const isProxyError =
      msg.includes("ws proxy socket error") ||
      msg.includes("ws proxy error:") ||
      msg.includes("http proxy error:");

    if (isProxyError) {
      const now = Date.now();
      if (now - lastRestartLog > DEBOUNCE_MS) {
        // Preserve one-line context (path / error kind) for debugging.
        const oneLine = String(msg).split('\n')[0];
        logger.warn(`Proxy connection issue (auto-reconnecting): ${oneLine}`);
        lastRestartLog = now;
      }
      return;
    }
    originalError(msg, options);
  };

  return logger;
}

function executorSchemasPlugin(): Plugin {
  const VIRTUAL_ID = 'virtual:executor-schemas';
  const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID;
  const schemasDir = path.resolve(__dirname, '../shared/schemas');

  return {
    name: 'executor-schemas-plugin',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID; // keep it virtual
      return null;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return null;

      const files = fs.existsSync(schemasDir)
        ? fs.readdirSync(schemasDir).filter((f) => f.endsWith('.json'))
        : [];

      const imports: string[] = [];
      const entries: string[] = [];

      files.forEach((file, i) => {
        const varName = `__schema_${i}`;
        const importPath = `shared/schemas/${file}`; // uses your alias
        const key = file.replace(/\.json$/, '').toUpperCase(); // claude_code -> CLAUDE_CODE
        imports.push(`import ${varName} from "${importPath}";`);
        entries.push(`  "${key}": ${varName}`);
      });

      // IMPORTANT: pure JS (no TS types), and quote keys.
      const code = `
${imports.join('\n')}

export const schemas = {
${entries.join(',\n')}
};

export default schemas;
`;
      return code;
    },
    configureServer(server) {
      // Watch the schemas directory so new/changed schema files
      // invalidate the virtual module without a dev-server restart.
      server.watcher.add(schemasDir);
      server.watcher.on('all', (event, filePath) => {
        if (
          filePath.startsWith(schemasDir) &&
          filePath.endsWith('.json') &&
          ['add', 'change', 'unlink'].includes(event)
        ) {
          const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
            server.ws.send({ type: 'full-reload' });
          }
        }
      });
    },
  };
}

export default defineConfig({
  customLogger: createFilteredLogger(),
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    // IMPORTANT: Router plugin must come before the React plugin.
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react({
      babel: {
        plugins: [
          [
            'babel-plugin-react-compiler',
            {
              target: '18',
              sources: [path.resolve(__dirname, 'src')],
              environment: {
                enableResetCacheOnSourceFileChanges: true,
              },
            },
          ],
        ],
      },
    }),
    executorSchemasPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      shared: path.resolve(__dirname, '../shared'),
      'semi-ui-css': path.resolve(
        __dirname,
        './node_modules/@douyinfe/semi-ui/dist/css/semi.min.css'
      ),
    },
  },
  server: {
    port: parseInt(process.env.FRONTEND_PORT || '3000'),
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.BACKEND_PORT || '3001'}`,
        changeOrigin: true,
        ws: true,
      },
    },
    fs: {
      allow: [path.resolve(__dirname, '.'), path.resolve(__dirname, '..')],
    },
    open: process.env.VITE_OPEN === 'true',
    allowedHosts: [
      '.trycloudflare.com', // allow all cloudflared tunnels
    ],
  },
  optimizeDeps: {
    exclude: ['wa-sqlite'],
  },
  build: { sourcemap: true },
});
