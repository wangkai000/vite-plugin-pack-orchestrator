import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import archiver from 'archiver';
import * as tar from 'tar';
import picomatch from 'picomatch';
import _7z from '7zip-min';
import type { ArchiveOptions, ArchiveFormat, PluginHooks } from './types';

/**
 * Get package version from package.json
 */
function getPackageVersion(rootDir: string): string {
  try {
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * Get package name from package.json
 */
function getPackageName(rootDir: string): string {
  try {
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.name || 'app';
  } catch {
    return 'app';
  }
}

/**
 * Get file extension for archive format
 */
function getArchiveExtension(format: ArchiveFormat): string {
  const extensions: Record<ArchiveFormat, string> = {
    'zip': '.zip',
    'tar': '.tar',
    'tar.gz': '.tar.gz',
    '7z': '.7z',
  };
  return extensions[format] || '.zip';
}

/**
 * Generate archive file name with placeholders
 */
function generateArchiveFileName(
  pattern: string,
  rootDir: string,
  format: ArchiveFormat,
  hash?: string
): string {
  const version = getPackageVersion(rootDir);
  const name = getPackageName(rootDir);
  const timestamp = Date.now().toString();
  const shortHash = hash ? hash.slice(0, 8) : '';
  const extension = getArchiveExtension(format);

  let fileName = pattern
    .replace(/\[version\]/g, version)
    .replace(/\[name\]/g, name)
    .replace(/\[hash\]/g, shortHash)
    .replace(/\[timestamp\]/g, timestamp);

  // Ensure correct extension
  const extPattern = /\.(zip|tar\.gz|tar|7z)$/;
  if (!extPattern.test(fileName)) {
    fileName += extension;
  }

  return fileName;
}

/**
 * Calculate checksums of a file
 */
function calculateChecksums(filePath: string): { md5: string; sha1: string; sha256: string } {
  const buffer = fs.readFileSync(filePath);
  return {
    md5: crypto.createHash('md5').update(buffer).digest('hex'),
    sha1: crypto.createHash('sha1').update(buffer).digest('hex'),
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
  };
}

/**
 * Get all files in directory recursively
 */
function getFiles(dir: string, baseDir: string): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.relative(baseDir, fullPath);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Filter files based on include/exclude patterns
 */
function filterFiles(
  files: string[],
  include?: string[],
  exclude?: string[]
): string[] {
  let result = files;

  if (include && include.length > 0) {
    const isMatch = picomatch(include);
    result = result.filter(file => isMatch(file));
  }

  if (exclude && exclude.length > 0) {
    const isMatch = picomatch(exclude);
    result = result.filter(file => !isMatch(file));
  }

  return result;
}

/**
 * Create ZIP archive
 */
async function createZipArchive(
  sourceDir: string,
  archivePath: string,
  filteredFiles: string[],
  compressionLevel: number,
  verbose?: boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(archivePath);
    const archive = archiver('zip', {
      zlib: { level: compressionLevel }
    });

    output.on('close', () => {
      const size = archive.pointer();
      if (verbose) {
        console.log(`[pack-orchestrator] ✅ ZIP 完成: ${archivePath} (${(size / 1024).toFixed(2)} KB)`);
      }
      resolve();
    });

    archive.on('error', reject);

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn(`[pack-orchestrator] ⚠️ 警告: ${err.message}`);
      } else {
        reject(err);
      }
    });

    archive.pipe(output);

    for (const file of filteredFiles) {
      const filePath = path.join(sourceDir, file);
      archive.file(filePath, { name: file });
    }

    archive.finalize();
  });
}

/**
 * Create TAR archive
 */
async function createTarArchive(
  sourceDir: string,
  archivePath: string,
  filteredFiles: string[],
  gzip: boolean,
  compressionLevel: number,
  verbose?: boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(archivePath);
    
    const pack = tar.c({
      gzip,
      cwd: sourceDir,
      portable: true,
      ...(gzip && { zlib: { level: compressionLevel } }),
    }, filteredFiles);

    pack.pipe(output);

    output.on('close', () => {
      const size = fs.statSync(archivePath).size;
      if (verbose) {
        const format = gzip ? 'TAR.GZ' : 'TAR';
        console.log(`[pack-orchestrator] ✅ ${format} 完成: ${archivePath} (${(size / 1024).toFixed(2)} KB)`);
      }
      resolve();
    });

    output.on('error', reject);
    pack.on('error', reject);
  });
}

/**
 * Create 7z archive using 7zip-min (no system 7z required)
 */
async function create7zArchive(
  sourceDir: string,
  archivePath: string,
  filteredFiles: string[],
  verbose?: boolean
): Promise<void> {
  // 7zip-min packs an entire directory, so copy filtered files to a temp dir first
  const tmpDir = path.join(sourceDir, '.__7z_tmp__');
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    for (const file of filteredFiles) {
      const src = path.join(sourceDir, file);
      const dest = path.join(tmpDir, file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }

    await _7z.pack(tmpDir, archivePath);

    if (verbose) {
      const size = fs.statSync(archivePath).size;
      console.log(`[pack-orchestrator] ✅ 7Z 完成: ${archivePath} (${(size / 1024).toFixed(2)} KB)`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

/**
 * Create archive based on format
 */
export async function createArchive(
  options: ArchiveOptions,
  rootDir: string,
  hooks?: PluginHooks,
  verbose?: boolean,
  bundleHash?: string
): Promise<string> {
  const outDir = options.outDir || 'dist';
  const fileNamePattern = options.fileName || '[name]-[version]';
  const format: ArchiveFormat = options.format || 'zip';
  const compressionLevel = options.compressionLevel ?? 9;
  const archiveOutDir = options.archiveOutDir || rootDir;
  
  const sourceDir = path.resolve(rootDir, outDir);
  
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Output directory does not exist: ${sourceDir}`);
  }

  // Ensure output directory exists
  if (!fs.existsSync(archiveOutDir)) {
    fs.mkdirSync(archiveOutDir, { recursive: true });
  }

  // Get and filter files
  const allFiles = getFiles(sourceDir, sourceDir);
  const filteredFiles = filterFiles(allFiles, options.include, options.exclude);

  const archiveFileName = generateArchiveFileName(fileNamePattern, rootDir, format, bundleHash);
  const archivePath = path.resolve(archiveOutDir, archiveFileName);

  if (verbose) {
    const formatDisplay: Record<ArchiveFormat, string> = {
      'zip': 'ZIP',
      'tar': 'TAR',
      'tar.gz': 'TAR.GZ',
      '7z': '7Z',
    };
    console.log(`[pack-orchestrator] 📦 创建 ${formatDisplay[format]}: ${archiveFileName}`);
    console.log(`[pack-orchestrator] 📋 包含 ${filteredFiles.length} 个文件`);
  }

  try {
    switch (format) {
      case 'zip':
        await createZipArchive(sourceDir, archivePath, filteredFiles, compressionLevel, verbose);
        break;
      
      case 'tar':
        await createTarArchive(sourceDir, archivePath, filteredFiles, false, compressionLevel, verbose);
        break;
      
      case 'tar.gz':
        await createTarArchive(sourceDir, archivePath, filteredFiles, true, compressionLevel, verbose);
        break;
      
      case '7z':
        await create7zArchive(sourceDir, archivePath, filteredFiles, verbose);
        break;
      
      default:
        throw new Error(`Unsupported archive format: ${format}`);
    }

    // Calculate checksums of the archive file
    const checksums = calculateChecksums(archivePath);

    if (verbose) {
      console.log(`[pack-orchestrator] ✅ MD5: ${checksums.md5}`);
      console.log(`[pack-orchestrator] ✅ SHA1: ${checksums.sha1}`);
      console.log(`[pack-orchestrator] ✅ SHA256: ${checksums.sha256}`);
    }

    let finalPath = archivePath;

    if (hooks?.onAfterBuild) {
      const newPath = await hooks.onAfterBuild(archivePath, format, checksums);
      if (newPath && newPath !== archivePath) {
        const expectedExt = getArchiveExtension(format);
        if (!newPath.endsWith(expectedExt)) {
          const errMsg = `[pack-orchestrator] ⚠️ onAfterBuild 返回路径后缀 "${path.extname(newPath)}" 与打包格式 "${format}" (期望 "${expectedExt}") 不一致，文件内容格式与后缀不匹配`;
          console.warn(errMsg);
        }
        const dir = path.dirname(archivePath);
        const newFileName = path.basename(newPath);
        const finalFilePath = path.isAbsolute(newPath) ? newPath : path.resolve(dir, newFileName);
        fs.renameSync(archivePath, finalFilePath);
        finalPath = finalFilePath;
        if (verbose) {
          console.log(`[pack-orchestrator] 🔄 重命名: ${path.basename(finalFilePath)}`);
        }
      }
    }

    return finalPath;
  } catch (error) {
    if (hooks?.onError) {
      await hooks.onError(error as Error);
    }
    throw error;
  }
}
