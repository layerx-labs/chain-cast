import { z } from 'zod';
import log from '@/services/log';
import { Instruction, InstructionArgs, VirtualMachine } from '@/types/vm';
import inflection from 'inflection';

const TextTransformSchema = z
  .object({
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
    ]),
    output: z.string().min(2),
  })
  .optional();

const NumberTransformSchema = z
  .object({
    variableLeft: z.string().min(2),
    variableRight: z.string().min(2).optional(),
    transform: z.enum(['add', 'subtract', 'multiply', 'divide', 'pow', 'bigint']),
    output: z.string().min(2),
  })
  .optional();

const ArrayTransformSchema = z
  .object({
    variable: z.string().min(2),
    transform: z.enum(['length', 'at', 'pop', 'shift']),
    position: z.number().optional(),
    output: z.string().min(2),
  })
  .optional();

const ObjectTransformSchema = z
  .object({
    variable: z.string().min(2),
    transform: z.enum(['keys', 'values', 'delete', 'value']),
    key: z.string().min(2).optional(),
    output: z.string().min(2),
  })
  .optional();

const ArgsTypeSchema = z.object({
  number: NumberTransformSchema,
  text: TextTransformSchema,
  array: ArrayTransformSchema,
  obj: ObjectTransformSchema,
});

type ArgsType = z.infer<typeof ArgsTypeSchema>;

export class Transform implements Instruction {
  INSTRUCTION_NAME = 'transform';

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
    const args: ArgsType = step.args;
    if (args.text) {
      log.d(
        `[${this.INSTRUCTION_NAME}] Text Transfrom ${args.text.variable} ${args.text.transform}`
      );
      this.textTransform(vm, args.text);
    } else if (args.number) {
      log.d(
        `[${this.INSTRUCTION_NAME}] Text Transfrom ` + 
        `${args.number.variableLeft} ${args.number.transform}`
      );
      this.numberTransform(vm, args.number);
    } else if (args.array) {
      log.d(
        `[${this.INSTRUCTION_NAME}] Array Transfrom ${args.array.variable} ${args.array.transform}`
      );
      this.arrayTransform(vm, args.array);
    } else if (args.obj) {
      log.d(`[${this.INSTRUCTION_NAME}] Obj Transfrom ${args.obj.variable} ${args.obj.transform}`);
      this.arrayTransform(vm, args.array);
      this.objTransform(vm, args.obj);
    }
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

  private textTransform(vm: VirtualMachine, text: z.infer<typeof TextTransformSchema>) {
    const inputText: string = vm.getGlobalVariableFromPath(text?.variable ?? '');
    if (inputText && typeof inputText === 'string') {
      let output: string | number | bigint = inputText;
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
      }
      log.d(`[${this.INSTRUCTION_NAME}] Transform Result ${text?.output} = ${output}`);
      vm.setGlobalVariable(text?.output ?? '', output);
    } else {
      log.d(`[${this.INSTRUCTION_NAME}] skipping text transform ${typeof inputText}`);
    }
  }
}
