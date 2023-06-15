import { ChainCastEventProcessor, Web3Event } from "@/types/events";

import log from '@/services/log';

export class LoggerChainCastEventProcessor implements ChainCastEventProcessor {

  PLUGIN_NAME= 'Chain Cast Logger';

  name(): string {
    return this.PLUGIN_NAME;
  }
  onEvent<N, T>(
    cast: { id: string; chainId: number; address: string },
    event: Web3Event<N, T>
  ): void {
    log.d(`[${this.PLUGIN_NAME}] Event Received from ${event.event} ` + 
          ` on cast ${cast.id} address ${cast.address}`);
  }
}