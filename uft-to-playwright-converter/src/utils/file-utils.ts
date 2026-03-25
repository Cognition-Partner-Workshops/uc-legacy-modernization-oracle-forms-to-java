/**
 * File utility functions for reading/writing UFT and Playwright files.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { logger } from './logger';

/**
 * Recursively find all UFT script files in a directory.
 * Supports .vbs, .qfl, .mts, .txt extensions.
 */
export async function findUFTScripts(dir: string): Promise<string[]> {
  const patterns = [
    '**/*.vbs',
    '**/*.qfl',
    '**/*.mts',
    '**/Action*.txt',     // UFT action scripts stored as .txt
    '**/Script.txt',      // UFT default script name
  ];

  const files: string[] = [];

  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: dir,
      absolute: true,
      nodir: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    });
    files.push(...matches);
  }

  // Deduplicate
  const unique = [...new Set(files)];
  logger.info(`Found ${unique.length} UFT script files in ${dir}`);
  return unique.sort();
}

/**
 * Find Object Repository files in a directory.
 * Supports .tsr, .bdb, .xml extensions.
 */
export async function findObjectRepositories(dir: string): Promise<string[]> {
  const patterns = ['**/*.tsr', '**/*.bdb', '**/ObjectRepository.xml', '**/*_OR.xml'];

  const files: string[] = [];

  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: dir,
      absolute: true,
      nodir: true,
    });
    files.push(...matches);
  }

  return [...new Set(files)].sort();
}

/**
 * Read a file with encoding detection.
 * UFT files may use UTF-8, UTF-16LE (BOM), or ANSI encoding.
 */
export function readFileContent(filePath: string): string {
  const buffer = fs.readFileSync(filePath);

  // Check for UTF-16LE BOM (common in UFT files)
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return buffer.toString('utf16le').replace(/^\uFEFF/, '');
  }

  // Check for UTF-8 BOM
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return buffer.toString('utf8').replace(/^\uFEFF/, '');
  }

  // Default to UTF-8
  return buffer.toString('utf8');
}

/**
 * Write content to a file, creating directories as needed.
 */
export function writeFileContent(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf8');
  logger.debug(`Written: ${filePath}`);
}

/**
 * Ensure a directory exists, creating it if necessary.
 */
export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Get the relative path from one directory to another.
 */
export function getRelativePath(from: string, to: string): string {
  return path.relative(from, to);
}

/**
 * Generate a unique output file path, avoiding overwrites.
 */
export function uniqueFilePath(filePath: string): string {
  if (!fs.existsSync(filePath)) return filePath;

  const ext = path.extname(filePath);
  const base = filePath.slice(0, -ext.length);
  let counter = 1;

  while (fs.existsSync(`${base}-${counter}${ext}`)) {
    counter++;
  }

  return `${base}-${counter}${ext}`;
}

/**
 * Copy a directory recursively.
 */
export function copyDir(src: string, dest: string): void {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
