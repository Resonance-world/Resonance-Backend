#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix relative imports that are missing .js extension
    // Match imports like: from "../path/to/file" but not from "../path/to/file.js"
    const importRegex = /from\s+['"](\.\.?\/[^'"]*?)(?<!\.js)['"]/g;
    
    content = content.replace(importRegex, (match, importPath) => {
      // Check if the file exists with .js extension
      const fullPath = path.resolve(path.dirname(filePath), importPath + '.js');
      if (fs.existsSync(fullPath)) {
        return match.replace(importPath, importPath + '.js');
      }
      return match;
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed imports in: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing imports in ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (file.endsWith('.js')) {
      fixImportsInFile(filePath);
    }
  }
}

// Start from the dist directory
const distDir = path.join(__dirname, '..', 'dist');
console.log('Fixing imports in dist directory...');
walkDirectory(distDir);
console.log('Import fixing completed!');
