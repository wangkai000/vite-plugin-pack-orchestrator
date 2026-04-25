import { defineConfig } from 'vite';
import orchestrator from '../dist/index.js';

export default defineConfig({
  plugins: [
    orchestrator({
      pack: {
        outDir: 'dist',
        fileName: 'app-[version]-[timestamp]',
        format: 'tar.gz',
        compressionLevel: 9,
        exclude: ['**/*.map', '**/.DS_Store'],
      },
      hooks: {
        onBeforeBuild: () => console.log('开始构建...'),
        onBundleGenerated: () => console.log('Bundle 生成完成'),
        onAfterBuild: (archivePath, format, checksums) => 
          console.log(`✅ ${format.toUpperCase()} 创建成功: ${archivePath}`),
        onError: (error) => console.error('❌ 构建失败:', error.message),
      },
      verbose: true,
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
