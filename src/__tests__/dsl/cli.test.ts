import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('castc CLI', () => {
  let testDir: string;
  let originalArgv: string[];
  let originalExit: typeof process.exit;
  let exitCode: number | undefined;
  let consoleOutput: string[];
  let consoleErrors: string[];

  beforeEach(() => {
    // Create temp directory for test files
    testDir = join(tmpdir(), `castc-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    // Save original values
    originalArgv = process.argv;
    originalExit = process.exit;

    // Mock process.exit
    exitCode = undefined;
    process.exit = ((code?: number) => {
      exitCode = code;
      throw new Error(`Process exited with code ${code}`);
    }) as typeof process.exit;

    // Capture console output
    consoleOutput = [];
    consoleErrors = [];

    spyOn(console, 'log').mockImplementation((...args) => {
      consoleOutput.push(args.join(' '));
    });

    spyOn(console, 'error').mockImplementation((...args) => {
      consoleErrors.push(args.join(' '));
    });
  });

  afterEach(() => {
    // Restore original values
    process.argv = originalArgv;
    process.exit = originalExit;

    // Clean up temp directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }

    // Restore console
    mock.restore();
  });

  /**
   * Helper to run CLI with arguments
   */
  async function runCLI(args: string[]): Promise<void> {
    process.argv = ['bun', 'castc.ts', ...args];

    // Clear the module cache to re-run the CLI
    const cliPath = join(import.meta.dir, '../../dsl/cli/castc.ts');

    // Dynamic import to run the CLI
    try {
      await import(`${cliPath}?t=${Date.now()}`);
    } catch (error) {
      // Ignore exit errors
      if (!(error instanceof Error && error.message.includes('Process exited'))) {
        throw error;
      }
    }
  }

  /**
   * Helper to create a test DSL file
   */
  function createTestFile(filename: string, content: string): string {
    const filepath = join(testDir, filename);
    writeFileSync(filepath, content);
    return filepath;
  }

  describe('compile command', () => {
    const validDSL = `
version: "1.0"
name: "Test Pipeline"
program:
  - filter-events:
      events: ["Transfer"]
  - debug:
      variables: [event]
`;

    it('should compile a valid DSL file to stdout', async () => {
      const inputFile = createTestFile('test.yaml', validDSL);

      await runCLI(['compile', inputFile]);

      expect(consoleOutput.length).toBeGreaterThan(0);
      const output = consoleOutput.join('\n');
      expect(output).toContain('filter-events');
      expect(output).toContain('eventNames');
    });

    it('should compile a valid DSL file to output file', async () => {
      const inputFile = createTestFile('test.yaml', validDSL);
      const outputFile = join(testDir, 'output.json');

      await runCLI(['compile', inputFile, '-o', outputFile]);

      expect(existsSync(outputFile)).toBe(true);
      const content = readFileSync(outputFile, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('filter-events');
    });

    it('should compile with --minify option', async () => {
      const inputFile = createTestFile('test.yaml', validDSL);
      const outputFile = join(testDir, 'output.json');

      await runCLI(['compile', inputFile, '-o', outputFile, '--minify']);

      const content = readFileSync(outputFile, 'utf-8');
      expect(content).not.toContain('\n');
      expect(content).not.toContain('  ');
    });

    it('should compile with --base64 option', async () => {
      const inputFile = createTestFile('test.yaml', validDSL);

      await runCLI(['compile', inputFile, '--base64']);

      const output = consoleOutput.join('\n');
      // Base64 should not contain typical JSON characters
      expect(output).not.toContain('{');
      expect(output).not.toContain('[');

      // Decode and verify
      const decoded = Buffer.from(output.trim(), 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      expect(parsed[0].name).toBe('filter-events');
    });

    it('should fail on invalid DSL file', async () => {
      const invalidDSL = `
version: "1.0"
program:
  - unknown-instruction:
      foo: bar
`;
      const inputFile = createTestFile('invalid.yaml', invalidDSL);

      await runCLI(['compile', inputFile]);

      expect(exitCode).toBe(1);
      expect(consoleErrors.some((e) => e.includes('Compilation failed'))).toBe(true);
    });

    it('should fail on non-existent file', async () => {
      await runCLI(['compile', '/nonexistent/file.yaml']);

      expect(exitCode).toBe(1);
      expect(consoleErrors.some((e) => e.includes('File not found'))).toBe(true);
    });
  });

  describe('validate command', () => {
    it('should validate a correct DSL file', async () => {
      const validDSL = `
version: "1.0"
name: "Test Pipeline"
program:
  - debug:
      variables: [event]
`;
      const inputFile = createTestFile('valid.yaml', validDSL);

      await runCLI(['validate', inputFile]);

      expect(consoleOutput.some((o) => o.includes('Validation successful'))).toBe(true);
      expect(consoleOutput.some((o) => o.includes('Test Pipeline'))).toBe(true);
    });

    it('should report validation errors', async () => {
      const invalidDSL = `
version: "1.0"
program:
  - webhok:
      url: "https://example.com"
      body: event
`;
      const inputFile = createTestFile('invalid.yaml', invalidDSL);

      await runCLI(['validate', inputFile]);

      expect(exitCode).toBe(1);
      expect(consoleErrors.some((e) => e.includes('Validation failed'))).toBe(true);
    });

    it('should fail on non-existent file', async () => {
      await runCLI(['validate', '/nonexistent/file.yaml']);

      expect(exitCode).toBe(1);
      expect(consoleErrors.some((e) => e.includes('File not found'))).toBe(true);
    });

    it('should display instruction count', async () => {
      const validDSL = `
version: "1.0"
program:
  - set:
      variable: aa
      value: 1
  - set:
      variable: bb
      value: 2
  - set:
      variable: cc
      value: 3
`;
      const inputFile = createTestFile('multi.yaml', validDSL);

      await runCLI(['validate', inputFile]);

      expect(consoleOutput.some((o) => o.includes('Instructions: 3'))).toBe(true);
    });
  });

  describe('decompile command', () => {
    it('should decompile JSON to YAML', async () => {
      const jsonContent = JSON.stringify([
        { name: 'filter-events', args: { eventNames: ['Transfer'] } },
        { name: 'debug', args: { variablesToDebug: ['event'] } },
      ]);
      const inputFile = createTestFile('input.json', jsonContent);

      await runCLI(['decompile', inputFile]);

      const output = consoleOutput.join('\n');
      expect(output).toContain('version:');
      expect(output).toContain('filter-events:');
      expect(output).toContain('debug:');
    });

    it('should decompile to output file', async () => {
      const jsonContent = JSON.stringify([{ name: 'set', args: { variable: 'test', value: 123 } }]);
      const inputFile = createTestFile('input.json', jsonContent);
      const outputFile = join(testDir, 'output.yaml');

      await runCLI(['decompile', inputFile, '-o', outputFile]);

      expect(existsSync(outputFile)).toBe(true);
      const content = readFileSync(outputFile, 'utf-8');
      expect(content).toContain('version:');
      expect(content).toContain('set:');
    });

    it('should decompile with --name option', async () => {
      const jsonContent = JSON.stringify([
        { name: 'debug', args: { variablesToDebug: ['event'] } },
      ]);
      const inputFile = createTestFile('input.json', jsonContent);

      await runCLI(['decompile', inputFile, '--name', 'My Pipeline']);

      const output = consoleOutput.join('\n');
      expect(output).toContain('name:');
      expect(output).toContain('My Pipeline');
    });

    it('should decompile with --description option', async () => {
      const jsonContent = JSON.stringify([
        { name: 'debug', args: { variablesToDebug: ['event'] } },
      ]);
      const inputFile = createTestFile('input.json', jsonContent);

      await runCLI(['decompile', inputFile, '--description', 'A test pipeline']);

      const output = consoleOutput.join('\n');
      expect(output).toContain('description:');
      expect(output).toContain('A test pipeline');
    });

    it('should decompile base64 encoded content', async () => {
      const jsonContent = JSON.stringify([{ name: 'set', args: { variable: 'test', value: 42 } }]);
      const base64Content = Buffer.from(jsonContent).toString('base64');
      const inputFile = createTestFile('input.b64', base64Content);

      await runCLI(['decompile', inputFile]);

      const output = consoleOutput.join('\n');
      expect(output).toContain('set:');
      expect(output).toContain('variable:');
    });

    it('should fail on non-existent file', async () => {
      await runCLI(['decompile', '/nonexistent/file.json']);

      expect(exitCode).toBe(1);
      expect(consoleErrors.some((e) => e.includes('File not found'))).toBe(true);
    });

    it('should fail on invalid JSON', async () => {
      const inputFile = createTestFile('invalid.json', 'not valid json');

      await runCLI(['decompile', inputFile]);

      expect(exitCode).toBe(1);
    });
  });

  describe('help and version', () => {
    let stdoutOutput: string[];
    let originalStdoutWrite: typeof process.stdout.write;

    beforeEach(() => {
      stdoutOutput = [];
      originalStdoutWrite = process.stdout.write;
      process.stdout.write = ((chunk: string | Uint8Array) => {
        stdoutOutput.push(chunk.toString());
        return true;
      }) as typeof process.stdout.write;
    });

    afterEach(() => {
      process.stdout.write = originalStdoutWrite;
    });

    it('should display help with --help', async () => {
      await runCLI(['--help']);

      const output = stdoutOutput.join('');
      expect(output).toContain('Usage:');
      expect(output).toContain('castc');
      expect(output).toContain('compile');
      expect(output).toContain('validate');
      expect(output).toContain('decompile');
    });

    it('should display version with --version', async () => {
      await runCLI(['--version']);

      const output = stdoutOutput.join('');
      expect(output).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should display help for compile command', async () => {
      await runCLI(['compile', '--help']);

      const output = stdoutOutput.join('');
      expect(output).toContain('--output');
      expect(output).toContain('--minify');
      expect(output).toContain('--base64');
    });

    it('should display help for validate command', async () => {
      await runCLI(['validate', '--help']);

      const output = stdoutOutput.join('');
      expect(output).toContain('Validate');
    });

    it('should display help for decompile command', async () => {
      await runCLI(['decompile', '--help']);

      const output = stdoutOutput.join('');
      expect(output).toContain('--output');
      expect(output).toContain('--name');
      expect(output).toContain('--description');
    });
  });

  describe('edge cases', () => {
    it('should handle files with spaces in path', async () => {
      const spacedDir = join(testDir, 'path with spaces');
      mkdirSync(spacedDir, { recursive: true });

      const validDSL = `
version: "1.0"
program:
  - debug:
      variables: [event]
`;
      const inputFile = join(spacedDir, 'test file.yaml');
      writeFileSync(inputFile, validDSL);

      await runCLI(['compile', inputFile]);

      expect(consoleOutput.length).toBeGreaterThan(0);
      const output = consoleOutput.join('\n');
      expect(output).toContain('debug');
    });

    it('should handle empty program gracefully', async () => {
      const emptyProgram = `
version: "1.0"
program: []
`;
      const inputFile = createTestFile('empty.yaml', emptyProgram);

      await runCLI(['compile', inputFile]);

      expect(exitCode).toBe(1);
    });

    it('should compile complex nested conditions', async () => {
      const complexDSL = `
version: "1.0"
program:
  - condition:
      when:
        all:
          - variable: amount
            operator: ">"
            compareTo: threshold
      then: branch_0
      else: branch_1
      branches:
        branch_0:
          - condition:
              when:
                all:
                  - variable: amount
                    operator: "<"
                    compareTo: maxThreshold
              then: branch_0
              else: branch_1
              branches:
                branch_0:
                  - webhook:
                      url: "https://example.com"
                      body: event
                branch_1:
                  - debug:
                      variables: [amount]
        branch_1:
          - debug:
              variables: [event]
`;
      const inputFile = createTestFile('complex.yaml', complexDSL);
      const outputFile = join(testDir, 'complex.json');

      await runCLI(['compile', inputFile, '-o', outputFile]);

      expect(existsSync(outputFile)).toBe(true);
      const content = readFileSync(outputFile, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed[0].name).toBe('condition');
      expect(parsed[0].args.branch_0[0].name).toBe('condition');
    });

    it('should handle all instruction types in one file', async () => {
      const allInstructions = `
version: "1.0"
name: "All Instructions"
program:
  - filter-events:
      events: ["Transfer"]
  - set:
      variable: threshold
      value: 1000
  - debug:
      variables: [event]
  - transform-string:
      from: event.name
      transform: uppercase
      to: formattedName
  - transform-number:
      left: amount
      right: divisor
      transform: divide
      to: result
  - transform-object:
      from: event.returnValues
      transform: keys
      to: eventKeys
  - transform-array:
      from: myArray
      transform: length
      to: arrayLength
  - transform-template:
      context: [event.from, event.to]
      template: "{{var0}} -> {{var1}}"
      to: message
  - webhook:
      url: "https://api.example.com"
      body: event
  - bullmq:
      queue: "events"
      body: event
`;
      const inputFile = createTestFile('all.yaml', allInstructions);
      const outputFile = join(testDir, 'all.json');

      await runCLI(['compile', inputFile, '-o', outputFile]);

      expect(existsSync(outputFile)).toBe(true);
      const content = readFileSync(outputFile, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toHaveLength(10);
    });
  });

  describe('round-trip via CLI', () => {
    it('should round-trip compile -> decompile -> compile', async () => {
      const originalDSL = `
version: "1.0"
name: "Round Trip Test"
program:
  - filter-events:
      events: ["Transfer"]
  - set:
      variable: threshold
      value: 1000
  - webhook:
      url: "https://api.example.com"
      body: event
`;
      const inputFile = createTestFile('original.yaml', originalDSL);
      const jsonFile = join(testDir, 'compiled.json');
      const decompileFile = join(testDir, 'decompiled.yaml');
      const recompiledFile = join(testDir, 'recompiled.json');

      // Step 1: Compile original DSL to JSON
      await runCLI(['compile', inputFile, '-o', jsonFile]);
      expect(existsSync(jsonFile)).toBe(true);

      // Step 2: Decompile JSON back to YAML
      await runCLI(['decompile', jsonFile, '-o', decompileFile, '--name', 'Round Trip Test']);
      expect(existsSync(decompileFile)).toBe(true);

      // Step 3: Compile decompiled YAML back to JSON
      await runCLI(['compile', decompileFile, '-o', recompiledFile]);
      expect(existsSync(recompiledFile)).toBe(true);

      // Compare original and recompiled JSON
      const originalJSON = JSON.parse(readFileSync(jsonFile, 'utf-8'));
      const recompiledJSON = JSON.parse(readFileSync(recompiledFile, 'utf-8'));

      expect(recompiledJSON).toEqual(originalJSON);
    });
  });
});
