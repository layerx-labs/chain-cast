import { Web3Event } from '@/types/events';
import log from '@/services/log';
import { Instruction, VirtualMachine, InstructionArgs, ArgsSchema, Program } from '@/types/vm';

export type Expression = {
  variable: string;
  operator: '>' | '>=' | '<=' | '<' | '=' | '!=';
  compareTo: 'number' | 'boolean' | 'string' | 'null';
};

export type NextStep = 'goto_0' | 'goto_1' | 'halt';

export type ArgsType = {
  OR?: [Expression];
  AND?: [Expression];
  onTrue: NextStep;
  onFalse: NextStep;
  branch_0?: Program;
  branch_1?: Program;
};

export class IFProcessor implements Instruction {
  PROCESSOR_NAME = 'if';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateArgs(_conf: InstructionArgs | undefined): boolean {
    return true;
  }

  name(): string {
    return this.PROCESSOR_NAME;
  }

  getArgsSchema(): ArgsSchema {
    return {};
  }

  async onEvent<N extends string, T>(vm: VirtualMachine, event: Web3Event<N, T>): Promise<void> {
    const step = vm.getCurrentStackItem();
    const castID = vm.getGlobalVariable('cast.id');
    const castAddres = vm.getGlobalVariable('cast.address');
    log.d(
      `[${this.PROCESSOR_NAME}] Event Received from ${event.event} ` +
        ` on cast ${castID} address ${castAddres}`
    );

    const args: ArgsType = {
      AND: step?.args?.AND.value ?? [],
      OR: step?.args?.OR.value ?? [],
      onTrue: step?.args?.onTrue.value,
      onFalse: step?.args?.onFalse.value,
    };

    let res = false;

    if (args.AND) {
      res = this._evaluateExpressions(vm, args.AND);
    } else if (args.OR) {
      res = !this._evaluateExpressions(vm, args.OR);
    }

    async function branchOrHalt(condition: NextStep) {
      switch (condition) {
        case 'goto_0': {
          if (args.branch_0) {
            await vm.executeProgram(args.branch_0, event);
          }
          break;
        }
        case 'goto_1':
          if (args.branch_1) {
            await vm.executeProgram(args.branch_1, event);
          }
          break;
        case 'halt':
          vm.halt(true);
          break;
      }
    }

    if (res == true) {
      await branchOrHalt(args.onTrue);
    } else {
      await branchOrHalt(args.onFalse);
    }
  }

  private _evaluateExpressions(vm: VirtualMachine, expressions: [Expression]) {
    for (const expression of expressions) {
      const variable = vm.getGlobalVariable(expression.variable);
      const operator = expression.operator;
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
