# Vite Plugin Pack Orchestrator

[English](./README.en.md) | **简体中文**

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
        outDir: 'dist',                    // 监听目录，默认 'dist'
        fileName: 'app-[version]-[timestamp]', // 支持 [name] [version] [timestamp] [hash]
        format: 'zip',                    // zip | tar | tar.gz | 7z
        compressionLevel: 9,              // 0-9
        exclude: ['**/*.map'],
      },
      hooks: {
        onBeforeBuild: () => {},
        onBundleGenerated: (bundle) => {},
        onAfterBuild: (path, format, checksums) => {},
        onError: (error) => {},
      },
    }),
  ],
};
```

## 格式

| 格式 | 说明 | 依赖 |
|:----:|------|------|
| `zip` | 标准 ZIP | 无 |
| `tar` / `tar.gz` | Gzip 压缩 TAR | 无 |
| `7z` | 高压缩 7-Zip | 无（内置） |

## 钩子

`onAfterBuild` 可返回新路径实现重命名，返回值与原路径不同时自动重命名：

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
