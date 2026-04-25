# Vite Plugin Pack Orchestrator

[English](./README.en.md) | **简体中文**

> 一个精简Vite 插件：在 `vite build` 完成后自动将 dist 打包成 ZIP / TAR / 7Z

**功能：**
- 📦 支持 ZIP / TAR / TAR.GZ / 7Z 四种格式
- 🎣 生命周期钩子：`beforeBuild` / `bundleGenerated` / `afterBuild` / `error`
- ⚙️ 灵活配置：压缩级别、文件过滤、输出目录

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

## 支持的格式

| 格式 | 说明 | 依赖 |
|:----:|------|:-----:|
| `zip` | 标准 ZIP | 无 |
| `tar` | TAR 归档 | 无 |
| `tar.gz` | Gzip 压缩 TAR | 无 |
| `7z` | 7-Zip 高压缩 | 需安装 7-Zip |

## 压缩级别

`compressionLevel`：范围 `0`–`9`

| 级别 | 效果 | 速度 | 场景 |
|:----:|------|------|------|
| `0` | 仅打包 | ⚡ 最快 | CI 临时 |
| `1-3` | 低压缩 | 🚀 快 | 开发 |
| `4-6` | 中等 | 🏃 适中 | 日常 |
| `7-9` | 高压缩 | 🐢 较慢 | 发布 |

## 文件名占位符

| 占位符 | 说明 |
|:------:|------|
| `[name]` | package.json name |
| `[version]` | package.json version |
| `[timestamp]` | 时间戳（毫秒） |
| `[hash]` | Bundle 内容哈希（8位） |
| `[md5]` | 压缩包 MD5（8位） |

## 生命周期钩子

```typescript
hooks: {
  onBeforeBuild?: () => void;            // 构建开始前
  onBundleGenerated?: (bundle) => void;  // 产物生成后
  onAfterBuild?: (path, format) => void; // 打包完成后
  onError?: (error) => void;            // 出错时
}
```

## API

```typescript
import orchestrator, { PackOrchestratorOptions, ArchiveFormat } from 'vite-plugin-pack-orchestrator';

orchestrator({
  pack: {
    outDir?: string;             // 默认 'dist'
    fileName?: string;          // 默认 '[name]-[version]'
    format?: ArchiveFormat;     // 默认 'zip'
    compressionLevel?: number;    // 默认 9
    include?: string[];          // 包含模式
    exclude?: string[];         // 排除模式
    archiveOutDir?: string;      // 归档输出目录
  };
  hooks?: PluginHooks;
  verbose?: boolean;
})
```

## License

MIT
