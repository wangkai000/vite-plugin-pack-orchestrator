import type { Plugin, ResolvedConfig } from 'vite';
import { transformCjsToEsm } from './cjs-interop';
import { createArchive } from './archive-pack';
import type { PackOrchestratorOptions, ArchiveFormat } from './types';

/**
 * Vite Pack Orchestrator - 打包编排器
 * 
 * 全流程控制构建管道：
 * buildStart → transform → generateBundle → closeBundle
 *     ↓           ↓              ↓               ↓
 * onBeforeBuild  CJS→ESM    onBundleGenerated  Archive + onAfterBuild
 * 
 * 支持格式：ZIP / TAR / TAR.GZ / 7Z
 */
export default function packOrchestrator(options: PackOrchestratorOptions = {}): Plugin {
  const {
    cjsInterop = {},
    pack = {},
    hooks = {},
    verbose = false,
  } = options;

  const {
    enabled: cjsEnabled = true,
    extensions: cjsExtensions = ['.js', '.cjs'],
    exclude: cjsExclude = ['node_modules'],
    dynamicImport = true,
  } = cjsInterop;

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
        console.log('[pack-orchestrator] 🎼 编排开始...');
      }
    },

    async transform(code, id) {
      if (!cjsEnabled) return null;

      // Skip excluded paths
      if (cjsExclude.some(pattern => {
        if (typeof pattern === 'string') return id.includes(pattern);
        return pattern.test(id);
      })) {
        return null;
      }

      // Check extension
      const hasTargetExt = cjsExtensions.some(ext => id.endsWith(ext));
      if (!hasTargetExt) return null;

      const transformed = transformCjsToEsm(code, id, { 
        enabled: cjsEnabled,
        extensions: cjsExtensions, 
        exclude: cjsExclude, 
        dynamicImport 
      });
      return transformed;
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
        await createArchive(pack, config.root, hooks, verbose);
      } catch (error) {
        console.error('[pack-orchestrator] ❌ 打包失败:', error);
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
export type { PackOrchestratorOptions, ArchiveFormat } from './types';
