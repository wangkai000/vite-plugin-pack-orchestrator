# Vite Plugin Pack Orchestrator

[English](./README.en.md) | **简体中文**

> 🎼 vite-plugin-pack-orchestrator打包编排器 — 构建完成后自动将 dist 打包为压缩文件

一个轻量的 Vite 插件，在 `vite build` 完成后自动将构建产物打包成压缩文件：

- 📦 **多格式打包** — 一键输出 ZIP / TAR / TAR.GZ / 7Z
- 🎣 **生命周期钩子** — 构建完成的完整回调支持

---

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
      pack: {
        outDir: 'dist',
        fileName: 'app-[version]-[timestamp]',
        format: 'zip',
        compressionLevel: 9,
        exclude: ['**/*.map'],
      },
      hooks: {
        onBeforeBuild: () => console.log('开始构建...'),
        onBundleGenerated: (bundle) => console.log(`${Object.keys(bundle).length} 个文件`),
        onAfterBuild: (path, format) => console.log(`完成: ${path}`),
      },
      verbose: true,
    }),
  ],
});
```

## 支持的打包格式

| 格式 | 说明 | 外部依赖 |
|:----:|------|:--------:|
| `zip` | 标准 ZIP 压缩 | 无 |
| `tar` | 未压缩 TAR 归档 | 无 |
| `tar.gz` | Gzip 压缩 TAR | 无 |
| `7z` | 7-Zip 高压缩比 | 需安装 7-Zip |

### 7Z 格式说明

```bash
# macOS
brew install p7zip
# Linux
apt install p7zip-full
```

## 文件名占位符

| 占位符 | 说明 |
|:------:|------|
| `[name]` | package.json 中的 name |
| `[version]` | package.json 中的 version |
| `[timestamp]` | 时间戳（毫秒） |
| `[hash]` | Bundle 内容哈希 |

## 生命周期钩子

```typescript
hooks: {
  onBeforeBuild?: () => void;           // 构建开始前
  onBundleGenerated?: (bundle) => void; // 产物生成后
  onAfterBuild?: (path, format) => void; // 打包完成后
  onError?: (error) => void;            // 出错时
}
```

## 压缩级别

`compressionLevel` 控制压缩程度，范围 `0`–`9`：

| 级别 | 效果 | 速度 | 适用场景 |
|:----:|------|------|----------|
| `0` | 无压缩，仅打包 | ⚡ 最快 | CI 临时归档 |
| `1-3` | 低压缩 | 🚀 快 | 本地调试 |
| `4-6` | 中等压缩 | 🏃 适中 | 日常发布 |
| `7-9` | 高压缩 | 🐢 较慢 | 正式分发 |

## 完整 API

```typescript
import orchestrator, {
  type PackOrchestratorOptions,
  type ArchiveFormat,
} from 'vite-plugin-pack-orchestrator';
```

### PackOrchestratorOptions

```typescript
interface PackOrchestratorOptions {
  pack?: {
    outDir?: string;             // 构建产物目录，默认 'dist'
    fileName?: string;           // 归档文件名，默认 '[name]-[version]'
    format?: ArchiveFormat;      // 归档格式，默认 'zip'
    compressionLevel?: number;    // 压缩级别 0-9，默认 9
    include?: string[];          // 包含的 glob 模式
    exclude?: string[];           // 排除的 glob 模式
    archiveOutDir?: string;       // 归档文件输出目录
  };
  hooks?: PluginHooks;
  verbose?: boolean;
}
```

## License

MIT
