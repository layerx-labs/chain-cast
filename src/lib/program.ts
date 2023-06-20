import { UserInputError } from '@/middleware/errors';
import { Instruction, InstructionCall, InstructionMap, Program } from '@/types/vm';
import { ErrorsEnum } from '../constants';

export class ChainCastProgram implements Program {
  private _instructionCalls: InstructionCall[] = [];
  private _supportedInstructions: InstructionMap;

  constructor(supportedInstructions: InstructionMap) {
    this._supportedInstructions = supportedInstructions;
  }

  load(instructionCalls: InstructionCall[]) {
    for (const instructionCall of instructionCalls) {
      const constructorZ = this._supportedInstructions[instructionCall.name];
      const instruction: Instruction = new constructorZ();
      if (!instruction.validateArgs(instructionCall.args)) {
        throw new UserInputError(
          'Failed to load program, configuration is wrong',
          ErrorsEnum.invalidUserInput
        );
      }
      this._instructionCalls.push(instructionCall);
    }
  }

  compile(): boolean {
    for (const instructionCall of this._instructionCalls) {
      const constructorZ = this._supportedInstructions[instructionCall.name];
      const instruction: Instruction = new constructorZ();
      if (!instruction.validateArgs(instructionCall.args)) {
        return false;
      }
    }
    return true;
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
