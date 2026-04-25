# Vite Plugin Pack Orchestrator

> 🎼 **打包编排器** - 全流程控制的构建管道，支持多格式归档

一个强大的 Vite 插件，将构建管道提升为可编程的编排系统：

- 🔄 **CJS/ESM 互转** - 自动将 CommonJS 转为 ESM
- 📦 **多格式打包** - 支持 ZIP / TAR / TAR.GZ / 7Z
- 🎣 **全流程钩子** - 从构建开始到打包完成的完整生命周期回调

## 安装

```bash
npm install vite-plugin-pack-orchestrator
```

## 快速开始

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import orchestrator from 'vite-plugin-pack-orchestrator';

export default defineConfig({
  plugins: [
    orchestrator({
      // CJS 兼容
      cjsInterop: {
        enabled: true,
        extensions: ['.js', '.cjs'],
        dynamicImport: true,
      },
      
      // 打包配置
      pack: {
        outDir: 'dist',
        fileName: 'app-[version]-[timestamp]',
        format: 'tar.gz',  // 'zip' | 'tar' | 'tar.gz' | '7z'
        compressionLevel: 9,
        exclude: ['**/*.map'],
      },
      
      // 生命周期钩子
      hooks: {
        onBeforeBuild: () => console.log('🚀 开始构建...'),
        onBundleGenerated: (bundle) => console.log(`📦 ${Object.keys(bundle).length} 个文件`),
        onAfterBuild: (path, format) => console.log(`✅ ${format}: ${path}`),
      },
      
      verbose: true,
    }),
  ],
});
```

## 打包格式

| 格式 | 说明 | 依赖 |
|------|------|------|
| `zip` | 标准 ZIP 压缩 | 内置 (archiver) |
| `tar` | 未压缩 TAR 归档 | 内置 (tar) |
| `tar.gz` | Gzip 压缩 TAR | 内置 (tar) |
| `7z` | 7-Zip 高压缩比 | 需安装 7-Zip |

### 7Z 格式说明

使用 7Z 格式需要系统安装 7-Zip：

```bash
# Windows
choco install 7zip

# macOS
brew install p7zip

# Linux
apt install p7zip-full
```

## 文件名占位符

支持动态文件名：

| 占位符 | 说明 | 示例 |
|--------|------|------|
| `[name]` | package.json 中的 name | my-app |
| `[version]` | package.json 中的 version | 1.0.0 |
| `[timestamp]` | 当前时间戳 | 1713123456789 |
| `[hash]` | Bundle 内容哈希 | a1b2c3d4 |

```typescript
pack: {
  fileName: '[name]-v[version]-[hash]',  // my-app-v1.0.0-a1b2c3d4.zip
}
```

## 生命周期钩子

```
buildStart
    │
    ▼
onBeforeBuild()
    │
    ▼
transform (CJS → ESM)
    │
    ▼
generateBundle
    │
    ▼
onBundleGenerated(bundle)
    │
    ▼
closeBundle
    │
    ▼
createArchive (ZIP/TAR/...)
    │
    ▼
onAfterBuild(archivePath, format)
```

### 钩子 API

```typescript
hooks: {
  /** 构建开始前 */
  onBeforeBuild?: () => void | Promise<void>;
  
  /** Bundle 生成后，可访问所有输出文件 */
  onBundleGenerated?: (bundle: Record<string, unknown>) => void | Promise<void>;
  
  /** 归档创建后 */
  onAfterBuild?: (archivePath: string, format: ArchiveFormat) => void | Promise<void>;
  
  /** 错误处理 */
  onError?: (error: Error) => void | Promise<void>;
}
```

## 为什么叫 Orchestrator？

就像交响乐指挥家（Orchestrator）协调所有乐器演奏出完整乐章，这个插件协调构建管道的每个阶段：

```
buildStart → transform → generateBundle → closeBundle
     ↓           ↓              ↓               ↓
  预处理      转换代码       生成Bundle      打包归档
```

每个阶段都可以通过钩子插入自定义逻辑，实现完全可控的构建流程。

## API

```typescript
import orchestrator, { 
  type PackOrchestratorOptions,
  type ArchiveFormat,
} from 'vite-plugin-pack-orchestrator';

// ArchiveFormat = 'zip' | 'tar' | 'tar.gz' | '7z'
```

### PackOrchestratorOptions

```typescript
interface PackOrchestratorOptions {
  cjsInterop?: {
    enabled?: boolean;           // 默认 true
    extensions?: string[];       // 默认 ['.js', '.cjs']
    exclude?: (string | RegExp)[];  // 默认 ['node_modules']
    dynamicImport?: boolean;     // 默认 true
  };
  
  pack?: {
    outDir?: string;             // 默认 'dist'
    fileName?: string;           // 默认 '[name]-[version]'
    format?: ArchiveFormat;      // 默认 'zip'
    compressionLevel?: number;   // 默认 9 (0-9)
    include?: string[];          // Glob 包含
    exclude?: string[];          // Glob 排除
    archiveOutDir?: string;      // 归档输出目录
  };
  
  hooks?: PluginHooks;
  verbose?: boolean;
}
```

## License

MIT
