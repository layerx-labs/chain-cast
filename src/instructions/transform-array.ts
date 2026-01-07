import log from '@/services/log';
import type { Instruction, InstructionArgs, VirtualMachine } from '@/types/vm';
import { z } from 'zod';

const ArrayTransformSchema = z.object({
  variable: z.string().min(2),
  transform: z.enum(['length', 'at', 'pop', 'shift']),
  position: z.number().optional(),
  output: z.string().min(2),
});

const ArgsTypeSchema = ArrayTransformSchema;
type ArgsType = z.infer<typeof ArrayTransformSchema>;

export class TransformArray implements Instruction {
  INSTRUCTION_NAME = 'transform-array';

  validateArgs(args: InstructionArgs | undefined): boolean {
    const res = ArgsTypeSchema.safeParse(args);
    if (!res.success) {
      log.d(`Failed to compile instruction elasticsearch - ${res.error}`);
      return false;
    }
    return true;
  }

  name(): string {
    return this.INSTRUCTION_NAME;
  }
  getArgsSchema(): typeof ArgsTypeSchema {
    return ArgsTypeSchema;
  }

  async onAction(vm: VirtualMachine): Promise<void> {
    const step = vm.getCurrentStackItem();
    const castID = vm.getGlobalVariable('cast')?.id ?? '';
    log.d(`[${this.INSTRUCTION_NAME}] Action Received on cast ${castID}`);
    if (!step || !step.args) {
      return;
    }

    const args: ArgsType = {
      variable: (step?.args?.variable as string) ?? '',
      transform: (step?.args?.transform as any) ?? '',
      position: (step?.args?.position as number) ?? '',
      output: (step?.args?.output as string) ?? '',
    };

    this.arrayTransform(vm, args);
  }

  private arrayTransform(vm: VirtualMachine, array: z.infer<typeof ArrayTransformSchema>) {
    const input: any[] = vm.getGlobalVariableFromPath(array?.variable ?? '');
    const position: number = array?.position ?? 0;
    if (input) {
      let output: unknown[] | number = input;
      switch (array?.transform) {
        case 'length':
          output = input.length;
          break;
        case 'at':
          output = input.length - 1 > position ? input[position] : undefined;
          break;
        case 'pop':
          output = input.pop();
          break;
        case 'shift':
          output = input.shift();
          break;
      }
      log.d(`[${this.INSTRUCTION_NAME}] Transform Result ${array?.output} = ${output}`);
      vm.setGlobalVariable(array?.output ?? '', output);
    } else {
      log.d(`[${this.INSTRUCTION_NAME}] skipping array transform`);
    }
  }
}
