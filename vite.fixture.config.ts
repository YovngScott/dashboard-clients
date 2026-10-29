import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const path = (name: string) => fileURLToPath(new URL(name, import.meta.url));
export default defineConfig({
  optimizeDeps: { entries: ['tests/fixtures/agent-builder.html'] },
  plugins: [{
    name: 'synthetic-fixture-services', enforce: 'pre',
    resolveId(source, importer) {
      if (importer?.endsWith('/src/features/agents/AgentWorkspace.tsx') || importer?.endsWith('/src/features/agents/AgentEditor.tsx')) {
        if (source === './agent-service') return path('./tests/fixtures/agent-service-mock.ts');
        if (source === '@/lib/workspace') return '\0synthetic-workspace';
      }
    },
    load(id) { if (id === '\0synthetic-workspace') return 'export const canManageAgents = role => role !== "viewer";'; },
  }, react()],
  server: { host: '127.0.0.1', port: 3188, strictPort: true },
});
