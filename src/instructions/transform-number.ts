import { z } from 'zod';
import log from '@/services/log';
import { Instruction, InstructionArgs, VirtualMachine } from '@/types/vm';

const NumberTransformSchema = z.object({
  variableLeft: z.string().min(2),
  variableRight: z.string().min(2).optional(),
  transform: z.enum(['add', 'subtract', 'multiply', 'divide', 'pow', 'bigint']),
  output: z.string().min(2),
});

const ArgsTypeSchema = NumberTransformSchema;
type ArgsType = z.infer<typeof NumberTransformSchema>;

export class TransformNumber implements Instruction {
  INSTRUCTION_NAME = 'transform-number';

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
      variableLeft: (step?.args?.variable as string) ?? '',
      variableRight: (step?.args?.variableRight as string) ?? '',
      transform: (step?.args?.transform as any) ?? '',
      output: (step?.args?.output as string) ?? '',
    };
    this.numberTransform(vm, args);
  }

  private numberTransform(vm: VirtualMachine, number: z.infer<typeof NumberTransformSchema>) {
    const input1: number = vm.getGlobalVariableFromPath(number?.variableLeft ?? '');
    const input2: number = vm.getGlobalVariableFromPath(number?.variableRight ?? '') || 0;

    if (input1 && typeof input1 === 'number') {
      let output: number | bigint = input1;
      switch (number?.transform) {
        case 'add':
          output = input1 + input2;
          break;
        case 'subtract':
          output = input1 - input2;
          break;
        case 'multiply':
          output = input1 * input2;
          break;
        case 'divide':
          output = input1 / input2;
          break;
        case 'pow':
          output = Math.pow(input1, input2);
          break;
        case 'bigint':
          output = BigInt(input1);
          break;
      }
      log.d(`[${this.INSTRUCTION_NAME}] Transform Result ${number?.output} = ${output}`);
      vm.setGlobalVariable(number?.output ?? '', output);
    } else {
      log.d(`[${this.INSTRUCTION_NAME}] skipping number transform ${typeof input1}`);
    }
  }
}
