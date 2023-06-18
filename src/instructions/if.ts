import { Web3Event } from '@/types/events';
import log from '@/services/log';
import {
  Instruction,
  VirtualMachine,
  InstructionArgs,
  ArgsSchema,
} from '@/types/vm';
import { z } from 'zod';

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
    return {
      variable: {
        type: 'string',
        required: true,
      },
      operator: {
        type: 'string',
        required: true,
      },
      compareTo: {
        type: 'any',
        required: true,
      },
      onTrue: {
        type: "string",
        required: true,
      },
      onFalse: {
        type: "string",
        required: true,
      }
    };
  }

  onEvent<N, T>(vm: VirtualMachine, event: Web3Event<N, T>): void {
    const step = vm.getCurrentStackItem();
    const castID = vm.getGlobalVariable('cast.id');
    const castAddres = vm.getGlobalVariable('cast.address');

    log.d(
      `[${this.PROCESSOR_NAME}] Event Received from ${event.event} ` +
        ` on cast ${castID} address ${castAddres}`
    );
    const eventsToForward = (step?.args?.variable.value as string) ?? "";
    // TODO 
    throw Error("TODO");
  }
}
