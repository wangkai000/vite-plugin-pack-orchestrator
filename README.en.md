# Vite Plugin Pack Orchestrator

[简体中文](https://github.com/wangkai000/vite-plugin-pack-orchestrator/blob/main/README.md) | **English**

> A lightweight Vite plugin: auto-pack dist into ZIP/TAR/7Z after `vite build`, with MD5/SHA1/SHA256 checksums and auto-rename support

## Install

```bash
npm install vite-plugin-pack-orchestrator -D
```

## Usage

```typescript
// vite.config.ts
import orchestrator from 'vite-plugin-pack-orchestrator';

export default {
  plugins: [
    orchestrator({
      pack: {
        outDir: 'dist',                    // Source dir to archive, default 'dist'
        fileName: 'app-[version]-[timestamp]', // [name] [version] [timestamp] [hash] [hash:8]
        format: 'zip',                          // zip | tar | tar.gz | 7z
        compressionLevel: 9,                   // 0-9
        exclude: ['**/*.map'],                // Files to exclude
        include: ['**/*.js'],                 // Files to include (optional)
        archiveOutDir: './output',            // Archive output dir, defaults to project root
      },
      hooks: { ... },
    }),
  ],
};
```

## fileName Placeholders

| Placeholder | Description | Example |
|:------------|:------------|:--------|
| `[name]` | package.json name | `my-app` |
| `[version]` | package.json version | `1.0.0` |
| `[timestamp]` | Current timestamp | `1714012345678` |
| `[hash]` | Bundle content MD5 hash (full 32 chars) | `a1b2c3d4...` |
| `[hash:8]` | First N chars of MD5 hash (custom length) | `a1b2c3d4` |

```typescript
fileName: '[name]-v[version]'       // my-app-v1.0.0.zip
fileName: '[name]-[timestamp]'      // my-app-1714012345678.zip
fileName: '[name]-[hash:8]'         // my-app-a1b2c3d4.zip
fileName: '[name]-[hash]'           // my-app-a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.zip
```

If no extension is specified, the plugin automatically appends the correct suffix based on `format`.

## Formats

| Format | Note | Dependency |
|:------:|------|------------|
| `zip` | Standard ZIP | None |
| `tar` / `tar.gz` | Gzip compressed TAR | None |
| `7z` | High compression 7-Zip | None (bundled) |

## Hooks

| Hook | Description | Parameters |
|:-----|:------------|:-----------|
| `onBeforeBuild` | Called before build starts | None |
| `onBundleGenerated` | Called after Vite bundle is generated, before archiving | `bundle` — Vite output bundle object |
| `onAfterBuild` | Called after archive is created | `path`, `format`, `checksums` |
| `onError` | Called on error | `error` — Error object |

### onBeforeBuild

Called before build starts, suitable for pre-build cleanup:

```typescript
onBeforeBuild: async () => {
  // Pre-build processing
},
```

### onBundleGenerated

Called after Vite bundle is generated but before archiving, gives access to the bundle:

```typescript
onBundleGenerated: (bundle) => {
  console.log('Generated files:', Object.keys(bundle));
},
```

### onAfterBuild

Called after archive is created. Return a new path to auto-rename (takes effect when different from original):

```typescript
// 1. Insert sha1 hash before extension
// app.zip → app-3a7b2c1d.zip
onAfterBuild: (path, format, checksums) =>
  path.replace(/(\.(?:zip|tar\.gz|tar|7z))$/, `-${checksums.sha1.slice(0, 8)}$1`);

// 2. Replace entire filename with MD5
// app.zip → a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.zip
onAfterBuild: (path, format, checksums) =>
  path.replace(/^.+(?=\.\w+$)/, checksums.md5);

// 3. Append format and hash to original name
// app.zip → app-zip-3a7b2c1d.zip
onAfterBuild: (path, format, checksums) =>
  path.replace(/(\.\w+)$/, `-${format}-${checksums.sha256.slice(0, 8)}$1`);

// 4. Fully custom filename, use format param for auto extension
// app.zip → release-a1b2c3d4e5f6.zip
onAfterBuild: (path, format, checksums) =>
  `release-${checksums.md5.slice(0, 12)}.${format}`;
```

`checksums` structure:

```typescript
{ md5: string; sha1: string; sha256: string }
```

> ⚠️ The extension returned by `onAfterBuild` must match the `format` (e.g. `zip` format must end with `.zip`). A warning is printed on mismatch. The file is still renamed, but an incorrect extension may cause downstream parsing issues.

## License

MIT
