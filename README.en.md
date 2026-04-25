# Vite Plugin Pack Orchestrator

English | [简体中文](./README.md)

> 🎼 vite-plugin-pack-orchestrator Pack Orchestrator - Auto-archive dist folder to ZIP/TAR/7Z after build

A lightweight Vite plugin that automatically archives the build output:

- 📦 **Multi-format** — ZIP / TAR / TAR.GZ / 7Z
- 🎣 **Lifecycle hooks** — Full callback support

---

## Install

```bash
npm install vite-plugin-pack-orchestrator
```

## Quick Start

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
        onBeforeBuild: () => console.log('Building...'),
        onAfterBuild: (path, format) => console.log(`Done: ${path}`),
      },
      verbose: true,
    }),
  ],
});
```

## Supported Formats

| Format | Description | External Dependency |
|:------:|-------------|:-------------------:|
| `zip` | Standard ZIP | None |
| `tar` | Uncompressed TAR | None |
| `tar.gz` | Gzipped TAR | None |
| `7z` | 7-Zip | Requires 7-Zip installed |

## Compression Level

`compressionLevel` controls compression effort, range `0`–`9`:

| Level | Effect | Speed | Use Case |
|:-----:|--------|-------|----------|
| `0` | No compression, archive only | ⚡ Fastest | CI temp |
| `1-3` | Low compression | 🚀 Fast | Dev |
| `4-6` | Medium compression | 🏃 Normal | Daily release |
| `7-9` | High compression | 🐢 Slow | Production |

## Placeholders

| Placeholder | Description |
|:-----------:|-------------|
| `[name]` | package.json name |
| `[version]` | package.json version |
| `[timestamp]` | Unix timestamp (ms) |
| `[hash]` | Bundle content hash |

## Lifecycle Hooks

```typescript
hooks: {
  onBeforeBuild?: () => void;            // Before build starts
  onBundleGenerated?: (bundle) => void;  // After bundle generated
  onAfterBuild?: (path, format) => void; // After archive created
  onError?: (error) => void;             // On error
}
```

## License

MIT
