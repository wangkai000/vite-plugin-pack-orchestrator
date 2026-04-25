import { defineConfig } from 'vite';
import orchestrator from '../dist/index.js';

export default defineConfig({
  plugins: [
    orchestrator({
      // CJS 兼容配置
      cjsInterop: {
        enabled: true,
        extensions: ['.js', '.cjs'],
        exclude: ['node_modules'],
        dynamicImport: true,
      },
      
      // 多格式打包配置
      pack: {
        outDir: 'dist',
        fileName: 'app-[version]-[timestamp]',
        format: 'tar.gz',  // 支持: 'zip' | 'tar' | 'tar.gz' | '7z'
        compressionLevel: 9,
        exclude: ['**/*.map', '**/.DS_Store'],
      },
      
      // 钩子回调
      hooks: {
        onBeforeBuild: () => console.log('🚀 开始构建...'),
        onBundleGenerated: () => console.log('📦 Bundle 生成完成'),
        onAfterBuild: (archivePath, format) => 
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
