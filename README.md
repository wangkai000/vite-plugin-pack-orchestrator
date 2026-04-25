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

`onAfterBuild` 可返回新路径实现重命名：

```typescript
onAfterBuild: (path, format, checksums) => {
  return path.replace(/\.(\w+)$/, `-${checksums.sha1.slice(0, 8)}.$1`);
}
```

`checksums` 包含：`md5`、`sha1`、`sha256`

## License

MIT
