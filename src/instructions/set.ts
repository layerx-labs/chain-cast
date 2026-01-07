import log from '@/services/log';
import type { Instruction, InstructionArgs, VirtualMachine } from '@/types/vm';
import { z } from 'zod';

const ArgsTypeSchema = z.object({
  variable: z.string().min(2),
  value: z.any(),
});
type ArgsType = z.infer<typeof ArgsTypeSchema>;

export class Set implements Instruction {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateArgs(args: InstructionArgs | undefined): boolean {
    const res = ArgsTypeSchema.safeParse(args);
    if (!res.success) {
      log.d(`Failed to compile instruction set - ${res.error}`);
      return false;
    }
    return true;
  }

  INSTRUCTION_NAME = 'set';

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
      variable: (step?.args?.variable as string) ?? '',
      value: (step?.args?.value as string) ?? '',
    };
    if (args.value && args.variable) {
      log.d(`Setting variable ${args.variable} = ${args.value}`);
      vm.setGlobalVariable(args.variable, args.value);
    }
  }
}
