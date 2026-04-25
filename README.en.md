# Vite Plugin Pack Orchestrator

**简体中文** | [English](./README.en.md)

> A lightweight Vite plugin: auto-pack dist into ZIP/TAR/7Z after `vite build`, with MD5/SHA1/SHA256 checksums and auto-rename support

## Install

```bash
npm install vite-plugin-pack-orchestrator
```

## Usage

```typescript
// vite.config.ts
import orchestrator from 'vite-plugin-pack-orchestrator';

export default {
  plugins: [
    orchestrator({
      pack: {
        outDir: 'dist',
        fileName: 'app-[version]-[timestamp]', // [name] [version] [timestamp] [hash]
        format: 'zip',                          // zip | tar | tar.gz | 7z
        compressionLevel: 9,                   // 0-9
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

## Formats

| Format | Note | Dependency |
|:------:|------|------------|
| `zip` | Standard ZIP | None |
| `tar` / `tar.gz` | Gzip compressed TAR | None |
| `7z` | High compression 7-Zip | None (bundled) |

## Hooks

`onAfterBuild` can return a new path to rename:

```typescript
onAfterBuild: (path, format, checksums) => {
  return path.replace(/\.(\w+)$/, `-${checksums.sha1.slice(0, 8)}.$1`);
}
```

`checksums` contains: `md5`, `sha1`, `sha256`

## License

MIT
