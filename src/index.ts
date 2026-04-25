import type { Plugin, ResolvedConfig } from 'vite';
import { createArchive } from './archive-pack';
import type { PackOrchestratorOptions, ArchiveFormat } from './types';

/**
 * Vite Pack Orchestrator - 打包编排器
 * 
 * 在 vite build 完成后自动将 dist 目录打包成压缩文件
 * 支持格式：ZIP / TAR / TAR.GZ / 7Z
 */
export default function packOrchestrator(options: PackOrchestratorOptions = {}): Plugin {
  const {
    pack = {},
    hooks = {},
    verbose = false,
  } = options;

  let config: ResolvedConfig;
  let bundleHash: string | undefined;

  return {
    name: 'vite-plugin-pack-orchestrator',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    async buildStart() {
      if (hooks.onBeforeBuild) {
        await hooks.onBeforeBuild();
      }
      if (verbose) {
        console.log('[pack-orchestrator] 开始打包...');
      }
    },

    async generateBundle(_options, bundle) {
      if (hooks.onBundleGenerated) {
        await hooks.onBundleGenerated(bundle as Record<string, unknown>);
      }

      // Generate hash from bundle content
      const crypto = await import('crypto');
      const hash = crypto.createHash('md5');
      for (const fileName of Object.keys(bundle).sort()) {
        hash.update(fileName);
      }
      bundleHash = hash.digest('hex');
    },

    async closeBundle() {
      if (!pack || Object.keys(pack).length === 0) return;

      try {
        await createArchive(pack, config.root, hooks, verbose, bundleHash);
      } catch (error) {
        console.error('[pack-orchestrator] 打包失败:', error);
        if (hooks.onError) {
          await hooks.onError(error as Error);
        }
      }
    },
  };
}

// Named export for ESM
export { packOrchestrator };

// Re-export types
export type { 
  PackOrchestratorOptions, 
  ArchiveFormat,
  ArchiveOptions,
  PluginHooks,
} from './types';
