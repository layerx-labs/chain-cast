import { Web3Event } from '@/types/events';
import log from '@/services/log';
import {
  ContractCastEventProcessor,
  VirtualMachine,
  ProcessorArgs,
  ArgumentsSchema,
} from '@/types/processor';
import { z } from 'zod';

export class LoggerContractCastEventProcessor implements ContractCastEventProcessor {
  PROCESSOR_NAME = 'filter-events';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validatConf(_conf: ProcessorArgs | undefined): boolean {
    const eventNamesSchema = z.string().array().nonempty();
    const eventNames = _conf?.eventNames ?? [];
    if (!_conf || !eventNamesSchema.safeParse(eventNames).success) {
      return false;
    }
    return true;
  }

  name(): string {
    return this.PROCESSOR_NAME;
  }
  
  getArgsSchema(): ArgumentsSchema {
    return {
      eventNames: {
        type: 'string[]',
        required: true,
      },
    };
  }

  onEvent<N, T>(vm: VirtualMachine, event: Web3Event<N, T>): void {
    const step = vm.getCurrentStackItem();
    log.d(
      `[${this.PROCESSOR_NAME}] Event Received from ${event.event} ` +
        ` on cast ${vm.getCast().id} address ${vm.getCast().address}`
    );
    const eventsToForward = (step?.args?.eventNames.value as string[]) ?? [];
    if (!eventsToForward.includes(event.event as string)) {
      vm.halt(true);
    }
  }
}
