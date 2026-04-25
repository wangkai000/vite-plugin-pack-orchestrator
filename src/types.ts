import type { Plugin } from 'vite';

/** Supported archive formats */
export type ArchiveFormat = 'zip' | 'tar' | 'tar.gz' | '7z';

export interface ArchiveOptions {
  /** Output directory to archive (relative to project root) */
  outDir?: string;
  /** Archive file name pattern, supports [version], [name], [hash], [timestamp] */
  fileName?: string;
  /** Archive format (default: 'zip') */
  format?: ArchiveFormat;
  /** Compression level (0-9 for zip/tar.gz, default: 9) */
  compressionLevel?: number;
  /** Glob patterns to include */
  include?: string[];
  /** Glob patterns to exclude */
  exclude?: string[];
  /** Output directory for archive file */
  archiveOutDir?: string;
}

export interface CjsInteropOptions {
  /** Enable CJS to ESM conversion (default: true) */
  enabled?: boolean;
  /** File extensions to process */
  extensions?: string[];
  /** Packages to skip conversion */
  exclude?: (string | RegExp)[];
  /** Transform require() with dynamic variables to import() */
  dynamicImport?: boolean;
}

export interface PluginHooks {
  /** Called before build starts */
  onBeforeBuild?: () => void | Promise<void>;
  /** Called when bundle is generated */
  onBundleGenerated?: (bundle: Record<string, unknown>) => void | Promise<void>;
  /** Called after archive is created */
  onAfterBuild?: (archivePath: string, format: ArchiveFormat) => void | Promise<void>;
  /** Called on error */
  onError?: (error: Error) => void | Promise<void>;
}

export interface PackOrchestratorOptions {
  /** CJS interop configuration */
  cjsInterop?: CjsInteropOptions;
  /** Archive packaging configuration */
  pack?: ArchiveOptions;
  /** Hook callbacks */
  hooks?: PluginHooks;
  /** Enable verbose logging */
  verbose?: boolean;
}

export type PackOrchestratorPlugin = (options?: PackOrchestratorOptions) => Plugin;
