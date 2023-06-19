import log from '@/services/log';
import { Instruction, VirtualMachine, InstructionArgs, ArgsSchema } from '@/types/vm';
import { z } from 'zod';

export class FilterEventsProcessor implements Instruction {
  PROCESSOR_NAME = 'filter-events';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateArgs(_conf: InstructionArgs | undefined): boolean {
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

  getArgsSchema(): ArgsSchema {
    return {
      eventNames: {
        type: 'string[]',
        required: true,
      },
    };
  }

  onAction(vm: VirtualMachine): void {
    const step = vm.getCurrentStackItem();
    const event = vm.getGlobalVariable('event')  ?? {};
    const castID = vm.getGlobalVariable('cast')?.id ?? '' ;
    const castAddres = vm.getGlobalVariable('cast')?.address ?? '';
    log.d(
      `[${this.PROCESSOR_NAME}] Event Received from ${event.event} ` +
        ` on cast ${castID} address ${castAddres}`
    );
    const eventsToForward = (step?.args?.eventNames.value as string[]) ?? [];
    if (!eventsToForward.includes(event.event as string)) {
      vm.halt(true);
    }
  }
}
