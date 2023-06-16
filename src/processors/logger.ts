import { Web3Event } from '@/types/events';
import log from '@/services/log';
import {
  ContractCastEventProcessor,
  EventProcessorCtx,
  ProcessorConfiguration,
} from '@/types/processor';

export class LoggerContractCastEventProcessor implements ContractCastEventProcessor {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validatConf(_conf: ProcessorConfiguration | undefined): boolean {
    return true;
  }
  PROCESSOR_NAME = 'logger';

  name(): string {
    return this.PROCESSOR_NAME;
  }
  getConfTemplate() {
    return {};
  }

  onEvent<N, T>(ctx: EventProcessorCtx, event: Web3Event<N, T>): void {
    log.d(
      `[${this.PROCESSOR_NAME}] Event Received from ${event.event} ` +
        ` on cast ${ctx.cast.id} address ${ctx.cast.address}`
    );
  }
}
