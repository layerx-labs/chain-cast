import { z } from 'zod';
import log from '@/services/log';
import { Instruction, InstructionArgs, VirtualMachine } from '@/types/vm';
import inflection from 'inflection';

const TextTransformSchema = z.object({
  variable: z.string().min(2),
  transform: z.enum([
    'capitalize',
    'lowercase',
    'trim',
    'uppercase',
    'uppercase',
    'camelize',
    'underscore',
    'dasherize',
    'bigint',
    'int',
    'number',
    'split',
  ]),
  split: z.string().min(1).optional(),
  output: z.string().min(2),
});

const ArgsTypeSchema = TextTransformSchema;
type ArgsType = z.infer<typeof TextTransformSchema>;

export class TransformString implements Instruction {
  INSTRUCTION_NAME = 'transform-string';

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
      split: (step?.args?.split as string) ?? '',
      output: (step?.args?.output as string) ?? '',
    };

    this.textTransform(vm, args);
  }

  private textTransform(vm: VirtualMachine, text: z.infer<typeof TextTransformSchema>) {
    const inputText: string = vm.getGlobalVariableFromPath(text?.variable ?? '');
    if (inputText && typeof inputText === 'string') {
      let output: string | number | bigint | any[] = inputText;
      switch (text?.transform) {
        case 'capitalize':
          output = inflection.capitalize(inputText);
          break;
        case 'lowercase':
          output = inputText.toLowerCase();
          break;
        case 'trim':
          output = inputText.trim();
          break;
        case 'uppercase':
          output = inputText.toUpperCase();
          break;
        case 'camelize':
          output = inflection.camelize(inputText);
          break;
        case 'underscore':
          output = inflection.underscore(inputText);
          break;
        case 'dasherize':
          output = inflection.dasherize(inputText);
          break;
        case 'bigint':
          output = BigInt(inputText);
          break;
        case 'int':
          output = parseInt(inputText);
          break;
        case 'number':
          output = Number(inputText);
          break;
        case 'split':
          output = inputText.split(text?.split ?? ',');
          break;
      }
      log.d(`[${this.INSTRUCTION_NAME}] Transform Result ${text?.output} = ${output}`);
      vm.setGlobalVariable(text?.output ?? '', output);
    } else {
      log.d(`[${this.INSTRUCTION_NAME}] skipping text transform ${typeof inputText}`);
    }
  }
}
