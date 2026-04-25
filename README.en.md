# Vite Plugin Pack Orchestrator

**English** | [简体中文](./README.md)

> 🎼 Build pipeline orchestrator — full-lifecycle control with multi-format archiving

A powerful Vite plugin that elevates the build pipeline into a programmable orchestration system:

- 🔄 **CJS / ESM Interop** — Automatically converts CommonJS modules to ESM for seamless modern toolchain compatibility
- 📦 **Multi-Format Archiving** — One-click output to ZIP / TAR / TAR.GZ / 7Z, covering all major distribution scenarios
- 🎣 **Full-Lifecycle Hooks** — Complete lifecycle callbacks from build to archive, giving you precise control over every stage

---

## Installation

```bash
# Install with npm
npm install vite-plugin-pack-orchestrator

# Or with pnpm
pnpm add vite-plugin-pack-orchestrator

# Or with yarn
yarn add vite-plugin-pack-orchestrator
```

## Quick Start

```typescript
// vite.config.ts — Vite config file at project root
import { defineConfig } from 'vite';
// Import the plugin: provides CJS interop + multi-format archiving + lifecycle hooks
import orchestrator from 'vite-plugin-pack-orchestrator';

export default defineConfig({
  plugins: [
    // Invoke the plugin with full configuration
    orchestrator({
      // ─────────────────────────────────────────────
      // 1️⃣ CJS Interop (make CommonJS modules work in ESM projects)
      // ─────────────────────────────────────────────
      cjsInterop: {
        enabled: true,                    // Enable automatic CJS → ESM conversion
        extensions: ['.js', '.cjs'],      // File extensions to convert
        dynamicImport: true,              // Also convert require() to dynamic import()
      },

      // ─────────────────────────────────────────────
      // 2️⃣ Pack configuration (auto-generate archive after build)
      // ─────────────────────────────────────────────
      pack: {
        outDir: 'dist',                   // Build output directory
        fileName: 'app-[version]-[timestamp]', // Archive filename (supports placeholders, see below)
        format: 'tar.gz',                 // Archive format: 'zip' | 'tar' | 'tar.gz' | '7z'
        compressionLevel: 9,              // Compression level 0-9 (0=none, 9=max)
        exclude: ['**/*.map'],            // Exclude sourcemaps to reduce archive size
      },

      // ─────────────────────────────────────────────
      // 3️⃣ Lifecycle hooks (run custom logic at each build stage)
      // ─────────────────────────────────────────────
      hooks: {
        // Before build starts → useful for pre-processing, cleanup, etc.
        onBeforeBuild: () => console.log('🚀 Starting build...'),

        // After bundle is generated → access all output files
        // bundle param: key-value map of all output files
        onBundleGenerated: (bundle) =>
          console.log(`📦 ${Object.keys(bundle).length} files`),

        // After archive is created → get the archive path and format
        // path: absolute path to the archive file
        // format: archive format (e.g. 'tar.gz')
        onAfterBuild: (path, format) =>
          console.log(`✅ ${format}: ${path}`),
      },

      verbose: true,                      // Enable detailed logging in terminal
    }),
  ],
});
```

## Supported Formats

| Format | Description | External Dependency |
|:------:|-------------|:-------------------:|
| `zip` | Standard ZIP compression | None (built-in archiver) |
| `tar` | Uncompressed TAR archive | None (built-in tar) |
| `tar.gz` | Gzip-compressed TAR | None (built-in tar) |
| `7z` | 7-Zip high compression ratio | Requires [7-Zip](https://7-zip.org/) |

### 7Z Format Note

Make sure 7-Zip is installed on your system before using the `7z` format:

```bash
# Windows — via Chocolatey package manager
choco install 7zip

# macOS — via Homebrew
brew install p7zip

# Linux — via apt (Debian/Ubuntu)
apt install p7zip-full
```

## Compression Level

`compressionLevel` controls the **compression intensity** of the archive file, ranging from `0` to `9`. It's essentially a trade-off between **speed and file size**:

| Level | Compression | Build Speed | Best For |
|:-----:|-------------|:-----------:|----------|
| `0` | No compression, pack only | ⚡ Fastest | Internal transfer, temporary CI archives |
| `1-3` | Low compression | 🚀 Very fast | Local dev, frequent builds |
| `4-6` | Medium compression | 🏃 Moderate | Regular releases |
| `7-9` | High compression, smallest | 🐢 Slower | Public distribution, CDN uploads |

> **Real-world reference**: A 10MB dist folder produces ~9.8MB at level 0, but may shrink to ~3MB at level 9. Higher levels add roughly 5–10 seconds of build time (the gap widens with larger projects).

```typescript
// Recommended strategy: low level for dev, max level for production

// Dev environment — fast builds
orchestrator({ pack: { compressionLevel: 1 } });

// Production release — smallest archive, save bandwidth
orchestrator({ pack: { compressionLevel: 9 } });

// CI/CD internal pipeline — no compression, save build time
orchestrator({ pack: { compressionLevel: 0 } });
```

## Filename Placeholders

`fileName` supports the following dynamic placeholders, automatically resolved at build time:

| Placeholder | Description | Example |
|:-----------:|-------------|---------|
| `[name]` | `name` field from package.json | `my-app` |
| `[version]` | `version` field from package.json | `1.0.0` |
| `[timestamp]` | Current timestamp in milliseconds | `1713123456789` |
| `[hash]` | Content hash of the bundle | `a1b2c3d4` |

```typescript
// Filename placeholder examples — combine freely, auto-replaced at build time
pack: {
  // Combine name + version + hash
  // Actual output: my-app-v1.0.0-a1b2c3d4.zip
  fileName: '[name]-v[version]-[hash]',

  // Combine name + timestamp (ideal for CI/CD, unique filename per build)
  // Actual output: my-app-1713123456789.tar.gz
  // fileName: '[name]-[timestamp]',
}
```

## Lifecycle Hooks

The plugin injects complete lifecycle callbacks into the Vite build pipeline, allowing you to execute custom logic at every critical point:

```
buildStart                              ← Vite build starts
    │
    ▼
onBeforeBuild()                         ← 🔔 Hook: before build
    │                                       Use for: cleanup, logging, pre-processing
    ▼
transform (CJS → ESM)                   ← CJS modules auto-converted to ESM
    │
    ▼
generateBundle                          ← Vite generates final output
    │
    ▼
onBundleGenerated(bundle)               ← 🔔 Hook: after bundle generated
    │                                       Use for: validation, stats, inject extra files
    ▼
closeBundle                             ← Vite closes the bundle
    │
    ▼
createArchive (ZIP / TAR / ...)         ← Plugin creates the archive file
    │
    ▼
onAfterBuild(archivePath, format)       ← 🔔 Hook: after archive created
                                            Use for: upload to CDN, notifications, deploy
```

### Hook API

```typescript
hooks: {
  // ──────────────────────────────────
  // Called before the build starts
  // Params: none
  // Use for: pre-processing, cleanup, logging
  // ──────────────────────────────────
  onBeforeBuild?: () => void | Promise<void>;

  // ──────────────────────────────────
  // Called after bundle generation
  // Param bundle: map of all output files { [fileName]: chunk }
  // Use for: validate output, count files, inject extra assets
  // ──────────────────────────────────
  onBundleGenerated?: (bundle: Record<string, unknown>) => void | Promise<void>;

  // ──────────────────────────────────
  // Called after the archive file has been created
  // Param archivePath: absolute path to archive (e.g. /project/dist/app-1.0.0.zip)
  // Param format: archive format ('zip' | 'tar' | 'tar.gz' | '7z')
  // Use for: upload to OSS/CDN, send notifications, trigger deployment
  // ──────────────────────────────────
  onAfterBuild?: (archivePath: string, format: ArchiveFormat) => void | Promise<void>;

  // ──────────────────────────────────
  // Called when an error occurs during the build process
  // Param error: the error object
  // Use for: error reporting, fallback handling, alerting
  // ──────────────────────────────────
  onError?: (error: Error) => void | Promise<void>;
}
```

## Why "Orchestrator"?

An orchestrator conducts — just as a symphony conductor coordinates all instruments into a complete performance, this plugin coordinates every stage of the build pipeline:

```
buildStart → transform → generateBundle → closeBundle
     ↓           ↓              ↓               ↓
  Pre-process  Transform    Generate       Archive
```

Each stage accepts custom logic through hooks, giving you full control over the entire build process.

## Full API

```typescript
// Import the plugin and type definitions
import orchestrator, {
  type PackOrchestratorOptions,   // Plugin configuration type
  type ArchiveFormat,             // Format union type: 'zip' | 'tar' | 'tar.gz' | '7z'
} from 'vite-plugin-pack-orchestrator';
```

### PackOrchestratorOptions

```typescript
interface PackOrchestratorOptions {
  // ──────────────────────────────────
  // CJS → ESM conversion config
  // ──────────────────────────────────
  cjsInterop?: {
    enabled?: boolean;             // Enable conversion, default: true
    extensions?: string[];         // Which extensions to match, default: ['.js', '.cjs']
    exclude?: (string | RegExp)[]; // Paths to exclude, default: ['node_modules']
    dynamicImport?: boolean;       // Convert require() to await import(), default: true
  };

  // ──────────────────────────────────
  // Archive configuration
  // ──────────────────────────────────
  pack?: {
    outDir?: string;             // Build output directory, default: 'dist'
    fileName?: string;           // Archive filename, default: '[name]-[version]' (supports placeholders)
    format?: ArchiveFormat;      // Archive format, default: 'zip'
    compressionLevel?: number;   // Compression level, default: 5 (range: 0–9, 0=fastest, 9=smallest)
    include?: string[];          // Glob include patterns (only archive matching files)
    exclude?: string[];          // Glob exclude patterns (e.g. ['**/*.map'])
    archiveOutDir?: string;      // Archive output directory (defaults to outDir root)
  };

  // ──────────────────────────────────
  // Lifecycle hooks (see "Lifecycle Hooks" section above)
  // ──────────────────────────────────
  hooks?: PluginHooks;

  // Output detailed build logs to terminal, default: false
  verbose?: boolean;
}
```

## License

[MIT](./LICENSE)
