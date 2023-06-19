import { Web3Event } from '@/types/events';
import log from '@/services/log';
import { Instruction, VirtualMachine, InstructionArgs, ArgsSchema } from '@/types/vm';


export type ArgsType = {
    variablesToDebug: string[];
  };


export class Debug implements Instruction {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateArgs(_conf: InstructionArgs | undefined): boolean {
    return true;
  }
  
  PROCESSOR_NAME = 'debug';

  name(): string {
    return this.PROCESSOR_NAME;
  }
  getArgsSchema(): ArgsSchema {
    return {
        variablesToDebug: {
          type: 'string[]',
          required: true,
        },        
      };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEvent<N, T>(vm: VirtualMachine, event: Web3Event<N, T>): void {
    const step = vm.getCurrentStackItem();
    const args: ArgsType = {
        variablesToDebug: (step?.args?.variablesToDebug?.value as string[]) ?? [], 
    };
    for( const variable of  args.variablesToDebug) {
        const value = vm.getGlobalVariableFromPath(variable);
        log.d(
            `[${this.PROCESSOR_NAME}] ${variable}=${value}`
          );
    }
  }
}
