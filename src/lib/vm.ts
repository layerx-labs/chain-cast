import { Stack } from '@/lib/stack';
import log from '@/services/log';
import type {
  InstructionCall,
  InstructionMap,
  Program,
  Trigger,
  VariableDict,
  VirtualMachine,
} from '@/types/vm';
import { getVariableFromPath } from '@/util/vm';
import type { CastInfo } from '../types';

/**
 * ChainCastVirtualMachine implements the VirtualMachine interface to execute
 * programs consisting of a sequence of instructions in response to blockchain events.
 *
 * This virtual machine provides a sandboxed environment for executing user-defined
 * programs that process blockchain events. It maintains:
 * - Global variables accessible to all instructions
 * - A call stack for tracking instruction execution
 * - Error handling and halting mechanisms
 * - State management for program execution
 *
 * The VM executes programs by:
 * 1. Loading a program (sequence of instructions)
 * 2. Setting up the execution context with global variables
 * 3. Executing each instruction in sequence
 * 4. Handling errors and maintaining execution state
 *
 * @template CI - Type of CastInfo that provides context for the virtual machine
 */
export class ChainCastVirtualMachine<CI extends CastInfo> implements VirtualMachine {
  /** Map of supported instructions available for execution */
  private _supportedInstructions: InstructionMap;
  /** Currently loaded program to execute */
  private _program: Program | null = null;
  /** Cast information providing context for this VM instance */
  private _info: CI;

  // Virtual Machine Temporary Context
  /** Current error message, if any */
  private _error: string | null = null;
  /** Error stack trace for debugging */
  private _errorStack: any = null;
  /** Flag indicating if the VM has been halted */
  private _halt = false;
  /** The instruction that caused the halt or error */
  private _stoppedByInstruction: InstructionCall | null = null;
  /** Snapshot of executed instructions when halt/error occurred */
  private _executedBacktrace: InstructionCall[] = [];
  /** Global variables accessible to all instructions */
  private _globalVariables: VariableDict = {};
  /** Call stack for tracking instruction execution */
  private _stack: Stack<InstructionCall>;

  /**
   * Creates a new ChainCastVirtualMachine instance.
   *
   * @param info - Cast information providing context for this VM
   * @param supportedInstructions - Map of instruction names to their constructors
   */
  constructor(info: CI, supportedInstructions: InstructionMap) {
    this._supportedInstructions = supportedInstructions;
    this._info = info;
    this._stack = new Stack<InstructionCall>();
  }

  /**
   * Gets all global variables currently set in the VM.
   *
   * @returns Object containing all global variables
   */
  getGlobalVariables(): VariableDict {
    return this._globalVariables;
  }

  /**
   * Gets a specific global variable by name.
   *
   * @param name - Name of the global variable to retrieve
   * @returns The value of the global variable, or undefined if not found
   */
  getGlobalVariable(name: string) {
    return this._globalVariables[name];
  }

  /**
   * Gets a global variable using a dot-notation path.
   *
   * This method allows accessing nested object properties using dot notation,
   * e.g., "user.profile.name" would access the 'name' property of the 'profile'
   * object within the 'user' global variable.
   *
   * @param path - Dot-notation path to the variable (e.g., "user.profile.name")
   * @returns The value at the specified path, or undefined if not found
   */
  getGlobalVariableFromPath(path: string) {
    return getVariableFromPath(path, this._globalVariables);
  }

  /**
   * Sets a global variable that will be accessible to all instructions.
   *
   * @param name - Name of the global variable
   * @param value - Value to assign to the global variable
   */
  setGlobalVariable(name: string, value: any) {
    this._globalVariables[name] = value;
  }

  /**
   * Gets the current instruction call being executed.
   *
   * @returns The current instruction call, or undefined if no instruction is being executed
   */
  getCurrentStackItem(): InstructionCall | undefined {
    return this._stack.peek();
  }

  /**
   * Gets all instruction calls currently on the execution stack.
   *
   * @returns Array of instruction calls in the stack (bottom to top)
   */
  getStack(): InstructionCall[] {
    return this._stack.getAll();
  }

  /**
   * Checks if the virtual machine has been halted.
   *
   * @returns True if the VM is halted, false otherwise
   */
  isHalted(): boolean {
    return this._halt;
  }

  /**
   * Sets the halt state of the virtual machine.
   *
   * When halted, the VM will stop executing instructions and roll back
   * any pending operations.
   *
   * @param halt - True to halt the VM, false to allow execution
   */
  halt(halt: boolean): void {
    this._halt = halt;
    if (halt) {
      this._stoppedByInstruction = this.getCurrentStackItem() ?? null;
      this._executedBacktrace = [...this.getStack()];
    }
  }

  /**
   * Gets the current error message, if any.
   *
   * @returns The current error message, or null if no error
   */
  getError(): string | null {
    return this._error;
  }

  /**
   * Sets an error message and stack trace for the virtual machine.
   *
   * @param message - Error message to set
   * @param stack - Stack trace or additional error context
   */
  setError(message: string, stack: any): void {
    this._error = message;
    this._errorStack = stack;
    this._stoppedByInstruction = this.getCurrentStackItem() ?? null;
    this._executedBacktrace = [...this.getStack()];
  }

  /**
   * Loads a program into the virtual machine for execution.
   *
   * @param program - The program to load and execute
   */
  loadProgram<P extends Program>(program: P): void {
    this._program = program;
  }

  /**
   * Executes a single instruction in the virtual machine.
   *
   * This method:
   * 1. Checks if the VM is halted or has errors
   * 2. Pushes the instruction onto the call stack
   * 3. Creates and executes the instruction
   * 4. Pops the instruction from the stack when complete
   *
   * @param step - The instruction call to execute
   */
  async executeInstruction(step: InstructionCall): Promise<void> {
    if (!this._halt && !this._error) {
      const constructorZ = this._supportedInstructions[step.name];
      const instruction = new constructorZ();
      this._stack.push(step);
      await instruction.onAction(this);
      this._stack.pop();
    } else {
      this._logExecutionStopped(step);
    }
  }

  /**
   * Logs detailed context when VM execution is stopped due to halt or error.
   *
   * @param skippedStep - The instruction that was skipped due to halt/error
   */
  private _logExecutionStopped(skippedStep: InstructionCall): void {
    const castId = this._info.getId();
    const stoppedBy = this._stoppedByInstruction?.name ?? 'unknown';
    const backtrace = this._formatStackBacktrace(this._executedBacktrace);

    // Get event context for additional debugging info
    const event = this._globalVariables.event as
      | { event?: string; blockNumber?: number }
      | undefined;
    const eventName = event?.event ?? 'unknown';
    const blockNumber = event?.blockNumber ?? 'unknown';

    if (this._error) {
      // Log error with full context including event info
      log.e(
        `[VM Error] Cast=${castId} | Event="${eventName}" Block=${blockNumber} | ` +
          `Instruction="${stoppedBy}" | Error: ${this._error}`
      );
      log.e(`[VM Error] Backtrace:\n${backtrace}`);
      if (this._errorStack) {
        log.e(`[VM Error] Stack trace:\n${this._errorStack}`);
      }
      log.d(`[VM Error] Skipping instruction "${skippedStep.name}" due to previous error`);
    } else if (this._halt) {
      // Halted (intentional, e.g., filter-events)
      log.d(
        `[VM Halt] Cast=${castId} | Event="${eventName}" Block=${blockNumber} | ` +
          `Halted by instruction="${stoppedBy}" | Skipping "${skippedStep.name}"`
      );
      log.d(`[VM Halt] Backtrace:\n${backtrace}`);
    }
  }

  /**
   * Formats the instruction stack as a readable backtrace string.
   *
   * @param stack - Array of instruction calls in execution order
   * @returns Formatted backtrace string
   */
  private _formatStackBacktrace(stack: InstructionCall[]): string {
    if (stack.length === 0) {
      return '  (empty stack)';
    }
    return stack
      .map((call, index) => {
        const argsStr = call.args ? JSON.stringify(call.args) : '{}';
        const truncatedArgs = argsStr.length > 100 ? `${argsStr.substring(0, 100)}...` : argsStr;
        return `  #${index} ${call.name} args=${truncatedArgs}`;
      })
      .join('\n');
  }

  /**
   * Executes the loaded program in response to a trigger event.
   *
   * This method is the main entry point for program execution. It:
   * 1. Validates that a program is loaded
   * 2. Sets the trigger event as a global variable
   * 3. Executes all instructions in the program
   * 4. Handles any errors that occur during execution
   * 5. Reinitializes the VM state after execution
   *
   * @param trigger - The trigger event that caused program execution
   */
  async execute<N extends string, T>(trigger: Trigger<N, T>) {
    if (!this._program) {
      log.w(`No program loaded to execute on ${this._info.getId()}`);
      return;
    }
    log.d(`Executing Program for ${this._info.getId()}  `);
    try {
      this.setGlobalVariable(trigger.name, trigger.payload);
      await this.executeInstructions(this._program.getInstructionCalls());
    } catch (e: unknown) {
      const error = e as Error;
      log.e(
        `Failed to execute Program ${this._info.getId()} ` +
          `on Step ${this.getCurrentStackItem()?.name} ${error.message} ${error.stack}`
      );
    } finally {
      // Reinitialize Virtual Machine State
      this._initVM();
    }
  }

  /**
   * Reinitializes the virtual machine state after program execution.
   *
   * This method clears all temporary state including errors, halt flag,
   * global variables, and the call stack to prepare for the next execution.
   */
  private _initVM() {
    this._error = null;
    this._errorStack = null;
    this._halt = false;
    this._stoppedByInstruction = null;
    this._executedBacktrace = [];
    this._globalVariables = {};
    this._stack.clear();
  }

  /**
   * Executes a sequence of instructions in order.
   *
   * @param instructionCalls - Array of instruction calls to execute
   */
  async executeInstructions(instructionCalls: InstructionCall[]): Promise<void> {
    for (const call of instructionCalls) {
      await this.executeInstruction(call);
    }
  }
}
