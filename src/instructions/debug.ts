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
    if (!args || ArgsTypeSchema.safeParse(args).success) {
      return false;
    }
    return true;
  }

  PROCESSOR_NAME = 'debug';

  name(): string {
    return this.PROCESSOR_NAME;
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
      log.d(`[${this.PROCESSOR_NAME}] ${variable}=${value.toString()}`);
    }
  }
}
