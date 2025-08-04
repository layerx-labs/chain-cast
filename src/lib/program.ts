import { UserInputError } from '@/middleware/errors';
import { Instruction, InstructionCall, InstructionMap, Program } from '@/types/vm';
import { ErrorsEnum } from '../constants';

/**
 * ChainCastProgram implements the Program interface to manage and execute
 * a sequence of instructions in the ChainCast virtual machine.
 *
 * This class is responsible for:
 * - Loading and parsing base64-encoded program code
 * - Validating instruction arguments during loading and compilation
 * - Storing the sequence of instruction calls for execution
 * - Providing access to individual instructions in the program
 *
 * Programs are encoded as base64 strings containing JSON arrays of instruction calls,
 * where each call specifies the instruction name and its arguments.
 */
export class ChainCastProgram implements Program {
  /** Array of instruction calls that make up this program */
  private _instructionCalls: InstructionCall[] = [];
  /** Map of supported instructions available for this program */
  private _supportedInstructions: InstructionMap;

  /**
   * Creates a new ChainCastProgram instance.
   *
   * @param supportedInstructions - Map of instruction names to their constructor functions
   */
  constructor(supportedInstructions: InstructionMap) {
    this._supportedInstructions = supportedInstructions;
  }

  /**
   * Loads a program from a base64-encoded string and validates all instructions.
   *
   * This method decodes the base64 string, parses the JSON program structure,
   * and validates each instruction's arguments. If any instruction validation
   * fails, the method throws a UserInputError.
   *
   * The program string should contain a JSON array of instruction calls, where
   * each call has a 'name' property (instruction name) and an 'args' property
   * (array of arguments for that instruction).
   *
   * @param stringCode - Base64-encoded string containing the program definition
   * @throws UserInputError if the program is invalid or any instruction validation fails
   */
  load(stringCode: string) {
    const calls = this._decodeCode(stringCode);
    for (const call of calls) {
      const constructorZ = this._supportedInstructions[call.name];
      const instruction: Instruction = new constructorZ();
      if (!instruction.validateArgs(call.args)) {
        throw new UserInputError(
          'Failed to load program, configuration is wrong',
          ErrorsEnum.invalidUserInput
        );
      }
      this._instructionCalls.push(call);
    }
  }

  /**
   * Compiles a program by validating all instructions without loading them.
   *
   * This method performs the same validation as load() but doesn't store the
   * instruction calls. It's useful for checking if a program is valid before
   * actually loading it.
   *
   * @param stringCode - Base64-encoded string containing the program definition
   * @returns True if the program is valid, false otherwise
   */
  compile(stringCode: string): boolean {
    const calls = this._decodeCode(stringCode);
    for (const call of calls) {
      const constructorZ = this._supportedInstructions[call.name];
      const instruction: Instruction = new constructorZ();
      if (!instruction.validateArgs(call.args)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Decodes a base64-encoded program string into an array of instruction calls.
   *
   * This private method handles the decoding and parsing of the program string.
   * It converts the base64 string to ASCII, then parses it as JSON to extract
   * the array of instruction calls.
   *
   * @param stringCode - Base64-encoded string containing the program definition
   * @returns Array of instruction call objects
   * @throws Error if the string is not valid base64 or the JSON is malformed
   */
  private _decodeCode(stringCode: string) {
    const decodedProgram = Buffer.from(stringCode, 'base64').toString('ascii');
    const calls = JSON.parse(decodedProgram);
    return calls;
  }

  /**
   * Gets all instruction calls in this program.
   *
   * @returns Array of all instruction calls in the program
   */
  getInstructionCalls(): InstructionCall[] {
    return this._instructionCalls;
  }

  /**
   * Gets a specific instruction call by its index in the program.
   *
   * @param index - Zero-based index of the instruction call to retrieve
   * @returns The instruction call at the specified index
   */
  getInstructionCall(index: number): InstructionCall {
    return this._instructionCalls[index];
  }

  /**
   * Gets the total number of instructions in this program.
   *
   * @returns The number of instruction calls in the program
   */
  getInstructionsCallLen(): number {
    return this._instructionCalls.length;
  }
}
