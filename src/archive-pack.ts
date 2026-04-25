import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import archiver from 'archiver';
import * as tar from 'tar';
import picomatch from 'picomatch';
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
  hash?: string,
  md5?: string
): string {
  const version = getPackageVersion(rootDir);
  const name = getPackageName(rootDir);
  const timestamp = Date.now().toString();
  const shortHash = hash ? hash.slice(0, 8) : '';
  const shortMd5 = md5 ? md5.slice(0, 8) : '';
  const extension = getArchiveExtension(format);

  let fileName = pattern
    .replace(/\[version\]/g, version)
    .replace(/\[name\]/g, name)
    .replace(/\[hash\]/g, shortHash)
    .replace(/\[md5\]/g, shortMd5)
    .replace(/\[timestamp\]/g, timestamp);

  // Ensure correct extension
  const extPattern = /\.(zip|tar\.gz|tar|7z)$/;
  if (!extPattern.test(fileName)) {
    fileName += extension;
  }

  return fileName;
}

/**
 * Calculate MD5 hash of a file
 */
function calculateFileMd5(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(buffer).digest('hex');
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
 * Create 7z archive (requires 7z to be installed)
 */
async function create7zArchive(
  sourceDir: string,
  archivePath: string,
  filteredFiles: string[],
  verbose?: boolean
): Promise<void> {
  const { execa } = await import('execa');
  
  // Check if 7z is available
  try {
    await execa('7z', ['--help']);
  } catch {
    throw new Error(
      '7z command not found. Please install 7-Zip:\n' +
      '  Windows: choco install 7zip or download from https://www.7-zip.org/\n' +
      '  macOS: brew install p7zip\n' +
      '  Linux: apt install p7zip-full'
    );
  }

  // Use filtered files list for 7z
  const filesToArchive = filteredFiles.length > 0 
    ? filteredFiles.map(f => path.join(sourceDir, f))
    : [sourceDir];
  
  await execa('7z', ['a', archivePath, ...filesToArchive]);

  if (verbose) {
    const size = fs.statSync(archivePath).size;
    console.log(`[pack-orchestrator] ✅ 7Z 完成: ${archivePath} (${(size / 1024).toFixed(2)} KB)`);
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

  // Create archive with temp name first
  const tempFileName = generateArchiveFileName(fileNamePattern, rootDir, format, bundleHash);
  const tempArchivePath = path.resolve(archiveOutDir, tempFileName);

  if (verbose) {
    const formatDisplay: Record<ArchiveFormat, string> = {
      'zip': 'ZIP',
      'tar': 'TAR',
      'tar.gz': 'TAR.GZ',
      '7z': '7Z',
    };
    console.log(`[pack-orchestrator] 📦 创建 ${formatDisplay[format]}: ${tempFileName}`);
    console.log(`[pack-orchestrator] 📋 包含 ${filteredFiles.length} 个文件`);
  }

  try {
    switch (format) {
      case 'zip':
        await createZipArchive(sourceDir, tempArchivePath, filteredFiles, compressionLevel, verbose);
        break;
      
      case 'tar':
        await createTarArchive(sourceDir, tempArchivePath, filteredFiles, false, compressionLevel, verbose);
        break;
      
      case 'tar.gz':
        await createTarArchive(sourceDir, tempArchivePath, filteredFiles, true, compressionLevel, verbose);
        break;
      
      case '7z':
        await create7zArchive(sourceDir, tempArchivePath, filteredFiles, verbose);
        break;
      
      default:
        throw new Error(`Unsupported archive format: ${format}`);
    }

    // Calculate MD5 of the archive file
    const archiveMd5 = calculateFileMd5(tempArchivePath);

    // Check if filename contains [md5] placeholder
    if (fileNamePattern.includes('[md5]')) {
      const finalFileName = generateArchiveFileName(fileNamePattern, rootDir, format, bundleHash, archiveMd5);
      const finalArchivePath = path.resolve(archiveOutDir, finalFileName);
      
      // Rename file to include MD5
      fs.renameSync(tempArchivePath, finalArchivePath);

      if (verbose) {
        console.log(`[pack-orchestrator] ✅ MD5: ${archiveMd5}`);
      }

      if (hooks?.onAfterBuild) {
        await hooks.onAfterBuild(finalArchivePath, format);
      }

      return finalArchivePath;
    }

    if (hooks?.onAfterBuild) {
      await hooks.onAfterBuild(tempArchivePath, format);
    }

    return tempArchivePath;
  } catch (error) {
    // Clean up temp file if exists
    if (fs.existsSync(tempArchivePath)) {
      fs.unlinkSync(tempArchivePath);
    }
    if (hooks?.onError) {
      await hooks.onError(error as Error);
    }
    throw error;
  }
}
