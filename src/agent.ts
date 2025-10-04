import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { AIClient } from './ai-client.js';
import { Codebase } from './codebase.js';
import { CodeExecutor } from './executor.js';
import { Config } from './utils.js';

export class CodeAgent {
  private ai: AIClient;
  private codebase: Codebase;
  private executor: CodeExecutor;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(private rootPath: string, private config: Config) {
    this.ai = new AIClient(config);
    this.codebase = new Codebase(rootPath);
    this.executor = new CodeExecutor(rootPath);
  }

  async startChat() {
    console.log(chalk.blue.bold('\n🤖 Code Agent - Interactive Mode\n'));
    console.log(
      chalk.gray('Type "exit" to quit, "clear" to reset conversation\n')
    );

    const spinner = ora('Indexing codebase...').start();
    await this.codebase.index();
    spinner.succeed(`Indexed ${this.codebase.getFileCount()} files`);

    while (true) {
      const { message } = await inquirer.prompt([
        {
          type: 'input',
          name: 'message',
          message: chalk.cyan('You:'),
          prefix: '',
        },
      ]);

      if (message.toLowerCase() === 'exit') break;
      if (message.toLowerCase() === 'clear') {
        this.conversationHistory = [];
        console.log(chalk.yellow('Conversation cleared\n'));
        continue;
      }

      await this.processMessage(message);
    }
  }

  private async processMessage(message: string) {
    const spinner = ora('Thinking...').start();

    try {
      const context = this.buildContext(message);
      this.conversationHistory.push({ role: 'user', content: message });

      const response = await this.ai.chat(this.conversationHistory, context);

      this.conversationHistory.push({ role: 'assistant', content: response });
      spinner.stop();

      console.log(chalk.green('\n🤖 Agent:'), response, '\n');

      if (this.shouldExecuteAction(response)) {
        await this.executeAction(response);
      }
    } catch (error) {
      spinner.fail('Error');
      console.error(
        chalk.red(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  private buildContext(message: string): string {
    const relevantFiles = this.codebase.findRelevantFiles(message);
    return relevantFiles
      .map((f) => `File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
      .join('\n\n');
  }

  private shouldExecuteAction(response: string): boolean {
    return (
      response.includes('```') &&
      (response.toLowerCase().includes('edit') ||
        response.toLowerCase().includes('create') ||
        response.toLowerCase().includes('modify'))
    );
  }

  private async executeAction(response: string) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Execute suggested changes?',
        default: false,
      },
    ]);

    if (confirm) {
      await this.executor.applyChanges(response);
      console.log(chalk.green('✓ Changes applied\n'));
    }
  }

  async review(files: string[] | null) {
    const spinner = ora('Analyzing code...').start();

    try {
      await this.codebase.index();
      const filesToReview = files || this.codebase.getAllFiles();
      const content = this.codebase.getFilesContent(filesToReview);

      const review = await this.ai.review(content);
      spinner.succeed('Review complete');

      console.log(chalk.blue.bold('\n📋 Code Review:\n'));
      console.log(review);
    } catch (error) {
      spinner.fail('Review failed');
      console.error(
        chalk.red(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async fixBugs(file: string) {
    const spinner = ora(`Analyzing ${file}...`).start();

    try {
      const content = this.codebase.readFile(file);
      const fixes = await this.ai.fixBugs(content, file);

      spinner.succeed('Analysis complete');
      console.log(chalk.blue.bold('\n🔧 Suggested Fixes:\n'));
      console.log(fixes);

      const { apply } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'apply',
          message: 'Apply fixes?',
          default: false,
        },
      ]);

      if (apply) {
        await this.executor.applyChanges(fixes);
        console.log(chalk.green('✓ Fixes applied'));
      }
    } catch (error) {
      spinner.fail('Fix failed');
      console.error(
        chalk.red(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async refactor(file: string, suggestion?: string) {
    const spinner = ora(`Refactoring ${file}...`).start();

    try {
      const content = this.codebase.readFile(file);
      const refactored = await this.ai.refactor(content, file, suggestion);

      spinner.succeed('Refactoring complete');
      console.log(chalk.blue.bold('\n♻️  Refactored Code:\n'));
      console.log(refactored);

      const { apply } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'apply',
          message: 'Apply refactoring?',
          default: false,
        },
      ]);

      if (apply) {
        await this.executor.applyChanges(refactored);
        console.log(chalk.green('✓ Refactoring applied'));
      }
    } catch (error) {
      spinner.fail('Refactoring failed');
      console.error(
        chalk.red(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async generate(description: string, options: any) {
    const spinner = ora('Generating code...').start();

    try {
      await this.codebase.index();
      const context = this.buildGenerationContext();
      const generated = await this.ai.generate(description, options, context);

      spinner.succeed('Generation complete');
      console.log(chalk.blue.bold('\n🚀 Generated Code:\n'));
      console.log(generated);

      const { apply } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'apply',
          message: 'Create these files?',
          default: true,
        },
      ]);

      if (apply) {
        await this.executor.applyChanges(generated);
        console.log(chalk.green('✓ Files created successfully'));
      }
    } catch (error) {
      spinner.fail('Generation failed');
      console.error(
        chalk.red(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  private buildGenerationContext(): string {
    const files = this.codebase.getAllFiles();
    const projectStructure = files.slice(0, 10).join('\n');
    return `Current project structure:\n${projectStructure}`;
  }
}
