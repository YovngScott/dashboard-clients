import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [{
    name:'offline-catalog-fixture',enforce:'pre',
    transform(code,id) {
      if(id.split('\\').join('/').endsWith('/src/index.css')) return code.replace(/^@import url\([^\n]+\);\r?\n/gm,'');
    },
    configureServer(server) {
      server.middlewares.use((req,res,next)=>{
        if(req.url==='/'||req.url?.startsWith('/src/main.tsx')) {res.statusCode=404;res.end('Use /tests/fixtures/catalog-text.html; no product entry in this fixture.');return;}
        next();
      });
    },
  },react()],
  optimizeDeps:{entries:['tests/fixtures/catalog-text.html']},
  server:{host:'127.0.0.1',port:3189,strictPort:true},
});
