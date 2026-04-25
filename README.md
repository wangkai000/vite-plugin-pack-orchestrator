# Vite Plugin Pack Orchestrator

[English](./README.en.md) | **简体中文**

> 🎼 打包编排器 — 全流程可控的构建管道，支持多格式归档

一个强大的 Vite 插件，将构建管道提升为可编程的编排系统：

- 🔄 **CJS / ESM 互转** — 自动将 CommonJS 模块转为 ESM，无缝兼容现代工具链
- 📦 **多格式打包** — 一键输出 ZIP / TAR / TAR.GZ / 7Z，覆盖主流分发场景
- 🎣 **全流程钩子** — 构建到归档的完整生命周期回调，精确掌控每个环节

---

## 安装

```bash
# 使用 npm 安装
npm install vite-plugin-pack-orchestrator

# 或使用 pnpm
pnpm add vite-plugin-pack-orchestrator

# 或使用 yarn
yarn add vite-plugin-pack-orchestrator
```

## 快速开始

```typescript
// vite.config.ts —— 项目根目录的 Vite 配置文件
import { defineConfig } from 'vite';
// 导入插件：打包编排器，提供 CJS 互转 + 多格式归档 + 生命周期钩子
import orchestrator from 'vite-plugin-pack-orchestrator';

export default defineConfig({
  plugins: [
    // 调用插件，传入完整配置
    orchestrator({
      // ─────────────────────────────────────────────
      // 1️⃣ CJS 兼容配置（让 CommonJS 模块能在 ESM 项目中使用）
      // ─────────────────────────────────────────────
      cjsInterop: {
        enabled: true,                    // 开启 CJS → ESM 自动转换
        extensions: ['.js', '.cjs'],      // 需要转换的文件扩展名
        dynamicImport: true,              // 同时处理 require() 为动态 import()
      },

      // ─────────────────────────────────────────────
      // 2️⃣ 打包配置（构建完成后自动生成归档文件）
      // ─────────────────────────────────────────────
      pack: {
        outDir: 'dist',                   // 构建产物输出目录
        fileName: 'app-[version]-[timestamp]', // 归档文件名（支持占位符，详见下方说明）
        format: 'tar.gz',                 // 归档格式：'zip' | 'tar' | 'tar.gz' | '7z'
        compressionLevel: 9,              // 压缩级别 0-9（0=无压缩，9=最高压缩）
        exclude: ['**/*.map'],            // 排除 sourcemap 文件，减小归档体积
      },

      // ─────────────────────────────────────────────
      // 3️⃣ 生命周期钩子（在构建各阶段执行自定义逻辑）
      // ─────────────────────────────────────────────
      hooks: {
        // 构建开始前 → 适合做预处理、清理旧文件等
        onBeforeBuild: () => console.log('🚀 开始构建...'),

        // Bundle 生成后 → 可拿到所有输出文件，适合做文件校验、统计等
        // bundle 参数包含所有输出文件的 key-value 映射
        onBundleGenerated: (bundle) =>
          console.log(`📦 ${Object.keys(bundle).length} 个文件`),

        // 归档文件创建完成后 → 可拿到归档路径和格式，适合做上传、通知等
        // path: 归档文件的完整路径，format: 归档格式（如 'tar.gz'）
        onAfterBuild: (path, format) =>
          console.log(`✅ ${format}: ${path}`),
      },

      verbose: true,                      // 开启详细日志，在终端输出每个阶段的信息
    }),
  ],
});
```

## 支持的打包格式

| 格式 | 说明 | 外部依赖 |
|:----:|------|:--------:|
| `zip` | 标准 ZIP 压缩 | 无（内置 archiver） |
| `tar` | 未压缩 TAR 归档 | 无（内置 tar） |
| `tar.gz` | Gzip 压缩 TAR | 无（内置 tar） |
| `7z` | 7-Zip 高压缩比 | 需安装 [7-Zip](https://7-zip.org/) |

### 7Z 格式说明

使用 7Z 格式前需确保系统已安装 7-Zip：

```bash
# Windows —— 通过 Chocolatey 包管理器安装
choco install 7zip

# macOS —— 通过 Homebrew 安装
brew install p7zip

# Linux —— 通过 apt 安装（Debian/Ubuntu）
apt install p7zip-full
```

## 压缩级别说明

`compressionLevel` 控制归档文件的**压缩程度**，范围 `0`–`9`，本质上是在**速度和体积之间做权衡**：

| 级别 | 压缩效果 | 构建速度 | 适用场景 |
|:----:|----------|:--------:|----------|
| `0` | 无压缩，仅打包 | ⚡ 最快 | 内部中转、CI 临时归档 |
| `1-3` | 低压缩，体积略减 | 🚀 很快 | 本地调试、频繁构建 |
| `4-6` | 中等压缩 | 🏃 适中 | 日常发布 |
| `7-9` | 高压缩，体积最小 | 🐢 较慢 | 正式分发、上传 CDN |

> **实际效果参考**：一个 10MB 的 dist 目录，`compressionLevel: 0` 打出来约 9.8MB，`compressionLevel: 9` 可能压到 3MB 左右，但高压缩会比无压缩多花 5–10 秒（文件越大差距越明显）。

```typescript
// 推荐策略：开发阶段用低级别，发布时用最高级别

// 开发环境 —— 速度快，构建秒完
orchestrator({ pack: { compressionLevel: 1 } });

// 生产发布 —— 体积最小，节省带宽
orchestrator({ pack: { compressionLevel: 9 } });

// CI/CD 内部中转 —— 不压缩，省构建时间
orchestrator({ pack: { compressionLevel: 0 } });
```

## 文件名占位符

`fileName` 支持以下动态占位符，打包时自动替换为实际值：

| 占位符 | 说明 | 示例 |
|:------:|------|------|
| `[name]` | package.json 中的 name | `my-app` |
| `[version]` | package.json 中的 version | `1.0.0` |
| `[timestamp]` | 当前时间戳（毫秒） | `1713123456789` |
| `[hash]` | Bundle 内容哈希 | `a1b2c3d4` |

```typescript
// 文件名占位符示例：可自由组合，打包时自动替换
pack: {
  // 组合 name + version + hash
  // 实际输出：my-app-v1.0.0-a1b2c3d4.zip
  fileName: '[name]-v[version]-[hash]',

  // 组合 name + timestamp（适合 CI/CD 场景，每次构建文件名唯一）
  // 实际输出：my-app-1713123456789.tar.gz
  // fileName: '[name]-[timestamp]',
}
```

## 生命周期钩子

插件在 Vite 构建管道中插入了完整的生命周期回调，让你能在每个关键节点执行自定义逻辑：

```
buildStart                              ← Vite 构建开始
    │
    ▼
onBeforeBuild()                         ← 🔔 钩子：构建开始前
    │                                       适合：清理旧产物、打印构建信息
    ▼
transform (CJS → ESM)                   ← CJS 模块自动转换为 ESM
    │
    ▼
generateBundle                          ← Vite 生成最终产物
    │
    ▼
onBundleGenerated(bundle)               ← 🔔 钩子：产物生成后
    │                                       适合：文件校验、统计、注入额外文件
    ▼
closeBundle                             ← Vite 关闭 Bundle
    │
    ▼
createArchive (ZIP / TAR / ...)         ← 插件创建归档文件
    │
    ▼
onAfterBuild(archivePath, format)       ← 🔔 钩子：归档完成后
                                            适合：上传到 CDN、发送通知、部署触发
```

### 钩子 API

```typescript
hooks: {
  // ──────────────────────────────────
  // 构建开始前调用
  // 返回值：无参数，无返回值
  // 用途：预处理、清理、日志
  // ──────────────────────────────────
  onBeforeBuild?: () => void | Promise<void>;

  // ──────────────────────────────────
  // Bundle 生成后调用
  // 参数 bundle：所有输出文件的映射 { [fileName]: chunk }
  // 用途：校验产物、统计文件数、注入额外资源
  // ──────────────────────────────────
  onBundleGenerated?: (bundle: Record<string, unknown>) => void | Promise<void>;

  // ──────────────────────────────────
  // 归档文件创建完成后调用
  // 参数 archivePath：归档文件的绝对路径（如 /project/dist/app-1.0.0.zip）
  // 参数 format：归档格式（'zip' | 'tar' | 'tar.gz' | '7z'）
  // 用途：上传到 OSS/CDN、发送钉钉/飞书通知、触发部署
  // ──────────────────────────────────
  onAfterBuild?: (archivePath: string, format: ArchiveFormat) => void | Promise<void>;

  // ──────────────────────────────────
  // 构建过程中发生错误时调用
  // 参数 error：错误对象
  // 用途：错误上报、降级处理、告警通知
  // ──────────────────────────────────
  onError?: (error: Error) => void | Promise<void>;
}
```

## 为什么叫 Orchestrator？

Orchestrator（编排器/指挥家）—— 就像交响乐指挥协调所有乐器演奏出完整乐章，这个插件协调构建管道的每个阶段：

```
buildStart → transform → generateBundle → closeBundle
     ↓           ↓              ↓               ↓
  预处理      转换代码       生成产物       打包归档
```

每个阶段都可以通过钩子注入自定义逻辑，实现完全可控的构建流程。

## 完整 API

```typescript
// 导入插件和类型定义
import orchestrator, {
  type PackOrchestratorOptions,   // 插件配置类型
  type ArchiveFormat,             // 归档格式类型联合：'zip' | 'tar' | 'tar.gz' | '7z'
} from 'vite-plugin-pack-orchestrator';
```

### PackOrchestratorOptions

```typescript
interface PackOrchestratorOptions {
  // ──────────────────────────────────
  // CJS → ESM 转换配置
  // ──────────────────────────────────
  cjsInterop?: {
    enabled?: boolean;             // 是否开启转换，默认 true
    extensions?: string[];         // 匹配哪些扩展名，默认 ['.js', '.cjs']
    exclude?: (string | RegExp)[]; // 排除哪些路径，默认 ['node_modules']
    dynamicImport?: boolean;       // 是否将 require() 转为 await import()，默认 true
  };

  // ──────────────────────────────────
  // 打包归档配置
  // ──────────────────────────────────
  pack?: {
    outDir?: string;             // 构建产物目录，默认 'dist'
    fileName?: string;           // 归档文件名，默认 '[name]-[version]'（支持占位符）
    format?: ArchiveFormat;      // 归档格式，默认 'zip'
    compressionLevel?: number;   // 压缩级别，默认 5（范围 0–9，0 最快，9 最小）
    include?: string[];          // Glob 包含模式（仅打包匹配的文件）
    exclude?: string[];          // Glob 排除模式（排除匹配的文件，如 ['**/*.map']）
    archiveOutDir?: string;      // 归档文件输出目录（不填则放在 outDir 根目录）
  };

  // ──────────────────────────────────
  // 生命周期钩子（详见上方"生命周期钩子"章节）
  // ──────────────────────────────────
  hooks?: PluginHooks;

  // 是否在终端输出详细构建日志，默认 false
  verbose?: boolean;
}
```

## License

[MIT](./LICENSE)
