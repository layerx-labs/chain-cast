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
  compareTo: z.enum(['number', 'boolean', 'string', 'null']),
});

const ActionSchema = z.enum(['goto_0', 'goto_1', 'halt']);

const ArgsTypeSchema = z.object({
  OR: z.array(ExpressionSchema),
  AND: z.array(ExpressionSchema),
  onTrue: ActionSchema,
  onFalse: ActionSchema,
  branch_0: ProgramSchema,
  branch_1: ProgramSchema,
});

export class Condition implements Instruction {
  
  PROCESSOR_NAME = 'condition';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateArgs(args: InstructionArgs | undefined): boolean {
    if (!args || ArgsTypeSchema.safeParse(args).success) {
      return false;
    }
    return true;
  }

  name(): string {
    return this.PROCESSOR_NAME;
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
      `[${this.PROCESSOR_NAME}] Event Received from ${event.event} ` +
        ` on cast ${castID} address ${castAddres}`
    );

    const args: ArgsType = {
      AND: (step?.args?.AND as Expression[]) ?? [],
      OR: (step?.args?.OR as Expression[]) ?? [],
      onTrue: step?.args?.onTrue as Action,
      onFalse: step?.args?.onFalse as Action,
      branch_0: [],
      branch_1: [],
    };

    let res = false;

    if (args.AND) {
      res = this._evaluateExpressions(vm, args.AND);
    } else if (args.OR) {
      res = !this._evaluateExpressions(vm, args.OR);
    }

    async function nextAction(condition: Action) {
      switch (condition) {
        case 'goto_0': {
          if (args.branch_0) {
            await vm.executeInstructions(args.branch_0);
          }
          break;
        }
        case 'goto_1':
          if (args.branch_1) {
            await vm.executeInstructions(args.branch_1);
          }
          break;
        case 'halt':
          vm.halt(true);
          break;
      }
    }

    if (res == true) {
      await nextAction(args.onTrue);
    } else {
      await nextAction(args.onFalse);
    }
  }

  private _evaluateExpressions(vm: VirtualMachine, expressions: Expression[]) {
    for (const expression of expressions) {
      const variable = vm.getGlobalVariableFromPath(expression.variable);
      const operator = expression.condition;
      const compareTo = expression.compareTo;

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
