import log from '@/services/log';
import { Instruction, VirtualMachine, InstructionArgs } from '@/types/vm';
import { z } from 'zod';

type Expression = z.infer<typeof ExpressionSchema>;
type ArgsType = z.infer<typeof ArgsTypeSchema>;
type Action = z.infer<typeof ActionSchema>;

const ProgramSchema = z.array(
  z.object({
    name: z.string().min(2),
    args: z.any().optional(),
    branches: z.any(),
  })
);

const ExpressionSchema = z.object({
  variable: z.string().min(2),
  condition: z.enum(['>', '>=', '<=', '<', '=', '!=']),
  compareTo: z.string().min(2),
});

const ActionSchema = z.enum(['goto_0', 'goto_1']);

const ArgsTypeSchema = z.object({
  OR: z.array(ExpressionSchema).optional(),
  AND: z.array(ExpressionSchema).optional(),
  onTrue: ActionSchema,
  onFalse: ActionSchema,
  branch_0: ProgramSchema,
  branch_1: ProgramSchema,
});

export class Condition implements Instruction {
  INSTRUCTION_NAME = 'condition';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateArgs(args: InstructionArgs): boolean {
    const res = ArgsTypeSchema.safeParse(args);
    if (!res.success) {
      log.d(`Failed to compile instruction condition - ${res.error}`);
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
    const castID = vm.getGlobalVariable('cast')?.id;
    const castAddres = vm.getGlobalVariable('cast')?.address;
    const event = vm.getGlobalVariable('event') ?? {};

    log.d(
      `[${this.INSTRUCTION_NAME}] Event Received from ${event.event} ` +
        ` on cast ${castID} address ${castAddres}`
    );

    const args: ArgsType = {
      AND: (step?.args?.AND as Expression[]) ?? [],
      OR: (step?.args?.OR as Expression[]) ?? [],
      onTrue: step?.args?.onTrue as Action,
      onFalse: step?.args?.onFalse as Action,
      branch_0: (step?.args?.branch_0 ?? []) as any,
      branch_1: (step?.args?.branch_1 as any) ?? [],
    };

    let res = false;

    if (args.AND) {
      res = this._evaluateExpressions(vm, args.AND);
    } else if (args.OR) {
      res = !this._evaluateExpressions(vm, args.OR);
    }

    if (res == true) {
      await this._nextAction(vm, args, true);
    } else {
      await this._nextAction(vm, args, false);
    }
  }

  private async _nextAction(vm: VirtualMachine, args: ArgsType, conditionTrue: boolean) {
    switch (conditionTrue ? args?.onTrue : args?.onFalse) {
      case 'goto_0': {
        if (args.branch_0) {
          log.d(
            `[${this.INSTRUCTION_NAME}] Result is ${conditionTrue} goto_0 `,
            JSON.stringify(args.branch_0)
          );
          await vm.executeInstructions(args.branch_0);
        }
        break;
      }
      case 'goto_1':
        if (args.branch_1) {
          log.d(`[${this.INSTRUCTION_NAME}] Result is ${conditionTrue} goto_1`);
          await vm.executeInstructions(args.branch_1);
        }
        break;
    }
  }

  private _evaluateExpressions(vm: VirtualMachine, expressions: Expression[]) {
    for (const expression of expressions) {
      const variable = vm.getGlobalVariableFromPath(expression.variable);
      const operator = expression.condition;
      const compareTo = vm.getGlobalVariableFromPath(expression.compareTo);
      log.d(`Comparing ${typeof variable} ${typeof compareTo}`);
      switch (operator) {
        case '>':
          if (!(variable > compareTo)) return false;
          break;
        case '>=':
          if (!(variable >= compareTo)) return false;
          break;
        case '<=':
          if (!(variable <= compareTo)) return false;
          break;
        case '<':
          if (!(variable < compareTo)) return false;
          break;
        case '=':
          if (!(variable === compareTo)) return false;
          break;
        case '!=':
          if (!(variable !== compareTo)) return false;
          break;
      }
    }
    return true;
  }
}
