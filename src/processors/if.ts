import { Web3Event } from '@/types/events';
import log from '@/services/log';
import {
  ContractCastEventProcessor,
  VirtualMachine,
  ProcessorArgs,
  ArgumentsSchema,
} from '@/types/processor';
import { z } from 'zod';

export class IFProcessor implements ContractCastEventProcessor {
  
  PROCESSOR_NAME = 'if';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validatConf(_conf: ProcessorArgs | undefined): boolean {
    return true;
  }

  name(): string {
    return this.PROCESSOR_NAME;
  }
  
  getArgsSchema(): ArgumentsSchema {
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
    log.d(
      `[${this.PROCESSOR_NAME}] Event Received from ${event.event} ` +
        ` on cast ${vm.getCast().id} address ${vm.getCast().address}`
    );
    const eventsToForward = (step?.args?.variable.value as string) ?? "";
    // TODO 
  }
}
