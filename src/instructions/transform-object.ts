import { z } from 'zod';
import log from '@/services/log';
import { Instruction, InstructionArgs, VirtualMachine } from '@/types/vm';

const ObjectTransformSchema = z.object({
  variable: z.string().min(2),
  transform: z.enum(['keys', 'values', 'delete', 'value']),
  key: z.string().min(2).optional(),
  output: z.string().min(2),
});

const ArgsTypeSchema = ObjectTransformSchema;
type ArgsType = z.infer<typeof ObjectTransformSchema>;

export class TransformObject implements Instruction {
  INSTRUCTION_NAME = 'transform-object';

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
      key: (step?.args?.key as string) ?? '',
      output: (step?.args?.output as string) ?? '',
    };

    log.d(`[${this.INSTRUCTION_NAME}] Obj Transfrom ${args.variable} ${args.transform}`);
    this.objTransform(vm, args);
  }

  private objTransform(vm: VirtualMachine, obj: z.infer<typeof ObjectTransformSchema>) {
    const input = vm.getGlobalVariableFromPath(obj?.variable ?? '') || {};
    const key: string | symbol | number = vm.getGlobalVariableFromPath(obj?.key ?? '') as string;
    if (input) {
      let output: unknown = input;
      switch (obj?.transform) {
        case 'keys':
          output = Object.keys(input);
          break;
        case 'values':
          output = Object.values(input);
          break;
        case 'delete':
          output = delete input[key];
          break;
        case 'value':
          output = input[key];
          break;
      }
      log.d(`[${this.INSTRUCTION_NAME}] Transform Result ${obj?.output} = ${output}`);
      vm.setGlobalVariable(obj?.output ?? '', output);
    } else {
      log.d(`[${this.INSTRUCTION_NAME}] skipping obj transform`);
    }
  }
}
