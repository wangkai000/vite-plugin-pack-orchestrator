import { defineConfig } from 'vite';
import orchestrator from 'vite-plugin-pack-orchestrator';

export default defineConfig({
  plugins: [
    orchestrator({
      pack: {
        outDir: 'dist',
        fileName: 'npm-test',
        format: 'zip',
        exclude: ['**/*.map', '**/.DS_Store'],
        archiveOutDir: './hahahaha',
      },
      hooks: {
        onAfterBuild: (path, format, checksums) =>
          path.replace(/(\.(?:zip|tar\.gz|tar|7z))$/, `-${checksums.sha1.slice(0, 8)}$1`),
      },
    }),
  ],
  build: { outDir: 'dist', emptyOutDir: true },
});
