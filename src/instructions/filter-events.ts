import log from '@/services/log';
import { Instruction, VirtualMachine, InstructionArgs } from '@/types/vm';
import { z } from 'zod';

const ArgsTypeSchema = z.object({
  eventNames: z.string().array().nonempty(),
});

export class FilterEvents implements Instruction {
  INSTRUCTION_NAME = 'filter-events';
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
    return this.INSTRUCTION_NAME;
  }

  getArgsSchema(): typeof ArgsTypeSchema {
    return ArgsTypeSchema;
  }

  onAction(vm: VirtualMachine): void {
    const step = vm.getCurrentStackItem();
    const event = vm.getGlobalVariable('event') ?? {};
    const castID = vm.getGlobalVariable('cast')?.id ?? '';
    const castAddres = vm.getGlobalVariable('cast')?.address ?? '';
    log.d(
      `[${this.INSTRUCTION_NAME}] Event Received from ${event.event} ` +
        ` on cast ${castID} address ${castAddres}`
    );
    const eventsToForward = (step?.args?.eventNames as string[]) ?? [];
    if (!eventsToForward.includes(event.event as string)) {
      vm.halt(true);
    }
  }
}
