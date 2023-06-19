import log from '@/services/log';
import { Instruction, VirtualMachine, InstructionArgs } from '@/types/vm';

export class Logger implements Instruction {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateArgs(_conf: InstructionArgs | undefined): boolean {
    return true;
  }
  PROCESSOR_NAME = 'logger';

  name(): string {
    return this.PROCESSOR_NAME;
  }
  getArgsSchema() {
    return {};
  }

  onAction(vm: VirtualMachine): void {
    const event = vm.getGlobalVariable('event') ?? {};
    const castID = vm.getGlobalVariable('cast').id ?? '';
    const castAddress = vm.getGlobalVariable('cast').address ?? '';
    log.d(
      `[${this.PROCESSOR_NAME}] Event Received from ${event.event} ` +
        ` on cast ${castID} address ${castAddress}`
    );
  }
}
