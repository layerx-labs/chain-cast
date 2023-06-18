import { Web3Event } from '@/types/events';
import log from '@/services/log';
import { Instruction, VirtualMachine, InstructionArgs } from '@/types/vm';

export class LoggerContractCastEventProcessor implements Instruction {
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

  onEvent<N, T>(vm: VirtualMachine, event: Web3Event<N, T>): void {
    const castID = vm.getGlobalVariable('cast.id');
    const castAddres = vm.getGlobalVariable('cast.address');
    log.d(
      `[${this.PROCESSOR_NAME}] Event Received from ${event.event} ` +
        ` on cast ${castID} address ${castAddres}`
    );
  }
}
