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
  /** Compression level (0-9, default: 9) */
  compressionLevel?: number;
  /** Glob patterns to include */
  include?: string[];
  /** Glob patterns to exclude */
  exclude?: string[];
  /** Output directory for archive file */
  archiveOutDir?: string;
}

export interface PluginHooks {
  /** Called before build starts */
  onBeforeBuild?: () => void | Promise<void>;
  /** Called when bundle is generated */
  onBundleGenerated?: (bundle: Record<string, unknown>) => void | Promise<void>;
  /** 
   * Called after archive is created
   * @param archivePath - 压缩包路径
   * @param format - 压缩格式
   * @param md5 - 压缩包 MD5
   * @returns 返回新路径则自动重命名，如返回空则保持原名
   */
  onAfterBuild?: (archivePath: string, format: ArchiveFormat, md5: string) => string | void | Promise<string | void>;
  /** Called on error */
  onError?: (error: Error) => void | Promise<void>;
}

export interface PackOrchestratorOptions {
  /** Archive packaging configuration */
  pack?: ArchiveOptions;
  /** Hook callbacks */
  hooks?: PluginHooks;
  /** Enable verbose logging */
  verbose?: boolean;
}

export type PackOrchestratorPlugin = (options?: PackOrchestratorOptions) => Plugin;
