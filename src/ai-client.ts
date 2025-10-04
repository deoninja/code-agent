import { GoogleGenAI } from '@google/genai';
import { Config } from './utils.js';

export class AIClient {
  constructor(private config: Config) {}

  async chat(
    history: Array<{ role: string; content: string }>,
    context: string
  ): Promise<string> {
    const systemPrompt = `You are an expert coding agent. You can read, analyze, edit, and fix code.
You have access to the user's codebase. When suggesting changes, provide complete code blocks with file paths.

Current codebase context:
${context}`;

    const messages = [{ role: 'system', content: systemPrompt }, ...history];

    return this.callAI(messages);
  }

  async review(content: string): Promise<string> {
    const prompt = `Review this code and provide detailed feedback on bugs, performance, security, and best practices:\n\n${content}`;
    return this.callAI([{ role: 'user', content: prompt }]);
  }

  async fixBugs(content: string, file: string): Promise<string> {
    const prompt = `Analyze this code from ${file} and provide fixes for any bugs:\n\n\`\`\`\n${content}\n\`\`\`\n\nProvide the complete fixed code.`;
    return this.callAI([{ role: 'user', content: prompt }]);
  }

  async refactor(
    content: string,
    file: string,
    suggestion?: string
  ): Promise<string> {
    const prompt = `Refactor this code from ${file}${
      suggestion ? ` with focus on: ${suggestion}` : ''
    }:\n\n\`\`\`\n${content}\n\`\`\`\n\nProvide the complete refactored code.`;
    return this.callAI([{ role: 'user', content: prompt }]);
  }

  async generate(
    description: string,
    options: any,
    context: string
  ): Promise<string> {
    const prompt = `Generate ${options.type || 'application'} based on: ${description}

${options.framework ? `Framework: ${options.framework}\n` : ''}${context}

Requirements:
- Create complete, production-ready code
- Include all necessary files with proper file paths
- Add proper error handling and validation
- Follow best practices and modern patterns
- Include package.json/requirements.txt if needed

Format each file as:
File: \`path/to/file.ext\`
\`\`\`language
code content
\`\`\`

Generate the complete ${options.type || 'application'}:`;
    return this.callAI([{ role: 'user', content: prompt }]);
  }

  private async callAI(
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    if (this.config.provider === 'gemini') {
      return this.callGemini(messages);
    }
    return this.callLocal(messages);
  }

  private async callGemini(
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: this.config.apiKey! });
    const prompt = messages.map((m) => `${m.role}: ${m.content}`).join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || '';
  }

  private async callLocal(
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    const response = await fetch(this.config.url!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI server error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}
