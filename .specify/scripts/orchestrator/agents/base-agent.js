// .specify/scripts/orchestrator/agents/base-agent.js
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export class BaseAgent {
  constructor(name, cliCommand) {
    this.name = name;
    this.cliCommand = cliCommand;
  }

  async call(prompt, context = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`${this.getEmoji()} ${this.name.toUpperCase()}: Starting...`);
      console.log('─'.repeat(60));
      
      // Create temp prompt file
      const tempDir = path.join(process.cwd(), '.specify/state/temp');
      await fs.mkdir(tempDir, { recursive: true });
      
      const promptFile = path.join(tempDir, `${this.name}-prompt-${Date.now()}.txt`);
      const fullPrompt = this.formatPrompt(prompt, context);
      await fs.writeFile(promptFile, fullPrompt);
      
      console.log(`📝 Prompt saved to: ${path.basename(promptFile)}`);
      console.log(`📤 Calling ${this.name} CLI...`);
      
      // Execute CLI
      const command = this.buildCommand(promptFile);
      console.log(`💻 Command: ${command.substring(0, 80)}...`);
      
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB
        timeout: 300000 // 5 minutes
      });
      
      // Clean up
      await fs.unlink(promptFile).catch(() => {});
      
      const duration = Date.now() - startTime;
      const output = this.parseOutput(stdout);
      
      console.log(`✅ ${this.name} complete (${(duration / 1000).toFixed(1)}s)`);
      
      return {
        agent: this.name,
        success: true,
        output,
        rawOutput: stdout,
        duration,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ ${this.name} failed: ${error.message}`);
      
      return {
        agent: this.name,
        success: false,
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      };
    }
  }

  formatPrompt(prompt, context) {
    let formatted = prompt;
    
    if (context.constitution) {
      formatted = `# Constitutional Rules\n\n${context.constitution}\n\n---\n\n${formatted}`;
    }
    
    if (context.spec) {
      formatted += `\n\n# Specification\n\n${context.spec}`;
    }
    
    if (context.files) {
      formatted += '\n\n# Context Files\n\n';
      for (const [filepath, content] of Object.entries(context.files)) {
        formatted += `## ${filepath}\n\`\`\`\n${content}\n\`\`\`\n\n`;
      }
    }
    
    return formatted;
  }

  buildCommand(promptFile) {
    throw new Error('Subclass must implement buildCommand()');
  }

  parseOutput(stdout) {
    return stdout;
  }

  getEmoji() {
    const emojis = {
      qwen: '🤖',
      claude: '🔍',
      gemini: '☁️'
    };
    return emojis[this.name.toLowerCase()] || '❓';
  }
}