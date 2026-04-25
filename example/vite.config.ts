import { defineConfig } from 'vite';
import orchestrator from '../dist/index.js';

const formats = ['zip', 'tar', 'tar.gz', '7z'] as const;

export default defineConfig({
  plugins: formats.map(format =>
    orchestrator({
      pack: {
        outDir: 'dist',
        fileName: `app-[version]-[timestamp].${format === 'tar.gz' ? 'tar.gz' : format}`,
        format,
        compressionLevel: 9,
        exclude: ['**/*.map', '**/.DS_Store'],
      },
      hooks: {
        onAfterBuild: (archivePath, fmt, checksums) =>
          console.log(`✅ ${fmt.toUpperCase()} | MD5: ${checksums.md5.slice(0, 8)}... | ${archivePath}`),
      },
      verbose: true,
    })
  ),
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
