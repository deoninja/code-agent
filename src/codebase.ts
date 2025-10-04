import { glob } from 'glob';
import { readFileSync } from 'fs';
import { join } from 'path';

export class Codebase {
  private files: Map<string, string> = new Map();

  constructor(private rootPath: string) {}

  async index() {
    const patterns = ['**/*.{ts,tsx,js,jsx,py,java,go,rs,cpp,c,h}'];
    const ignore = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
    ];

    const filePaths = await glob(patterns, {
      cwd: this.rootPath,
      ignore,
      absolute: false,
    });

    for (const file of filePaths) {
      const fullPath = join(this.rootPath, file);
      const content = readFileSync(fullPath, 'utf-8');
      this.files.set(file, content);
    }
  }

  findRelevantFiles(query: string): Array<{ path: string; content: string }> {
    const keywords = query.toLowerCase().split(' ');
    const results: Array<{ path: string; content: string; score: number }> = [];

    for (const [path, content] of this.files) {
      let score = 0;
      const lowerContent = content.toLowerCase();
      const lowerPath = path.toLowerCase();

      for (const keyword of keywords) {
        if (lowerPath.includes(keyword)) score += 10;
        if (lowerContent.includes(keyword)) score += 1;
      }

      if (score > 0) {
        results.push({ path, content, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ path, content }) => ({ path, content }));
  }

  readFile(path: string): string {
    const fullPath = join(this.rootPath, path);
    return readFileSync(fullPath, 'utf-8');
  }

  getAllFiles(): string[] {
    return Array.from(this.files.keys());
  }

  getFilesContent(files: string[]): string {
    return files
      .map((f) => `File: ${f}\n\`\`\`\n${this.files.get(f) || ''}\n\`\`\``)
      .join('\n\n');
  }

  getFileCount(): number {
    return this.files.size;
  }
}
