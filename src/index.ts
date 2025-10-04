#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { CodeAgent } from './agent.js';
import { loadConfig, saveConfig } from './utils.js';
import inquirer from 'inquirer';

const program = new Command();

program
  .name('code-agent')
  .description('AI-powered coding agent for your codebase')
  .version('1.0.0');

program
  .command('chat')
  .description('Start interactive chat with the agent')
  .option('-p, --path <path>', 'Path to codebase', process.cwd())
  .action(async (options) => {
    const config = await loadConfig();
    const agent = new CodeAgent(options.path, config);
    await agent.startChat();
  });

program
  .command('review [files...]')
  .description('Review specific files or entire codebase')
  .option('-a, --all', 'Review entire codebase')
  .action(async (files, options) => {
    const config = await loadConfig();
    const agent = new CodeAgent(process.cwd(), config);
    await agent.review(options.all ? null : files);
  });

program
  .command('fix <file>')
  .description('Fix bugs in a specific file')
  .action(async (file) => {
    const config = await loadConfig();
    const agent = new CodeAgent(process.cwd(), config);
    await agent.fixBugs(file);
  });

program
  .command('refactor <file>')
  .description('Refactor code in a specific file')
  .option('-s, --suggestion <text>', 'Specific refactoring suggestion')
  .action(async (file, options) => {
    const config = await loadConfig();
    const agent = new CodeAgent(process.cwd(), config);
    await agent.refactor(file, options.suggestion);
  });

program
  .command('generate <description>')
  .description('Generate new code, files, or entire applications')
  .option('-t, --type <type>', 'Type of generation (app, component, function, test)', 'app')
  .option('-f, --framework <framework>', 'Framework to use (react, vue, express, fastapi, etc.)')
  .action(async (description, options) => {
    const config = await loadConfig();
    const agent = new CodeAgent(process.cwd(), config);
    await agent.generate(description, options);
  });

program
  .command('config')
  .description('Configure AI provider settings')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Select AI provider:',
        choices: ['ollama', 'lmstudio', 'gemini'],
      },
      {
        type: 'input',
        name: 'url',
        message: 'API URL:',
        default: (answers: any) =>
          answers.provider === 'ollama'
            ? 'http://localhost:11434/v1/chat/completions'
            : answers.provider === 'lmstudio'
            ? 'http://localhost:1234/v1/chat/completions'
            : '',
        when: (answers: any) => answers.provider !== 'gemini',
      },
      {
        type: 'input',
        name: 'model',
        message: 'Model name:',
        default: (answers: any) =>
          answers.provider === 'ollama'
            ? 'llama3.1:8b'
            : answers.provider === 'lmstudio'
            ? 'local-model'
            : '',
      },
      {
        type: 'password',
        name: 'apiKey',
        message: 'API Key:',
        when: (answers: any) => answers.provider === 'gemini',
      },
    ]);

    await saveConfig(answers);
    console.log(chalk.green('✓ Configuration saved!'));
  });

program.parse();
