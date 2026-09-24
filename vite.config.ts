import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

function githubPagesSpaRoutesPlugin(): Plugin {
  return {
    name: 'github-pages-spa-routes',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const indexHtmlPath = path.join(distDir, 'index.html');
      if (!fs.existsSync(indexHtmlPath)) return;
      const indexContent = fs.readFileSync(indexHtmlPath, 'utf-8');

      // 1. Ensure 404.html exists in dist
      const dist404 = path.join(distDir, '404.html');
      const public404 = path.resolve(__dirname, 'public', '404.html');
      if (fs.existsSync(public404)) {
        fs.copyFileSync(public404, dist404);
      } else {
        fs.writeFileSync(dist404, indexContent, 'utf-8');
      }

      // 2. Ensure CNAME exists in dist
      const publicCname = path.resolve(__dirname, 'public', 'CNAME');
      const distCname = path.join(distDir, 'CNAME');
      if (fs.existsSync(publicCname)) {
        fs.copyFileSync(publicCname, distCname);
      }

      // 3. Known routes to pre-generate on disk
      const staticRoutes = [
        'quizemasteradmin',
        'login',
        'register',
        'dashboard',
        'todays-quize',
        'winner-list',
        'my-status',
        'profile',
        'students',
        'quizzes',
        'questions',
        'submissions',
        'winners',
        'reports',
        'settings',
      ];

      for (const route of staticRoutes) {
        // Create directory dist/<route>/index.html
        const routeDir = path.join(distDir, route);
        if (!fs.existsSync(routeDir)) {
          fs.mkdirSync(routeDir, { recursive: true });
        }
        fs.writeFileSync(path.join(routeDir, 'index.html'), indexContent, 'utf-8');

        // Also create direct file dist/<route>.html
        fs.writeFileSync(path.join(distDir, `${route}.html`), indexContent, 'utf-8');
      }

      // 4. Admin subroutes
      const adminSubRoutes = [
        'dashboard',
        'quizzes',
        'students',
        'questions',
        'submissions',
        'winners',
        'reports',
        'settings',
      ];
      for (const sub of adminSubRoutes) {
        const subDir = path.join(distDir, 'quizemasteradmin', sub);
        if (!fs.existsSync(subDir)) {
          fs.mkdirSync(subDir, { recursive: true });
        }
        fs.writeFileSync(path.join(subDir, 'index.html'), indexContent, 'utf-8');
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: '/',
    define: {
      'import.meta.env.VITE_FIREBASE_DATABASE_URL': JSON.stringify(
        'https://quize-c3025-default-rtdb.asia-southeast1.firebasedatabase.app'
      ),
    },
    plugins: [react(), tailwindcss(), githubPagesSpaRoutesPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
