import MagicString from 'magic-string';
import type { TransformPluginContext } from 'rollup';
import type { CjsInteropOptions } from './types';

const DEFAULT_EXTENSIONS = ['.js', '.cjs', '.mjs'];

/**
 * Detect if code contains CommonJS patterns
 */
export function detectCjs(code: string): boolean {
  return /\brequire\s*\(|\bmodule\.exports\b|\bexports\b/.test(code);
}

/**
 * Transform CommonJS to ESM
 */
export function transformCjsToEsm(
  code: string,
  id: string,
  options: CjsInteropOptions = {}
): { code: string; map: any } | null {
  if (!options.enabled && options.enabled !== undefined) {
    return null;
  }

  const extensions = options.extensions || DEFAULT_EXTENSIONS;
  const ext = id.slice(id.lastIndexOf('.'));
  
  if (!extensions.includes(ext)) {
    return null;
  }

  // Check exclude patterns
  if (options.exclude) {
    for (const pattern of options.exclude) {
      if (typeof pattern === 'string') {
        if (id.includes(pattern)) return null;
      } else if (pattern instanceof RegExp) {
        if (pattern.test(id)) return null;
      }
    }
  }

  if (!detectCjs(code)) {
    return null;
  }

  const s = new MagicString(code);
  const exports: string[] = [];
  const imports: string[] = [];
  let hasDefaultExport = false;
  let exportIndex = 0;

  // Transform require() calls
  const requireRegex = /\brequire\s*\(\s*(['"`][^'"`]+['"`])\s*\)/g;
  const dynamicRequireRegex = /\brequire\s*\(\s*([^'"`][^)]*)\s*\)/g;
  
  let match;
  const requireMap = new Map<string, string>();

  // Handle static require()
  while ((match = requireRegex.exec(code)) !== null) {
    const fullMatch = match[0];
    const source = match[1].slice(1, -1);
    const varName = `__import_${exportIndex++}`;
    
    requireMap.set(fullMatch, varName);
    imports.push(`import * as ${varName} from ${match[1]};`);
  }

  // Replace static require() calls
  requireMap.forEach((varName, fullMatch) => {
    s.replaceAll(fullMatch, varName);
  });

  // Handle dynamic require() - convert to import()
  if (options.dynamicImport !== false) {
    while ((match = dynamicRequireRegex.exec(code)) !== null) {
      const fullMatch = match[0];
      const arg = match[1].trim();
      s.replaceAll(fullMatch, `await import(${arg})`);
    }
  }

  // Transform module.exports
  const moduleExportsRegex = /\bmodule\.exports\s*=\s*/g;
  while ((match = moduleExportsRegex.exec(code)) !== null) {
    const start = match.index;
    // Find the end of the expression
    let end = start + match[0].length;
    let depth = 0;
    let inString = false;
    let stringChar = '';
    
    while (end < code.length) {
      const char = code[end];
      
      if (inString) {
        if (char === stringChar && code[end - 1] !== '\\') {
          inString = false;
        }
      } else if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
      } else if (char === '{' || char === '[' || char === '(') {
        depth++;
      } else if (char === '}' || char === ']' || char === ')') {
        depth--;
      } else if ((char === ';' || char === '\n') && depth === 0) {
        break;
      }
      
      end++;
    }

    const exportValue = code.slice(start + match[0].length, end).trim();
    
    if (!hasDefaultExport) {
      s.overwrite(start, end, `export default ${exportValue}`);
      hasDefaultExport = true;
    } else {
      s.overwrite(start, end, `export const __moduleExports = ${exportValue}`);
    }
  }

  // Transform exports.xxx
  const exportsRegex = /\bexports\.(\w+)\s*=\s*/g;
  while ((match = exportsRegex.exec(code)) !== null) {
    const exportName = match[1];
    const start = match.index;
    let end = start + match[0].length;
    let depth = 0;
    let inString = false;
    let stringChar = '';
    
    while (end < code.length) {
      const char = code[end];
      
      if (inString) {
        if (char === stringChar && code[end - 1] !== '\\') {
          inString = false;
        }
      } else if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
      } else if (char === '{' || char === '[' || char === '(') {
        depth++;
      } else if (char === '}' || char === ']' || char === ')') {
        depth--;
      } else if ((char === ';' || char === '\n') && depth === 0) {
        break;
      }
      
      end++;
    }

    const exportValue = code.slice(start + match[0].length, end).trim();
    s.overwrite(start, end, `export const ${exportName} = ${exportValue}`);
    exports.push(exportName);
  }

  // Add __esModule marker
  if (hasDefaultExport || exports.length > 0) {
    s.prepend('export const __esModule = true;\n');
  }

  // Add imports at the top
  if (imports.length > 0) {
    s.prepend(imports.join('\n') + '\n');
  }

  return {
    code: s.toString(),
    map: s.generateMap({ source: id, includeContent: true })
  };
}

/**
 * Create CJS interop transform function for Vite plugin
 */
export function createCjsInteropTransform(options: CjsInteropOptions = {}) {
  return {
    name: 'pack-orchestrator:cjs-interop',
    
    transform(code: string, id: string) {
      try {
        const result = transformCjsToEsm(code, id, options);
        if (result && options.enabled !== false) {
          return result;
        }
        return null;
      } catch (error) {
        console.warn(`[pack-orchestrator] Failed to transform ${id}:`, error);
        return null;
      }
    }
  };
}
