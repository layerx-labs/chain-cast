#!/usr/bin/env bun
/**
 * castc - ChainCast DSL Compiler CLI
 *
 * Usage:
 *   castc compile input.yaml -o output.json
 *   castc validate input.yaml
 *   castc decompile input.json -o output.yaml
 */

import { existsSync, readFileSync, watchFile, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import type { InstructionCall } from '@/types/vm';
import { Command } from 'commander';
import { compile, decompileToYAML, formatError, validate } from '../index';

const program = new Command();

program
  .name('castc')
  .description('ChainCast DSL Compiler - Compile YAML pipelines to JSON')
  .version('1.0.0');

/**
 * Compile command
 */
program
  .command('compile <input>')
  .description('Compile DSL file to JSON')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .option('--minify', 'Minify JSON output')
  .option('--base64', 'Output base64 encoded (for direct use in ChainCast)')
  .action((input: string, options: { output?: string; minify?: boolean; base64?: boolean }) => {
    try {
      const inputPath = resolve(input);

      if (!existsSync(inputPath)) {
        console.error(`Error: File not found: ${inputPath}`);
        process.exit(1);
      }

      const source = readFileSync(inputPath, 'utf-8');
      const result = compile(source, {
        minify: options.minify,
        base64: options.base64,
      });

      if (!result.success) {
        console.error('Compilation failed:');
        for (const error of result.errors) {
          console.error(`  ${formatError(error)}`);
        }
        process.exit(1);
      }

      const data = result.data;
      if (!data) {
        console.error('Error: Compilation produced no output');
        process.exit(1);
      }

      const output = options.base64 ? data.base64 : data.json;

      if (options.output) {
        const outputPath = resolve(options.output);
        writeFileSync(outputPath, output ?? '');
        console.log(`Compiled successfully: ${outputPath}`);
      } else {
        console.log(output);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Validate command
 */
program
  .command('validate <input>')
  .description('Validate DSL file without generating output')
  .action((input: string) => {
    try {
      const inputPath = resolve(input);

      if (!existsSync(inputPath)) {
        console.error(`Error: File not found: ${inputPath}`);
        process.exit(1);
      }

      const source = readFileSync(inputPath, 'utf-8');
      const result = validate(source);

      if (!result.success) {
        console.error('Validation failed:');
        for (const error of result.errors) {
          console.error(`  ${formatError(error)}`);
        }
        process.exit(1);
      }

      console.log('Validation successful!');
      console.log(`  Name: ${result.data?.name || '(unnamed)'}`);
      console.log(`  Version: ${result.data?.version}`);
      console.log(`  Instructions: ${result.data?.program.length}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Watch command
 */
program
  .command('watch <input>')
  .description('Watch file and recompile on changes')
  .option('-o, --output <file>', 'Output file')
  .option('--minify', 'Minify JSON output')
  .option('--base64', 'Output base64 encoded')
  .action((input: string, options: { output?: string; minify?: boolean; base64?: boolean }) => {
    const inputPath = resolve(input);

    if (!existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`);
      process.exit(1);
    }

    console.log(`Watching ${inputPath} for changes...`);

    const compileFile = () => {
      try {
        const source = readFileSync(inputPath, 'utf-8');
        const result = compile(source, {
          minify: options.minify,
          base64: options.base64,
        });

        if (!result.success) {
          console.error('\nCompilation failed:');
          for (const error of result.errors) {
            console.error(`  ${formatError(error)}`);
          }
          return;
        }

        const data = result.data;
        if (!data) return;

        const output = options.base64 ? data.base64 : data.json;

        if (options.output) {
          const outputPath = resolve(options.output);
          writeFileSync(outputPath, output ?? '');
          console.log(`\n[${new Date().toLocaleTimeString()}] Compiled: ${outputPath}`);
        } else {
          console.log(`\n[${new Date().toLocaleTimeString()}] Compiled successfully`);
          console.log(output);
        }
      } catch (error) {
        console.error('\nError:', error instanceof Error ? error.message : error);
      }
    };

    // Initial compile
    compileFile();

    // Watch for changes
    watchFile(inputPath, { interval: 500 }, () => {
      compileFile();
    });

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\nStopping watch...');
      process.exit(0);
    });
  });

/**
 * Decompile command
 */
program
  .command('decompile <input>')
  .description('Convert JSON instructions back to DSL')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .option('--name <name>', 'Name for the generated DSL')
  .option('--description <desc>', 'Description for the generated DSL')
  .action((input: string, options: { output?: string; name?: string; description?: string }) => {
    try {
      const inputPath = resolve(input);

      if (!existsSync(inputPath)) {
        console.error(`Error: File not found: ${inputPath}`);
        process.exit(1);
      }

      const content = readFileSync(inputPath, 'utf-8');
      let instructions: InstructionCall[];

      // Detect if input is base64 or JSON
      const ext = extname(inputPath).toLowerCase();
      if (ext === '.json') {
        instructions = JSON.parse(content) as InstructionCall[];
      } else {
        // Try to decode as base64
        try {
          const decoded = Buffer.from(content.trim(), 'base64').toString('utf-8');
          instructions = JSON.parse(decoded) as InstructionCall[];
        } catch {
          // Try as raw JSON
          instructions = JSON.parse(content) as InstructionCall[];
        }
      }

      const yaml = decompileToYAML(instructions, {
        name: options.name,
        description: options.description,
      });

      if (options.output) {
        const outputPath = resolve(options.output);
        writeFileSync(outputPath, yaml);
        console.log(`Decompiled successfully: ${outputPath}`);
      } else {
        console.log(yaml);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
