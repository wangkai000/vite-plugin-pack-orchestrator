import { defineConfig } from 'vite';
import orchestrator from '../dist/index.js';

// 验证案例1: 在扩展名前插入 sha1 哈希
// 预期: case1-app-xxxxxxxx.zip
export default defineConfig({
  plugins: [
    orchestrator({
      pack: { outDir: 'dist', fileName: 'case1-app', format: 'zip', exclude: ['**/*.map', '**/.DS_Store'] },
      hooks: {
        onAfterBuild: (path, format, checksums) =>
          path.replace(/(\.(?:zip|tar\.gz|tar|7z))$/, `-${checksums.sha1.slice(0, 8)}$1`),
      },
      verbose: true,
    }),
  ],
  build: { outDir: 'dist', emptyOutDir: true },
});
