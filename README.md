# Vite Plugin Pack Orchestrator

[English](https://github.com/wangkai000/vite-plugin-pack-orchestrator/blob/main/README.en.md) | **简体中文**

> 一个精简的 Vite 插件：vite build 完成后自动将 dist 打包为 ZIP / TAR / 7Z，同时计算 MD5 / SHA1 / SHA256 校验和，支持自动重命名。

## 安装

```bash
npm install vite-plugin-pack-orchestrator
```

## 使用

```typescript
// vite.config.ts
import orchestrator from 'vite-plugin-pack-orchestrator';

export default {
  plugins: [
    orchestrator({
      pack: {
        outDir: 'dist',                    // 要打包的源目录，默认 'dist'
        fileName: 'app-[version]-[timestamp]', // 支持 [name] [version] [timestamp] [hash] [hash:8]
        format: 'zip',                    // zip | tar | tar.gz | 7z
        compressionLevel: 9,              // 0-9
        exclude: ['**/*.map'],            // 排除的文件
        include: ['**/*.js'],             // 包含的文件（可选）
        archiveOutDir: './output',        // 压缩包输出目录，不写默认项目根目录
      },
      hooks: { ... },
    }),
  ],
};
```

## fileName 占位符

| 占位符 | 说明 | 示例值 |
|:-------|:-----|:-------|
| `[name]` | package.json 中的 name | `my-app` |
| `[version]` | package.json 中的 version | `1.0.0` |
| `[timestamp]` | 当前时间戳 | `1714012345678` |
| `[hash]` | 构建内容 MD5 哈希（完整 32 位） | `a1b2c3d4...` |
| `[hash:8]` | MD5 哈希前 N 位（自定义长度） | `a1b2c3d4` |

```typescript
fileName: '[name]-v[version]'       // my-app-v1.0.0.zip
fileName: '[name]-[timestamp]'      // my-app-1714012345678.zip
fileName: '[name]-[hash:8]'         // my-app-a1b2c3d4.zip
fileName: '[name]-[hash]'           // my-app-a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.zip
```

不写扩展名时，插件会根据 `format` 自动追加对应后缀。

## 格式

| 格式 | 说明 | 依赖 |
|:----:|------|------|
| `zip` | 标准 ZIP | 无 |
| `tar` / `tar.gz` | Gzip 压缩 TAR | 无 |
| `7z` | 高压缩 7-Zip | 无（内置） |

## 钩子

| 钩子 | 说明 | 参数 |
|:-----|:-----|:-----|
| `onBeforeBuild` | 构建开始前执行 | 无 |
| `onBundleGenerated` | Vite bundle 生成后、压缩前执行 | `bundle` — Vite 生成的产物对象 |
| `onAfterBuild` | 压缩包创建完成后执行 | `path` 路径, `format` 格式, `checksums` 校验和 |
| `onError` | 打包出错时执行 | `error` — 错误对象 |

### onBeforeBuild

构建前执行，适合做前置清理：

```typescript
onBeforeBuild: async () => {
  // 构建前的一些处理
},
```

### onBundleGenerated

Vite bundle 生成后、压缩前执行，可以拿到构建产物信息：

```typescript
onBundleGenerated: (bundle) => {
  console.log('生成的文件:', Object.keys(bundle));
},
```

### onAfterBuild

压缩完成后执行，可返回新路径实现自动重命名（返回值与原路径不同时生效）：

```typescript
// 1. 在扩展名前插入 sha1 哈希
// app.zip → app-3a7b2c1d.zip
onAfterBuild: (path, format, checksums) =>
  path.replace(/(\.(?:zip|tar\.gz|tar|7z))$/, `-${checksums.sha1.slice(0, 8)}$1`);

// 2. 用 MD5 全量替换文件名
// app.zip → a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.zip
onAfterBuild: (path, format, checksums) =>
  path.replace(/^.+(?=\.\w+$)/, checksums.md5);

// 3. 追加格式和哈希到原始文件名
// app.zip → app-zip-3a7b2c1d.zip
onAfterBuild: (path, format, checksums) =>
  path.replace(/(\.\w+)$/, `-${format}-${checksums.sha256.slice(0, 8)}$1`);

// 4. 完全自定义文件名，用 format 参数自动适配后缀
// app.zip → release-a1b2c3d4e5f6.zip
onAfterBuild: (path, format, checksums) =>
  `release-${checksums.md5.slice(0, 12)}.${format}`;
```

`checksums` 结构：

```typescript
{ md5: string; sha1: string; sha256: string }
```

> ⚠️ `onAfterBuild` 返回的路径后缀必须与打包 `format` 一致（如 `zip` 格式必须以 `.zip` 结尾），否则会输出警告。文件仍会重命名，但后缀不匹配可能导致下游解析异常。

## License

MIT
