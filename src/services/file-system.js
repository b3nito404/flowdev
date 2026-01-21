import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';

const IGNORED = new Set(['node_modules', '.git', 'dist']);

/**
 * Génère une représentation visuelle de l'arborescence
 */
export async function generateTree(dir, prefix = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let output = '';

  // On trie pour avoir les dossiers en premier
  entries.sort((a, b) => b.isDirectory() - a.isDirectory());

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (IGNORED.has(entry.name)) continue;

    const isLast = i === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    
    // Style différent pour dossier et fichier
    const name = entry.isDirectory() 
      ? chalk.blue.bold(entry.name + '/') 
      : chalk.white(entry.name);

    output += `${prefix}${connector}${name}\n`;

    if (entry.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      output += await generateTree(path.join(dir, entry.name), newPrefix);
    }
  }
  return output;
}