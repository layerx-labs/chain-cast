import { UserInputError } from '@/middleware/errors';
import { Instruction, InstructionCall, InstructionMap, Program } from '@/types/vm';
import { ErrorsEnum } from '../constants';

export class ChainCastProgram implements Program {
  private _instructionCalls: InstructionCall[] = [];
  private _supportedInstructions: InstructionMap;

  constructor(supportedInstructions: InstructionMap) {
    this._supportedInstructions = supportedInstructions;
  }

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

  private _decodeCode(stringCode: string) {
    const decodedProgram = Buffer.from(stringCode, 'base64').toString('ascii');
    const calls = JSON.parse(decodedProgram);
    return calls;
  }

  getInstructionCalls(): InstructionCall[] {
    return this._instructionCalls;
  }
  getInstructionCall(index: number): InstructionCall {
    return this._instructionCalls[index];
  }
  getInstructionsCallLen(): number {
    return this._instructionCalls.length;
  }
}
