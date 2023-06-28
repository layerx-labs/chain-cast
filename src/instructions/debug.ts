import log from '@/services/log';
import { Instruction, VirtualMachine, InstructionArgs } from '@/types/vm';
import { z } from 'zod';

const ArgsTypeSchema = z.object({
  variablesToDebug: z.array(z.string()),
});
type ArgsType = z.infer<typeof ArgsTypeSchema>;

export class Debug implements Instruction {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateArgs(args: InstructionArgs | undefined): boolean {
    const res = ArgsTypeSchema.safeParse(args);
    if (!res.success) {
      log.d(`Failed to compile instruction debug - ${res.error}`);
      return false;
    }
    return true;
  }

  INSTRUCTION_NAME = 'debug';

  name(): string {
    return this.INSTRUCTION_NAME;
  }
  getArgsSchema(): typeof ArgsTypeSchema {
    return ArgsTypeSchema;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAction(vm: VirtualMachine): void {
    const step = vm.getCurrentStackItem();
    const args: ArgsType = {
      variablesToDebug: (step?.args?.variablesToDebug as string[]) ?? [],
    };
    for (const variable of args.variablesToDebug) {
      const value = vm.getGlobalVariableFromPath(variable);
      if (value) {
        log.d(`[${this.INSTRUCTION_NAME}] ${variable}=${value.toString()}`);
      } else {
        log.d(`[${this.INSTRUCTION_NAME}] ${variable}=undefined}`);
      }
    }
  }
}
