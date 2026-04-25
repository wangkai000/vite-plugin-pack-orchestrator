# Vite Plugin Pack Orchestrator

English | [简体中文](./README.md)

> A lightweight Vite plugin: auto-archive dist folder to ZIP / TAR / 7Z after `vite build`, with MD5 / SHA1 / SHA256 checksums and auto-rename support

**Features:**
- 📦 Support ZIP / TAR / TAR.GZ / 7Z formats
- 🎣 Lifecycle hooks: `beforeBuild` / `bundleGenerated` / `afterBuild` / `error`
- ⚙️ Flexible: compression level, file filtering, output directory

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
        onBundleGenerated: (bundle) => console.log(`${Object.keys(bundle).length} files`),
        onAfterBuild: (path, format) => console.log(`Done: ${path}`),
      },
      verbose: true,
    }),
  ],
});
```

## Supported Formats

| Format | Description | Dependency |
|:------:|-------------|:----------:|
| `zip` | Standard ZIP | None |
| `tar` | TAR archive | None |
| `tar.gz` | Gzipped TAR | None |
| `7z` | 7-Zip | Requires 7-Zip |

## Compression Level

`compressionLevel`: range `0`–`9`

| Level | Effect | Speed | Use Case |
|:-----:|--------|-------|----------|
| `0` | Archive only | ⚡ Fastest | CI temp |
| `1-3` | Low | 🚀 Fast | Dev |
| `4-6` | Medium | 🏃 Normal | Daily |
| `7-9` | High | 🐢 Slow | Release |

## Placeholders

| Placeholder | Description |
|:-----------:|-------------|
| `[name]` | package.json name |
| `[version]` | package.json version |
| `[timestamp]` | Unix timestamp (ms) |
| `[hash]` | Bundle content hash (8 chars) |

## Lifecycle Hooks

```typescript
hooks: {
  onBeforeBuild?: () => void;                                          // Before build starts
  onBundleGenerated?: (bundle) => void;                               // After bundle generated
  onAfterBuild?: (path, format, checksums) => string | void;          // After archive created, return new path to rename
  onError?: (error) => void;                                          // On error
}
```

**checksums object:**
```typescript
{
  md5: string;    // 32 chars MD5
  sha1: string;  // 40 chars SHA-1
  sha256: string; // 64 chars SHA-256
}
```

**Example: return new path to rename if needed**
```typescript
onAfterBuild: (path, format, checksums) => {
  // Return new filename to auto rename
  return path.replace(/\.(\w+)$/, `-${checksums.sha1.slice(0, 8)}.$1`);
}
```

## API

```typescript
import orchestrator, { PackOrchestratorOptions, ArchiveFormat } from 'vite-plugin-pack-orchestrator';

orchestrator({
  pack: {
    outDir?: string;             // Default 'dist'
    fileName?: string;          // Default '[name]-[version]'
    format?: ArchiveFormat;     // Default 'zip'
    compressionLevel?: number;    // Default 9
    include?: string[];          // Glob patterns to include
    exclude?: string[];         // Glob patterns to exclude
    archiveOutDir?: string;      // Archive output directory
  };
  hooks?: PluginHooks;
  verbose?: boolean;
})
```

## License

MIT
