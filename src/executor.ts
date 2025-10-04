import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export class CodeExecutor {
  constructor(private rootPath: string) {}

  async applyChanges(aiResponse: string) {
    const codeBlocks = this.extractCodeBlocks(aiResponse);

    for (const block of codeBlocks) {
      if (block.file) {
        const fullPath = join(this.rootPath, block.file);
        const dir = dirname(fullPath);
        mkdirSync(dir, { recursive: true });
        writeFileSync(fullPath, block.code, 'utf-8');
      }
    }
  }

  private extractCodeBlocks(
    text: string
  ): Array<{ file?: string; code: string }> {
    const blocks: Array<{ file?: string; code: string }> = [];
    const regex = /(?:File: `([^`]+)`\s*)?```(?:\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      blocks.push({
        file: match[1],
        code: match[2].trim(),
      });
    }

    return blocks;
  }
}
