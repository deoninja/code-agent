import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface Config {
  provider: 'ollama' | 'lmstudio' | 'gemini';
  url?: string;
  model?: string;
  apiKey?: string;
}

const CONFIG_DIR = join(homedir(), '.code-agent');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export async function loadConfig(): Promise<Config> {
  if (!existsSync(CONFIG_FILE)) {
    return {
      provider: 'ollama',
      url: 'http://localhost:11434/v1/chat/completions',
      model: 'llama3.1:8b',
    };
  }
  return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
}

export async function saveConfig(config: Config) {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
