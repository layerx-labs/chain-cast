// eslint-disable-next-line @typescript-eslint/no-explicit-any
/** Dictionary type for storing variables with arbitrary values */
export type VariableDict = { [key: string]: any };

import type { z } from 'zod';

/**
 * Represents a single instruction call within a program.
 * Contains the instruction name, optional arguments, and optional branching logic.
 */
export type InstructionCall = {
  name: string; // Name of the instruction to execute
  args?: InstructionArgs; // Arguments to pass to the instruction
  branches?: Program[]; // Optional conditional branches for control flow
};

/**
 * Arguments passed to an instruction, allowing arbitrary key-value pairs.
 * Used for configuring instruction behavior at runtime.
 */
export type InstructionArgs = {
  [key: string]: unknown; // Flexible argument structure
};

/**
 * Typed variable storage for instruction processing.
 * Restricts values to primitive types and arrays for type safety.
 */
export type Variable = { [key: string]: number | string | boolean | number[] | string[] };

/**
 * Type definition for instruction argument fields.
 * Used for schema validation and type checking of instruction arguments.
 */
export type ArgFieldType = {
  type: 'number' | 'string' | 'boolean' | 'number[]' | 'string[]' | 'date' | 'any'; // Supported field types
  required: boolean; // Whether this field must be provided
};

/**
 * Zod schema type for validating instruction arguments.
 * Provides runtime type checking and validation for instruction configurations.
 */
export type ArgsSchema<T extends z.ZodRawShape> = z.ZodObject<T>;

/**
 * Core interface for instruction implementations.
 * Defines the contract that all executable instructions must follow.
 */
export type Instruction = {
  name(): string; // Get the unique name identifier for this instruction
  getArgsSchema(): ArgsSchema<any>; // Get the validation schema for arguments
  validateArgs(conf: InstructionArgs | undefined): boolean; // Validate provided arguments
  onAction(vm: VirtualMachine): void; // Execute the instruction logic
};

/**
 * Constructor signature for instruction classes.
 * Used by the instruction registry to instantiate instruction instances.
 */
export type InstructionConstructor<M> = new () => M;

/**
 * Registry mapping instruction names to their constructor functions.
 * Used by virtual machines to instantiate instructions by name.
 */
export type InstructionMap = {
  [key: string]: InstructionConstructor<Instruction>;
};

/**
 * Virtual Machine interface for executing instruction programs.
 * Provides a sandboxed execution environment for processing blockchain events
 * through a sequence of programmable instructions.
 */
export type VirtualMachine = {
  // Variable management
  getGlobalVariables(): VariableDict; // Get all global variables
  getGlobalVariable(name: string): any; // Get a specific global variable
  getGlobalVariableFromPath(path: string): any; // Get nested variable using dot notation
  setGlobalVariable(name: string, value: any): void; // Set a global variable value

  // Program execution
  executeInstructions(instructionCalls: InstructionCall[]): Promise<void>; // Execute multiple instructions
  execute<N extends string, T>(trigger: Trigger<N, T>): Promise<void>; // Execute with trigger payload
  executeInstruction(instructionCall: InstructionCall): Promise<void> | void; // Execute single instruction

  // Stack management
  getCurrentStackItem(): InstructionCall | undefined; // Get current instruction on stack
  getStack(): InstructionCall[]; // Get entire execution stack

  // Execution control
  isHalted(): boolean; // Check if VM is halted
  halt(halt: boolean): void; // Halt or resume execution

  // Error handling
  getError(): string | null; // Get current error message
  setError(message: string, stack: any): void; // Set error state

  // Program loading
  loadProgram<P extends Program>(program: P): void; // Load a program for execution
};

/**
 * Trigger type for initiating virtual machine execution.
 * Represents an event that triggers the execution of a program with associated payload data.
 */
export type Trigger<N extends string, T> = {
  name: N; // Trigger event name
  payload: T; // Event payload data
};

/**
 * Program interface for instruction sequence management.
 * Defines the contract for loading, compiling, and accessing instruction programs.
 */
export type Program = {
  load(stringCode: string): void | Promise<void>; // Load program from encoded string
  compile(stringCode: string): boolean | Promise<boolean>; // Compile and validate program
  getInstructionCalls(): InstructionCall[]; // Get all instruction calls
  getInstructionCall(index: number): InstructionCall; // Get instruction at specific index
  getInstructionsCallLen(): number; // Get total number of instructions
};
